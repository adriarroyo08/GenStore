import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as pointsService from '../services/pointsService.js';
import * as businessSettingsService from '../services/businessSettingsService.js';
import type { AppEnv } from '../middleware/auth.js';

const points = new Hono<AppEnv>();
points.use('*', authMiddleware);

// GET /points — get user points summary + history
points.get('/', async (c) => {
  const enabled = await businessSettingsService.getSetting<boolean>('puntos_enabled');
  if (enabled === false) {
    return c.json({ currentPoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0, transactions: [], disabled: true });
  }
  const user = c.get('user');
  const data = await pointsService.getUserPoints(user.id);
  return c.json(data);
});

// GET /points/calculate — preview points for an amount
points.get('/calculate', async (c) => {
  const enabled = await businessSettingsService.getSetting<boolean>('puntos_enabled');
  if (enabled === false) {
    return c.json({ amount: 0, points: 0, disabled: true });
  }
  const amount = parseFloat(c.req.query('amount') ?? '0');
  const pointsEarned = pointsService.calculatePoints(amount);
  return c.json({ amount, points: pointsEarned });
});

export default points;
