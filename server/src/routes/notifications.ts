import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as notificationService from '../services/notificationService.js';
import type { AppEnv } from '../middleware/auth.js';

const notifications = new Hono<AppEnv>();
notifications.use('*', authMiddleware);

notifications.get('/', async (c) => {
  const user = c.get('user');
  const limit = Number(c.req.query('limit') || 20);
  const items = await notificationService.getForUser(user.id, limit);
  return c.json({ success: true, notifications: items });
});

notifications.get('/unread-count', async (c) => {
  const user = c.get('user');
  const count = await notificationService.getUnreadCount(user.id);
  return c.json({ count });
});

notifications.put('/read-all', async (c) => {
  const user = c.get('user');
  await notificationService.markAllRead(user.id);
  return c.json({ success: true });
});

notifications.put('/:id/read', async (c) => {
  const user = c.get('user');
  await notificationService.markRead(user.id, c.req.param('id'));
  return c.json({ success: true });
});

export default notifications;
