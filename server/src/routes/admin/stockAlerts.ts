import { Hono } from 'hono';
import { env } from '../../config/env.js';
import * as stockAlertService from '../../services/stockAlertService.js';

const stockAlertRoutes = new Hono();

// POST /send-digest — protected by cron secret, not user auth
stockAlertRoutes.post('/send-digest', async (c) => {
  const authHeader = c.req.header('Authorization');
  const secret = env.STOCK_ALERT_CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await stockAlertService.sendDailyDigest();
  return c.json({ ok: true });
});

export default stockAlertRoutes;
