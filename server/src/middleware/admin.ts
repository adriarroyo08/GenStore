import { Context, Next } from 'hono';
import type { AppEnv } from './auth.js';

export async function adminMiddleware(c: Context<AppEnv>, next: Next) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Acceso denegado: se requiere rol admin' }, 403);
  }
  await next();
}
