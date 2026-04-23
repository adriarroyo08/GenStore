import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { supabaseAdmin } from '../config/supabase.js';
import type { CsvImportResult, Product, InventoryMovement } from '../types/index.js';

interface CsvRow {
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria?: string;
  marca?: string;
}

export function parseCsvRow(raw: Record<string, string>): CsvRow {
  return {
    sku: (raw.sku ?? '').trim(),
    nombre: (raw.nombre ?? '').trim(),
    precio: parseFloat(raw.precio) || 0,
    stock: parseInt(raw.stock, 10) || 0,
    categoria: (raw.categoria ?? '').trim() || undefined,
    marca: (raw.marca ?? '').trim() || undefined,
  };
}

export function validateCsvRow(row: CsvRow): string | null {
  if (!row.sku) return 'SKU es requerido';
  if (!row.nombre) return 'Nombre es requerido';
  if (row.precio <= 0) return 'Precio debe ser mayor a 0';
  if (row.stock < 0) return 'Stock no puede ser negativo';
  return null;
}

export async function importCsv(csvContent: string, userId: string): Promise<CsvImportResult> {
  const records: Record<string, string>[] = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  const result: CsvImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const row = parseCsvRow(raw);
    const validationError = validateCsvRow(row);

    if (validationError) {
      result.errors.push({ row: i + 2, sku: row.sku || '(vacío)', message: validationError });
      continue;
    }

    // Check if product exists
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .eq('sku', row.sku)
      .maybeSingle();

    if (existing) {
      // Update existing product
      const stockDiff = row.stock - existing.stock;
      await supabaseAdmin.from('products').update({
        nombre: row.nombre,
        precio: row.precio,
        stock: row.stock,
        marca: row.marca,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);

      // Record inventory movement if stock changed
      if (stockDiff !== 0) {
        await supabaseAdmin.from('inventory_movements').insert({
          product_id: existing.id,
          tipo: stockDiff > 0 ? 'entrada' : 'ajuste',
          cantidad: stockDiff,
          motivo: `Import CSV - actualización`,
          created_by: userId,
        });
      }
      result.updated++;
    } else {
      // Create new product
      const slug = row.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newProduct, error } = await supabaseAdmin.from('products').insert({
        nombre: row.nombre,
        slug: `${slug}-${Date.now()}`,
        sku: row.sku,
        precio: row.precio,
        stock: row.stock,
        marca: row.marca,
      }).select('id').single();

      if (error) {
        result.errors.push({ row: i + 2, sku: row.sku, message: error.message });
        continue;
      }

      // Record initial stock entry
      if (row.stock > 0) {
        await supabaseAdmin.from('inventory_movements').insert({
          product_id: newProduct.id,
          tipo: 'entrada',
          cantidad: row.stock,
          motivo: `Import CSV - producto nuevo`,
          created_by: userId,
        });
      }
      result.created++;
    }
  }

  return result;
}

export async function exportCsv(filter?: 'all' | 'low_stock' | string): Promise<string> {
  let query = supabaseAdmin
    .from('products')
    .select('sku, nombre, precio, precio_original, stock, stock_minimo, marca, activo, created_at, updated_at, categories(nombre)')
    .eq('activo', true);

  if (filter === 'low_stock') {
    // Supabase can't compare two columns directly, so fetch all and filter in JS
    const { data, error } = await query.order('stock', { ascending: true });
    if (error) throw new Error(error.message);
    const filtered = (data ?? []).filter((p: any) => p.stock <= p.stock_minimo);
    return stringify(formatRows(filtered), { header: true });
  }

  if (filter && filter !== 'all') {
    query = query.eq('categories.slug', filter);
  }

  const { data, error } = await query.order('nombre');
  if (error) throw new Error(error.message);

  return stringify(formatRows(data ?? []), { header: true });
}

function formatRows(data: any[]): Record<string, unknown>[] {
  return data.map((p: any) => ({
    sku: p.sku,
    nombre: p.nombre,
    precio: p.precio,
    precio_original: p.precio_original ?? '',
    stock: p.stock,
    stock_minimo: p.stock_minimo,
    categoria: p.categories?.nombre ?? '',
    marca: p.marca ?? '',
    activo: p.activo,
  }));
}

export async function adjustStock(
  productId: string,
  cantidad: number,
  motivo: string,
  userId: string
): Promise<void> {
  // Get current stock
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (productError || !product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });

  const newStock = product.stock + cantidad;
  if (newStock < 0) throw Object.assign(new Error('El stock no puede ser negativo'), { status: 400 });

  await supabaseAdmin.from('products').update({ stock: newStock }).eq('id', productId);

  await supabaseAdmin.from('inventory_movements').insert({
    product_id: productId,
    tipo: cantidad > 0 ? 'entrada' : 'ajuste',
    cantidad,
    motivo,
    created_by: userId,
  });
}

export async function getLowStockAlerts(): Promise<Pick<Product, 'id' | 'nombre' | 'sku' | 'stock' | 'stock_minimo'>[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, nombre, sku, stock, stock_minimo')
    .eq('activo', true)
    .order('stock', { ascending: true });

  if (error) throw new Error(error.message);
  // Filter in JS since Supabase can't compare two columns easily
  return (data ?? []).filter((p: any) => p.stock <= p.stock_minimo);
}
