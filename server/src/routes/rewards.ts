import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as pointsService from '../services/pointsService.js';
import * as businessSettingsService from '../services/businessSettingsService.js';
import type { AppEnv } from '../middleware/auth.js';

const rewards = new Hono<AppEnv>();
rewards.use('*', authMiddleware);

// GET /rewards — list active rewards
rewards.get('/', async (c) => {
  const enabled = await businessSettingsService.getSetting<boolean>('puntos_enabled');
  if (enabled === false) {
    return c.json({ rewards: [], disabled: true });
  }
  const rewardsList = await pointsService.getRewards();
  return c.json({ rewards: rewardsList });
});

// POST /rewards/redeem — redeem a reward
rewards.post('/redeem', async (c) => {
  const enabled = await businessSettingsService.getSetting<boolean>('puntos_enabled');
  if (enabled === false) {
    return c.json({ error: 'El sistema de puntos está desactivado' }, 400);
  }
  const user = c.get('user');
  const { rewardId } = await c.req.json();

  if (!rewardId) {
    return c.json({ error: 'rewardId requerido' }, 400);
  }

  const result = await pointsService.redeemReward(user.id, rewardId);
  return c.json(result);
});

export default rewards;
