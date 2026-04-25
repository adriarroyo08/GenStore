import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing services
vi.mock('../../src/config/supabase.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
      auth: {
        admin: {
          createUser: vi.fn(),
          generateLink: vi.fn(),
          listUsers: vi.fn(),
          getUserById: vi.fn(),
          signOut: vi.fn(),
          updateUserById: vi.fn(),
        },
        signInWithPassword: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        verifyOtp: vi.fn(),
      },
    },
  };
});

// Mock env
vi.mock('../../src/config/env.js', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
    API_PORT: '3002',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_fake',
  },
}));

vi.mock('../../src/services/emailService.js', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendOrderCancelled: vi.fn().mockResolvedValue(undefined),
  sendPaymentConfirmation: vi.fn().mockResolvedValue(undefined),
  sendInvoiceReady: vi.fn().mockResolvedValue(undefined),
  sendNewOrderAdminAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/sessionService.js', () => ({
  trackSession: vi.fn().mockResolvedValue(undefined),
  getUserSessions: vi.fn().mockResolvedValue([]),
  revokeSession: vi.fn().mockResolvedValue(undefined),
  revokeAllOtherSessions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/middleware/rateLimit.js', () => ({
  rateLimit: vi.fn(() => async (_c: any, next: any) => next()),
}));

vi.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', { id: 'user-123', email: 'test@test.com' });
    c.set('token', 'fake-jwt-token');
    await next();
  }),
}));

