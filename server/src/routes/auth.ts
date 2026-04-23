import { Hono } from 'hono';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { env } from '../config/env.js';
import { sendEmailVerification } from '../services/emailService.js';
import { trackSession, getUserSessions, revokeSession, revokeAllOtherSessions } from '../services/sessionService.js';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { toDataURL } from 'qrcode';
import crypto from 'crypto';
import type { AppEnv } from '../middleware/auth.js';

/** Hash a backup code with SHA-256 for secure storage */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase().trim()).digest('hex');
}

const auth = new Hono<AppEnv>();

// ─── 2FA Challenge Store (in-memory, expires after 5 min) ───
interface TwoFactorChallenge {
  userId: string;
  sessionData: {
    access_token: string;
    refresh_token: string;
    expires_at: number | undefined;
    user: { id: string; email: string | undefined };
  };
  expiresAt: number;
}
const twoFactorChallenges = new Map<string, TwoFactorChallenge>();

/** Remove expired challenges to prevent memory leaks */
function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [key, challenge] of twoFactorChallenges) {
    if (challenge.expiresAt <= now) {
      twoFactorChallenges.delete(key);
    }
  }
}
// Cleanup every 60 seconds
setInterval(cleanupExpiredChallenges, 60_000).unref();

// POST /auth/signup — register new user (sends branded verification email via Resend)
auth.post('/signup', rateLimit(5, 60_000), async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'El cuerpo de la solicitud no es JSON válido' }, 400);
  }
  const { email, password, nombre, apellidos, username, telefono, direccion, ciudad, codigo_postal, provincia, pais } = body;

  if (!email || !password || !nombre || !username) {
    return c.json({ error: 'Email, contraseña, nombre y nombre de usuario son requeridos' }, 400);
  }

  // Validate password strength
  const passwordErrors: string[] = [];
  if (password.length < 8) passwordErrors.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(password)) passwordErrors.push('una letra mayúscula');
  if (!/[a-z]/.test(password)) passwordErrors.push('una letra minúscula');
  if (!/[0-9]/.test(password)) passwordErrors.push('un número');
  if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('un carácter especial');
  if (passwordErrors.length > 0) {
    return c.json({ error: `La contraseña debe contener: ${passwordErrors.join(', ')}` }, 400);
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return c.json({ error: 'El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números y _)' }, 400);
  }

  // Check username uniqueness
  const { data: existingUser } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    return c.json({ error: 'Este nombre de usuario ya está en uso' }, 409);
  }

  // Create user WITHOUT auto-confirming email
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { nombre, apellidos: apellidos || '', username: username.toLowerCase(), telefono, direccion, ciudad, codigo_postal, provincia, pais, role: 'customer' },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return c.json({ error: 'Este email ya está registrado' }, 409);
    }
    return c.json({ error: error.message }, 400);
  }

  // Generate confirmation link via Supabase
  try {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    if (linkError) throw linkError;

    // Build the confirmation URL pointing to our frontend
    const token = linkData.properties?.hashed_token;
    const confirmationUrl = token
      ? `${env.APP_URL}?verification_token=${token}&type=signup`
      : linkData.properties?.action_link || `${env.APP_URL}`;

    // Send branded email via Resend
    await sendEmailVerification({
      customerName: nombre,
      customerEmail: email,
      confirmationUrl,
    });
  } catch (emailErr) {
    console.error('[auth/signup] Error sending verification email:', emailErr);
    // User was created but email failed — don't block signup
  }

  return c.json({ user: { id: data.user.id, email: data.user.email }, verificationRequired: true }, 201);
});

// POST /auth/resend-verification — resend branded verification email
auth.post('/resend-verification', rateLimit(3, 60_000), async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email requerido' }, 400);

  try {
    // Look up user to get their name
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if email exists
      return c.json({ message: 'Si el email existe, recibirás un enlace de verificación' });
    }

    // Already confirmed? No need to resend
    if (user.email_confirmed_at) {
      return c.json({ message: 'Si el email existe, recibirás un enlace de verificación' });
    }

    // Use magiclink type for resend (doesn't require password)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError) throw linkError;

    const token = linkData.properties?.hashed_token;
    const confirmationUrl = token
      ? `${env.APP_URL}?verification_token=${token}&type=magiclink`
      : linkData.properties?.action_link || `${env.APP_URL}`;

    const nombre = user.user_metadata?.nombre || 'Usuario';

    await sendEmailVerification({
      customerName: nombre,
      customerEmail: email,
      confirmationUrl,
    });
  } catch (err) {
    console.error('[auth/resend-verification] Error:', err);
  }

  // Always return success to prevent email enumeration
  return c.json({ message: 'Si el email existe, recibirás un enlace de verificación' });
});

