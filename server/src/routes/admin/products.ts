import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';
import * as supplierService from '../../services/supplierService.js';

const adminProducts = new Hono();

// GET /admin/products — all products including inactive
adminProducts.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const pageSize = Number(c.req.query('pageSize') ?? 50);
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabaseAdmin
    .from('products')
    .select('*, categories!left(nombre, slug), suppliers!left(nombre)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);
  return c.json({ products: data, total: count ?? 0, page, pageSize });
});

// POST /admin/products — create product
adminProducts.post('/', async (c) => {
  const body = await c.req.json();
  const slug = body.slug ?? body.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...body, slug })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data, 201);
});

// POST /admin/products/import — bulk import products from CSV data
adminProducts.post('/import', async (c) => {
  const body = await c.req.json();
  const { supplier_id, products: rows } = body as {
    supplier_id: string;
    products: Array<{
      nombre: string;
      supplier_sku: string;
      precio_coste: number;
      descripcion?: string;
      categoria?: string;
      imagenes?: string;
      marca?: string;
      stock?: number;
    }>;
  };

  if (!supplier_id) {
    return c.json({ error: 'supplier_id es obligatorio' }, 400);
  }

  const supplier = await supplierService.getSupplierById(supplier_id);
  const results = { created: 0, updated: 0, errors: [] as { row: number; message: string }[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.nombre || !row.supplier_sku || !row.precio_coste) {
        results.errors.push({ row: i + 1, message: 'Faltan campos obligatorios: nombre, supplier_sku, precio_coste' });
        continue;
      }

      const pvp = row.precio_coste * (1 + supplier.margen_defecto / 100);
      const slug = row.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('supplier_id', supplier_id)
        .eq('supplier_sku', row.supplier_sku)
        .single();

      let categoryId = null;
      if (row.categoria) {
        const { data: cat } = await supabaseAdmin
          .from('categories')
          .select('id')
          .ilike('nombre', row.categoria.trim())
          .single();
        categoryId = cat?.id ?? null;
      }

      if (existing) {
        await supabaseAdmin.from('products').update({
          nombre: row.nombre.trim(),
          precio_coste: row.precio_coste,
          precio: pvp,
          descripcion: row.descripcion?.trim() || null,
          stock: row.stock ?? undefined,
          marca: row.marca?.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        results.updated++;
      } else {
        await supabaseAdmin.from('products').insert({
          nombre: row.nombre.trim(),
          supplier_id,
          supplier_sku: row.supplier_sku.trim(),
          precio_coste: row.precio_coste,
          precio: pvp,
          descripcion: row.descripcion?.trim() || null,
          category_id: categoryId,
          marca: row.marca?.trim() || null,
          stock: row.stock ?? 0,
          stock_minimo: 5,
          imagenes: row.imagenes ? row.imagenes.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          slug,
          sku: row.supplier_sku.trim(),
          activo: false,
        });
        results.created++;
      }
    } catch (err: any) {
      results.errors.push({ row: i + 1, message: err.message ?? 'Error desconocido' });
    }
  }

  return c.json(results);
});

// PUT /admin/products/:id — update product
adminProducts.put('/:id', async (c) => {
  const body = await c.req.json();
  const { nombre, sku, precio, precio_coste, stock, stock_minimo, descripcion, descripcion_corta, marca, activo, en_oferta, porcentaje_descuento, precio_original, imagenes, specs, tags, peso, category_id, supplier_id, supplier_sku } = body;
  const updateData: Record<string, unknown> = {};
  if (nombre !== undefined) updateData.nombre = nombre;
  if (sku !== undefined) updateData.sku = sku;
  if (precio !== undefined) updateData.precio = precio;
  if (precio_coste !== undefined) updateData.precio_coste = precio_coste;
  if (stock !== undefined) updateData.stock = stock;
  if (stock_minimo !== undefined) updateData.stock_minimo = stock_minimo;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (descripcion_corta !== undefined) updateData.descripcion_corta = descripcion_corta;
  if (marca !== undefined) updateData.marca = marca;
  if (activo !== undefined) updateData.activo = activo;
  if (en_oferta !== undefined) updateData.en_oferta = en_oferta;
  if (porcentaje_descuento !== undefined) updateData.porcentaje_descuento = porcentaje_descuento;
  if (precio_original !== undefined) updateData.precio_original = precio_original;
  if (imagenes !== undefined) updateData.imagenes = imagenes;
  if (specs !== undefined) updateData.specs = specs;
  if (tags !== undefined) updateData.tags = tags;
  if (peso !== undefined) updateData.peso = peso;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (supplier_id !== undefined) updateData.supplier_id = supplier_id;
  if (supplier_sku !== undefined) updateData.supplier_sku = supplier_sku;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updateData)
    .eq('id', c.req.param('id'))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data);
});

// DELETE /admin/products/:id — soft delete (set activo=false)
adminProducts.delete('/:id', async (c) => {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ activo: false })
    .eq('id', c.req.param('id'));

  if (error) throw new Error(error.message);
  return c.json({ message: 'Producto desactivado' });
});

export default adminProducts;