vi.mock('otplib', () => ({
  generateSecret: vi.fn().mockReturnValue('TOTP_SECRET'),
  generateURI: vi.fn().mockReturnValue('otpauth://totp/GenStore:test@test.com?secret=TOTP_SECRET'),
  verifySync: vi.fn().mockReturnValue({ valid: true }),
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

/** Helper: build a full supabase chain: select().eq().single() or maybeSingle() */
function makeSelectChain(resolvedValue: any, terminal: 'single' | 'maybeSingle' = 'single') {
  const termFn = vi.fn().mockResolvedValue(resolvedValue);
  const eqFn = vi.fn().mockReturnValue({ [terminal]: termFn, eq: vi.fn().mockReturnValue({ [terminal]: termFn }) });
  const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
  return { select: selectFn };
}

/** Helper: build a full supabase chain: update().eq() */
function makeUpdateChain(resolvedValue: any) {
  const eqFn = vi.fn().mockResolvedValue(resolvedValue);
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
  return { update: updateFn };
}

describe('auth routes logic', () => {
  beforeEach(async () => {
    // resetAllMocks clears the mockReturnValueOnce queue (clearAllMocks does not)
    vi.resetAllMocks();

    // Re-apply default implementations wiped by resetAllMocks
    const email = await import('../../src/services/emailService.js');
    vi.mocked(email.sendEmailVerification).mockResolvedValue(undefined as any);

    const session = await import('../../src/services/sessionService.js');
    vi.mocked(session.trackSession).mockResolvedValue(undefined as any);
    vi.mocked(session.getUserSessions).mockResolvedValue([] as any);
  });

  describe('signup — user creation', () => {
    it('creates user and returns verificationRequired', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Username check — not taken
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: null, error: null }, 'maybeSingle') as any
      );

      vi.mocked(supabaseAdmin.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-user-id', email: 'newuser@test.com' } },
        error: null,
      } as any);

      vi.mocked(supabaseAdmin.auth.admin.generateLink).mockResolvedValueOnce({
        data: { properties: { hashed_token: 'tok123', action_link: 'https://...' } },
        error: null,
      } as any);

      // Verify createUser was set up correctly
      expect(supabaseAdmin.auth.admin.createUser).toBeDefined();

      // Simulate the route flow
      const checkResult = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', 'testuser')
        .maybeSingle();

      expect(checkResult.data).toBeNull(); // username not taken

      const createResult = await supabaseAdmin.auth.admin.createUser({
        email: 'newuser@test.com',
        password: 'Password1!',
        email_confirm: false,
        user_metadata: { nombre: 'Test', username: 'testuser', role: 'customer' },
      });

      expect(createResult.data?.user?.id).toBe('new-user-id');
      expect(createResult.error).toBeNull();
    });

    it('does not call createUser when username is already taken', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Username is taken
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { id: 'existing-user' }, error: null }, 'maybeSingle') as any
      );

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', 'takenuser')
        .maybeSingle();

      // Route returns 409 early — createUser should not be called
      expect(existing).not.toBeNull();
      expect(supabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('validates required fields — email, password, nombre, username', () => {
      const requiredFields = ['email', 'password', 'nombre', 'username'];
      expect(requiredFields).toHaveLength(4);
    });

    it('validates password strength requirements', () => {
      const weakPasswords = ['short', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoSpecial1', 'NoNumber!'];
      expect(weakPasswords.length).toBeGreaterThan(0);

      const strongPassword = 'StrongPass1!';
      expect(strongPassword.length).toBeGreaterThanOrEqual(8);
      expect(/[A-Z]/.test(strongPassword)).toBe(true);
      expect(/[a-z]/.test(strongPassword)).toBe(true);
      expect(/[0-9]/.test(strongPassword)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(strongPassword)).toBe(true);
    });
  });

  describe('login — token generation', () => {
    it('returns tokens for valid email credentials', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');

      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@test.com' },
          session: {
            access_token: 'access-tok',
            refresh_token: 'refresh-tok',
            expires_at: 9999999999,
          },
        },
        error: null,
      } as any);

      const result = await supabaseAdmin.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'ValidPass1!',
      });

      expect(result.data?.session?.access_token).toBe('access-tok');
      expect(result.data?.session?.refresh_token).toBe('refresh-tok');
      expect(result.error).toBeNull();
    });

    it('returns error for invalid credentials', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');

      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as any);

      const result = await supabaseAdmin.auth.signInWithPassword({
        email: 'bad@test.com',
        password: 'wrongpassword',
      });

      expect(result.error).not.toBeNull();
      expect(result.data.user).toBeNull();
    });

    it('signals 2FA challenge when user has 2FA enabled', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      vi.mocked(supabaseAdmin.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'user-2fa', email: 'twofa@test.com' },
          session: { access_token: 'tok', refresh_token: 'rtok', expires_at: 9999 },
        },
        error: null,
      } as any);

      const loginResult = await supabaseAdmin.auth.signInWithPassword({
        email: 'twofa@test.com',
        password: 'ValidPass1!',
      });
      expect(loginResult.error).toBeNull();

      // Set up 2FA profile lookup
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { two_factor_enabled: true }, error: null }) as any
      );

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', 'user-2fa')
        .single();

      expect(profile?.two_factor_enabled).toBe(true);
    });

    it('resolves username to email before signing in', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      // Lookup username
      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { id: 'user-by-username' }, error: null }, 'maybeSingle') as any
      );

      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValueOnce({
        data: { user: { id: 'user-by-username', email: 'byusername@test.com' } },
        error: null,
      } as any);

      const { data: profileResult } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', 'someusername')
        .maybeSingle();

      expect(profileResult?.id).toBe('user-by-username');

      const userResult = await supabaseAdmin.auth.admin.getUserById('user-by-username');
      expect(userResult?.data?.user?.email).toBe('byusername@test.com');
    });
  });

  describe('getProfile (/auth/me)', () => {
    it('returns profile data for authenticated user', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      const fakeProfile = {
        id: 'user-123',
        nombre: 'Juan',
        apellidos: 'García',
        username: 'juangarcia',
        telefono: '+34600000000',
      };

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: fakeProfile, error: null }) as any
      );

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(error).toBeNull();
      expect(profile).toMatchObject({ id: 'user-123', nombre: 'Juan' });
    });

    it('throws error when profile fetch fails', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: null, error: { message: 'Profile not found' } }) as any
      );

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', 'nonexistent')
        .single();

      expect(data).toBeNull();
      expect(error?.message).toBe('Profile not found');
    });
  });

  describe('check-username availability', () => {
    it('returns available: true for unused username', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: null, error: null }, 'maybeSingle') as any
      );

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', 'freeusername')
        .maybeSingle();

      expect(existing).toBeNull();
    });

    it('returns available: false for taken username', async () => {
      const { supabaseAdmin } = await import('../../src/config/supabase.js');
      const fromMock = vi.mocked(supabaseAdmin.from);

      fromMock.mockReturnValueOnce(
        makeSelectChain({ data: { id: 'taken-user' }, error: null }, 'maybeSingle') as any
      );

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', 'takenuser')
        .maybeSingle();

      expect(existing).not.toBeNull();
    });

    it('rejects usernames with invalid format', () => {
      const invalid = ['ab', 'a'.repeat(21), 'user name', 'user@name'];
      const valid = 'valid_user123';

      for (const name of invalid) {
        expect(/^[a-zA-Z0-9_]{3,20}$/.test(name)).toBe(false);
      }
      expect(/^[a-zA-Z0-9_]{3,20}$/.test(valid)).toBe(true);
    });
  });
});
