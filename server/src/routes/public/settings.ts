import { Hono } from 'hono';
import * as businessSettingsService from '../../services/businessSettingsService.js';

const publicSettings = new Hono();

publicSettings.get('/public', async (c) => {
  const settings = await businessSettingsService.getPublicSettings();
  return c.json(settings);
});

export default publicSettings;