// POST /auth/verify-email — confirm email with token
auth.post('/verify-email', async (c) => {
  const { token, type } = await c.req.json();
  if (!token) return c.json({ error: 'Token requerido' }, 400);

  try {
    const otpType = type === 'magiclink' ? 'magiclink' : 'email';
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: otpType,
    });

    if (error) {
      return c.json({ error: 'El enlace de verificación no es válido o ha expirado' }, 400);
    }

    return c.json({
      message: 'Email verificado correctamente',
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (err) {
    return c.json({ error: 'Error al verificar el email' }, 500);
  }
});

// POST /auth/login — sign in (supports email or username)
auth.post('/login', rateLimit(10, 60_000), async (c) => {
  const { email: identifier, password } = await c.req.json();

  if (!identifier || !password) {
    return c.json({ error: 'Email/usuario y contraseña requeridos' }, 400);
  }

  // Resolve identifier to email: if it's not an email, look up username
  let loginEmail = identifier;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (!isEmail) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', identifier.toLowerCase())
      .maybeSingle();

    if (!profile) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    // Get email from auth.users via admin API
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userErr || !userData?.user?.email) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }
    loginEmail = userData.user.email;
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email: loginEmail, password });

  if (error) {
    return c.json({ error: 'Credenciales inválidas' }, 401);
  }

  // Check if user has 2FA enabled
  const { data: twoFaProfile } = await supabaseAdmin
    .from('profiles')
    .select('two_factor_enabled')
    .eq('id', data.user.id)
    .single();

  if (twoFaProfile?.two_factor_enabled) {
    // Generate a temporary challenge token — do NOT return session tokens
    const challengeToken = crypto.randomBytes(32).toString('hex');
    twoFactorChallenges.set(challengeToken, {
      userId: data.user.id,
      sessionData: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: { id: data.user.id, email: data.user.email },
      },
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return c.json({ requires_2fa: true, challenge_token: challengeToken });
  }

  // Track session asynchronously (don't block login response)
  const ua = c.req.header('User-Agent');
  const ip = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || c.req.header('X-Real-IP') || '0.0.0.0';
  trackSession(data.user.id, data.session.access_token, ua, ip).catch(err =>
    console.error('[auth/login] session tracking failed:', err)
  );

  return c.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});

// POST /auth/logout — sign out
auth.post('/logout', authMiddleware, async (c) => {
  const token = c.get('token');
  await supabaseAdmin.auth.admin.signOut(token);
  return c.json({ message: 'Sesión cerrada' });
});

// GET /auth/me — get current user profile
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(error.message);

  return c.json({ ...profile, email: user.email });
});

// PUT /auth/me — update profile
auth.put('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const { nombre, apellidos, telefono, username } = await c.req.json();

  const updateData: Record<string, any> = {};
  if (nombre !== undefined) updateData.nombre = nombre;
  if (apellidos !== undefined) updateData.apellidos = apellidos;
  if (telefono !== undefined) updateData.telefono = telefono;

  if (username !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return c.json({ error: 'El nombre de usuario debe tener entre 3 y 20 caracteres (letras, números y _)' }, 400);
    }
    // Check uniqueness (excluding current user)
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return c.json({ error: 'Este nombre de usuario ya está en uso' }, 409);
    }
    updateData.username = username.toLowerCase();
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data);
});

// POST /auth/change-password
auth.post('/change-password', authMiddleware, async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword } = await c.req.json();

  if (!currentPassword) {
    return c.json({ error: 'La contraseña actual es requerida' }, 400);
  }

  if (!newPassword) {
    return c.json({ error: 'La nueva contraseña es requerida' }, 400);
  }

  // Verify current password
  const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return c.json({ error: 'Contraseña actual incorrecta' }, 401);
  }

  // Server-side password strength validation
  const passwordErrors: string[] = [];
  if (newPassword.length < 8) passwordErrors.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(newPassword)) passwordErrors.push('una letra mayúscula');
  if (!/[a-z]/.test(newPassword)) passwordErrors.push('una letra minúscula');
  if (!/[0-9]/.test(newPassword)) passwordErrors.push('un número');
  if (!/[^A-Za-z0-9]/.test(newPassword)) passwordErrors.push('un carácter especial');

  if (passwordErrors.length > 0) {
    return c.json({ error: `La contraseña debe contener: ${passwordErrors.join(', ')}` }, 400);
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ message: 'Contraseña actualizada' });
});

