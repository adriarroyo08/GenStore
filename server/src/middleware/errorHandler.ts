import { Context } from 'hono';
import { env } from '../config/env.js';

export function errorHandler(err: Error, c: Context) {
  const status = (err as any).status ?? 500;

  // Always log the real error server-side
  console.error(`[API Error] ${c.req.method} ${c.req.path} (${status}):`, err.message);

  // For client errors (4xx), always return the actual message so the frontend
  // can show actionable feedback.  Only hide details for server errors (5xx).
  const message = status < 500 || env.NODE_ENV !== 'production'
    ? err.message
    : 'Error interno del servidor';

  return c.json({ error: message }, status);
}
