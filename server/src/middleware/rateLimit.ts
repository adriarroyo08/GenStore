import { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every minute; cap store size to prevent memory exhaustion
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000).unref();

const MAX_STORE_SIZE = 50_000;

export function rateLimit(maxRequests: number = 100, windowMs: number = 60_000) {
  return async (c: Context, next: Next) => {
    const ip = (c.req.header('x-forwarded-for')?.split(',')[0]?.trim()) ?? c.req.header('x-real-ip') ?? 'unknown';
    const normalizedPath = c.req.path.replace(/\/+$/, '').toLowerCase();
    const key = `${ip}:${normalizedPath}`;
    const now = Date.now();

    const entry = store.get(key);
    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        return c.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, 429);
      }
      entry.count++;
    } else {
      if (store.size >= MAX_STORE_SIZE) {
        for (const [k, v] of store) {
          if (now > v.resetAt) store.delete(k);
        }
        // Evict oldest entry if still at capacity
        if (store.size >= MAX_STORE_SIZE) {
          let oldestKey: string | undefined;
          let oldestTime = Infinity;
          for (const [k, v] of store) {
            if (v.resetAt < oldestTime) { oldestTime = v.resetAt; oldestKey = k; }
          }
          if (oldestKey) store.delete(oldestKey);
        }
      }
      store.set(key, { count: 1, resetAt: now + windowMs });
    }

    await next();
  };
}