// POST /auth/forgot-password
auth.post('/forgot-password', rateLimit(3, 60_000), async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email requerido' }, 400);

  // Always return success to prevent email enumeration
  await supabaseAdmin.auth.resetPasswordForEmail(email);
  return c.json({ message: 'Si el email existe, recibirás instrucciones' });
});

// ─── Session management ───

// GET /auth/sessions — list active sessions for the current user
auth.get('/sessions', authMiddleware, async (c) => {
  const user = c.get('user');
  const token = c.get('token');
  const ua = c.req.header('User-Agent');

  // Also track this request as activity for the current session
  const ip = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || c.req.header('X-Real-IP') || '0.0.0.0';
  await trackSession(user.id, token, ua, ip);

  const sessions = await getUserSessions(user.id, token, ua);
  return c.json({ sessions });
});

// DELETE /auth/sessions/:sessionId — revoke a specific session
auth.delete('/sessions/:sessionId', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('sessionId')!;

  await revokeSession(sessionId, user.id);
  return c.json({ message: 'Sesión revocada' });
});

// DELETE /auth/sessions — revoke all sessions except the current one
auth.delete('/sessions', authMiddleware, async (c) => {
  const user = c.get('user');
  const token = c.get('token');
  const ua = c.req.header('User-Agent');

  await revokeAllOtherSessions(user.id, token, ua);
  return c.json({ message: 'Todas las demás sesiones han sido cerradas' });
});

// ─── Two-Factor Authentication (2FA/TOTP) ───

// GET /auth/2fa/status — check 2FA status for current user
auth.get('/2fa/status', authMiddleware, async (c) => {
  const user = c.get('user');

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('two_factor_enabled, two_factor_secret, backup_codes')
    .eq('id', user.id)
    .single();

  if (error) return c.json({ error: error.message }, 500);

  const enabled = profile?.two_factor_enabled ?? false;
  const hasSecret = !!profile?.two_factor_secret;
  const backupCodes = profile?.backup_codes ?? [];

  return c.json({
    enabled,
    hasBackupCodes: backupCodes.length > 0,
    backupCodesCount: backupCodes.length,
    setupInProgress: hasSecret && !enabled,
  });
});

// POST /auth/2fa/setup — generate TOTP secret and QR code
auth.post('/2fa/setup', authMiddleware, async (c) => {
  const user = c.get('user');

  const secret = generateSecret();

  // Store secret but don't enable yet (requires verification)
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ two_factor_secret: secret })
    .eq('id', user.id);

  if (error) return c.json({ error: error.message }, 500);

  const otpauthUrl = generateURI({ issuer: 'GenStore', label: user.email, secret });
  const qrCodeUrl = await toDataURL(otpauthUrl);

  return c.json({ qrCodeUrl, manualEntryKey: secret });
});

