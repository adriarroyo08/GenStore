import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';

const adminCategories = new Hono();

adminCategories.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*, products(count)')
    .order('orden', { ascending: true });

  if (error) throw new Error(error.message);

  const result = (data ?? []).map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count ?? 0,
    products: undefined,
  }));

  return c.json({ categories: result });
});

adminCategories.post('/', async (c) => {
  const body = await c.req.json();
  const slug = body.slug ?? body.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ ...body, slug })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data, 201);
});

adminCategories.put('/:id', async (c) => {
  const body = await c.req.json();
  const { nombre, slug, descripcion, parent_id, activo, orden, imagen } = body;
  const updateData: Record<string, unknown> = {};
  if (nombre !== undefined) updateData.nombre = nombre;
  if (slug !== undefined) updateData.slug = slug;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (parent_id !== undefined) updateData.parent_id = parent_id;
  if (activo !== undefined) updateData.activo = activo;
  if (orden !== undefined) updateData.orden = orden;
  if (imagen !== undefined) updateData.imagen = imagen;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(updateData)
    .eq('id', c.req.param('id'))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data);
});

adminCategories.delete('/:id', async (c) => {
  const { error } = await supabaseAdmin
    .from('categories')
    .update({ activo: false })
    .eq('id', c.req.param('id'));

  if (error) throw new Error(error.message);
  return c.json({ message: 'Categoría desactivada' });
});

export default adminCategories;
