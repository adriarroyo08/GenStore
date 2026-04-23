import { supabaseAdmin } from '../config/supabase.js';
import * as emailService from './emailService.js';

/**
 * Check if a product's stock is below minimum after a sale.
 * Uses stock_alerts_log with UNIQUE(product_id, alert_date) for dedup —
 * only one immediate alert per product per day.
 */
export async function checkAndAlertImmediate(productId: string): Promise<void> {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, nombre, sku, stock, stock_minimo')
    .eq('id', productId)
    .single();

  if (!product || product.stock > product.stock_minimo) return;

  // Try to insert — UNIQUE constraint handles dedup
  const { error } = await supabaseAdmin
    .from('stock_alerts_log')
    .insert({ product_id: productId });

  if (error) {
    // Duplicate key = already alerted today, skip
    if (error.code === '23505') return;
    throw error;
  }

  await emailService.sendStockAlertImmediate({
    productName: product.nombre,
    sku: product.sku,
    currentStock: product.stock,
    stockMinimo: product.stock_minimo,
  });
}

/**
 * Send a daily digest of all products below stock minimum.
 * Always sends if there are products below threshold (no dedup).
 */
export async function sendDailyDigest(): Promise<void> {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('nombre, sku, stock, stock_minimo')
    .eq('activo', true);

  if (error) throw error;
  if (!products) return;

  const lowStock = products.filter((p) => p.stock <= p.stock_minimo);
  if (lowStock.length === 0) return;

  await emailService.sendStockAlertDigest(lowStock);
}
