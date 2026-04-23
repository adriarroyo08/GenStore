import { supabaseAdmin } from '../config/supabase.js';

let cache: Record<string, unknown> = {};
let cacheLoaded = false;

export async function loadSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin
    .from('business_settings')
    .select('key, value');

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  cache = {};
  for (const row of data ?? []) {
    cache[row.key] = row.value;
  }
  cacheLoaded = true;
  return cache;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  if (!cacheLoaded) await loadSettings();
  return { ...cache };
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  if (!cacheLoaded) await loadSettings();
  return (cache[key] as T) ?? null;
}

export async function updateSettings(settings: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin
    .from('business_settings')
    .upsert(upserts, { onConflict: 'key' });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  await loadSettings();
}

const PUBLIC_KEYS = [
  'razon_social',
  'envio_gratis_umbral',
  'coste_envio_estandar',
  'iva_porcentaje',
  'moneda',
  'stripe_enabled',
  'puntos_enabled',
];

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  if (!cacheLoaded) await loadSettings();
  const result: Record<string, unknown> = {};
  for (const key of PUBLIC_KEYS) {
    if (cache[key] !== undefined) result[key] = cache[key];
  }
  return result;
}
