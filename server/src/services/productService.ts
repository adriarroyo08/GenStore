import { supabaseAdmin } from '../config/supabase.js';
import type { Product, PaginatedResponse, ProductFilters } from '../types/index.js';

export async function getProducts(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
  const {
    q, category, minPrice, maxPrice, onSale, inStock,
    page = 1, pageSize = 20,
    sortBy = 'created_at', sortOrder = 'desc'
  } = filters;

  const categorySelect = category
    ? '*, categories!inner(slug, nombre)'
    : '*, categories(slug, nombre)';

  let query = supabaseAdmin
    .from('products')
    .select(categorySelect, { count: 'exact' })
    .eq('activo', true);

  if (q) {
    query = query.textSearch('fts', q, { type: 'websearch', config: 'spanish' });
  }
  if (category) {
    query = query.eq('categories.slug', category);
  }
  if (minPrice !== undefined) {
    query = query.gte('precio', minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte('precio', maxPrice);
  }
  if (onSale) {
    query = query.eq('en_oferta', true);
  }
  if (inStock) {
    query = query.gt('stock', 0);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as Product[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, categories(slug, nombre)')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data as Product;
}
