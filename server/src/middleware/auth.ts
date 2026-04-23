import { Context, Next } from 'hono';
import { supabaseAdmin } from '../config/supabase.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/** Hono environment type — use as `new Hono<AppEnv>()` in routes that call c.get('user')/c.get('token') */
export type AppEnv = {
  Variables: {
    user: AuthUser;
    token: string;
  };
};

// Verifies JWT and attaches user to context
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Token requerido' }, 401);
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.error('[auth] getUser failed:', error?.message);
    return c.json({ error: 'Token inválido o expirado' }, 401);
  }

  // Fetch role from profiles
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, nombre, apellidos')
    .eq('id', user.id)
    .single();

  const authUser: AuthUser = {
    id: user.id,
    email: user.email!,
    role: profile?.role ?? 'customer',
  };

  c.set('user', authUser);
  c.set('token', token);
  await next();
}
