import { Hono } from 'hono';
import { supabaseAdmin } from '../config/supabase.js';

const categories = new Hono();

// GET /categories — tree of active categories with product counts
categories.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*, products(count)')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) throw new Error(error.message);

  // Transform to camelCase format expected by frontend
  const categories = (data ?? []).map((cat: any) => ({
    id: cat.id,
    name: cat.nombre,
    slug: cat.slug,
    description: cat.descripcion,
    icon: cat.icon,
    order: cat.orden ?? 0,
    isActive: cat.activo,
    productCount: cat.products?.[0]?.count ?? 0,
  }));

  return c.json({ success: true, categories });
});

export default categories;
