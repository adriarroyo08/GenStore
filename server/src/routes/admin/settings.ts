import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth';
import * as businessSettingsService from '../../services/businessSettingsService.js';

const settings = new Hono<AppEnv>();

settings.get('/', async (c) => {
  const all = await businessSettingsService.getAllSettings();
  return c.json(all);
});

settings.put('/', async (c) => {
  const body = await c.req.json();
  await businessSettingsService.updateSettings(body);
  const updated = await businessSettingsService.getAllSettings();
  return c.json(updated);
});

export default settings;