// POST /auth/2fa/verify — verify TOTP token and enable 2FA
auth.post('/2fa/verify', authMiddleware, async (c) => {
  const user = c.get('user');
  const { token } = await c.req.json();

  if (!token) return c.json({ error: 'Token requerido' }, 400);

  const { data: profile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('two_factor_secret')
    .eq('id', user.id)
    .single();

  if (fetchErr || !profile?.two_factor_secret) {
    return c.json({ error: '2FA no está configurado. Inicia el proceso de configuración primero.' }, 400);
  }

  const result = verifySync({ token, secret: profile.two_factor_secret });
  const isValid = result.valid;

  if (!isValid) {
    return c.json({ error: 'Código inválido. Inténtalo de nuevo.' }, 400);
  }

  // Generate 10 backup codes in XXXX-XXXX format
  const backupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  // Store hashed backup codes — return plaintext to user so they can save them
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({
      two_factor_enabled: true,
      backup_codes: backupCodes.map(hashBackupCode),
    })
    .eq('id', user.id);

  if (updateErr) return c.json({ error: updateErr.message }, 500);

  return c.json({ backupCodes });
});

// POST /auth/2fa/disable — disable 2FA with token or backup code
auth.post('/2fa/disable', authMiddleware, async (c) => {
  const user = c.get('user');
  const { token } = await c.req.json();

  if (!token) return c.json({ error: 'Token o código de respaldo requerido' }, 400);

  const { data: profile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('two_factor_secret, backup_codes')
    .eq('id', user.id)
    .single();

  if (fetchErr || !profile?.two_factor_secret) {
    return c.json({ error: '2FA no está habilitado' }, 400);
  }

  // Check TOTP token first, then backup codes (stored as hashes)
  const totpResult = verifySync({ token, secret: profile.two_factor_secret });
  const totpValid = totpResult.valid;
  const backupCodes: string[] = profile.backup_codes ?? [];
  const backupValid = backupCodes.some((hash: string) => hash === hashBackupCode(token));

  if (!totpValid && !backupValid) {
    return c.json({ error: 'Código inválido' }, 400);
  }

  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      backup_codes: null,
    })
    .eq('id', user.id);

  if (updateErr) return c.json({ error: updateErr.message }, 500);

  return c.json({ message: '2FA desactivado' });
});

// POST /auth/2fa/challenge — verify 2FA code during login and return session tokens
auth.post('/2fa/challenge', rateLimit(10, 60_000), async (c) => {
  const { challenge_token, token } = await c.req.json();

  if (!challenge_token || !token) {
    return c.json({ error: 'Token de desafío y código 2FA son requeridos' }, 400);
  }

  // Look up the challenge
  const challenge = twoFactorChallenges.get(challenge_token);

  if (!challenge || challenge.expiresAt <= Date.now()) {
    // Clean up expired challenge if present
    if (challenge) twoFactorChallenges.delete(challenge_token);
    return c.json({ error: 'El desafío 2FA ha expirado o no es válido. Inicia sesión de nuevo.' }, 401);
  }

  // Fetch user's 2FA secret and backup codes
  const { data: profile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('two_factor_secret, backup_codes')
    .eq('id', challenge.userId)
    .single();

  if (fetchErr || !profile?.two_factor_secret) {
    twoFactorChallenges.delete(challenge_token);
    return c.json({ error: 'Error al verificar 2FA' }, 500);
  }

  // Verify TOTP code first, then check backup codes (stored as hashes)
  const totpResult = verifySync({ token, secret: profile.two_factor_secret });
  const totpValid = totpResult.valid;
  const backupCodes: string[] = profile.backup_codes ?? [];
  const hashedInput = hashBackupCode(token);
  const backupValid = backupCodes.some((hash: string) => hash === hashedInput);

  if (!totpValid && !backupValid) {
    return c.json({ error: 'Código 2FA inválido' }, 401);
  }

  // If a backup code was used, consume it (remove from array)
  if (backupValid && !totpValid) {
    const updatedCodes = backupCodes.filter((hash) => hash !== hashedInput);
    await supabaseAdmin
      .from('profiles')
      .update({ backup_codes: updatedCodes })
      .eq('id', challenge.userId);
  }

  // Remove the challenge — it's been consumed
  twoFactorChallenges.delete(challenge_token);

  // Track session asynchronously
  const ua = c.req.header('User-Agent');
  const ip = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || c.req.header('X-Real-IP') || '0.0.0.0';
  trackSession(challenge.userId, challenge.sessionData.access_token, ua, ip).catch(err =>
    console.error('[auth/2fa/challenge] session tracking failed:', err)
  );

  return c.json({
    access_token: challenge.sessionData.access_token,
    refresh_token: challenge.sessionData.refresh_token,
    expires_at: challenge.sessionData.expires_at,
    user: challenge.sessionData.user,
  });
});

// GET /auth/check-username — verificar disponibilidad de username (público)
auth.get('/check-username', rateLimit(20, 60_000), async (c) => {
  const username = c.req.query('username') ?? '';

  if (!username) {
    return c.json({ available: false, reason: 'empty' }, 400);
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return c.json({ available: false, reason: 'format' });
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (existing) {
    return c.json({ available: false, reason: 'taken' });
  }

  return c.json({ available: true });
});

export default auth;
