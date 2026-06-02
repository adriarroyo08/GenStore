import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth';
import * as businessSettingsService from '../../services/businessSettingsService.js';

const settings = new Hono<AppEnv>();

settings.get('/', async (c) => {
  const all = await businessSettingsService.getAllSettings();
  return c.json(all);
});

const ALLOWED_KEYS = new Set([
  'razon_social', 'nif', 'direccion', 'email_contacto', 'telefono_contacto',
  'envio_gratis_umbral', 'coste_envio_estandar', 'iva_porcentaje', 'moneda',
  'stripe_enabled', 'puntos_enabled', 'puntos_por_euro', 'valor_punto',
  'politica_devolucion', 'plazo_devolucion_dias',
]);

settings.put('/', async (c) => {
  const body = await c.req.json();
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key)) filtered[key] = value;
  }
  if (Object.keys(filtered).length === 0) {
    return c.json({ error: 'No se proporcionaron ajustes válidos' }, 400);
  }
  await businessSettingsService.updateSettings(filtered);
  const updated = await businessSettingsService.getAllSettings();
  return c.json(updated);
});

export default settings;
