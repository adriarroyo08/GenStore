import { Hono } from 'hono';
import { env } from '../config/env.js';
import * as shippingService from '../services/shippingService.js';

const shippingCron = new Hono();

// POST /sync-tracking — protected by cron secret
shippingCron.post('/sync-tracking', async (c) => {
  const authHeader = c.req.header('Authorization');
  const secret = env.SHIPPING_SYNC_CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await shippingService.syncAllActiveShipments();
  return c.json({ ok: true });
});

export default shippingCron;
