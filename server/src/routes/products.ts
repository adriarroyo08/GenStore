import { Hono } from 'hono';
import { getProducts, getProductBySlug } from '../services/productService.js';
import type { ProductFilters } from '../types/index.js';

const products = new Hono();

// GET /products — public catalog with pagination and filters
products.get('/', async (c) => {
  const filters: ProductFilters = {
    q: c.req.query('q')?.slice(0, 200) || undefined,
    category: c.req.query('category')?.slice(0, 100) || undefined,
    minPrice: (() => { const v = Number(c.req.query('minPrice')); return isFinite(v) && v >= 0 ? v : undefined; })(),
    maxPrice: (() => { const v = Number(c.req.query('maxPrice')); return isFinite(v) && v >= 0 ? v : undefined; })(),
    onSale: c.req.query('onSale') === 'true' || undefined,
    inStock: c.req.query('inStock') === 'true' || undefined,
    page: Math.min(Math.max(c.req.query('page') ? Number(c.req.query('page')) : 1, 1), 1000),
    pageSize: Math.min(c.req.query('pageSize') ? Number(c.req.query('pageSize')) : 20, 100),
    sortBy: (['created_at', 'precio', 'nombre', 'rating'].includes(c.req.query('sortBy') ?? '') ? c.req.query('sortBy') as ProductFilters['sortBy'] : 'created_at'),
    sortOrder: (['asc', 'desc'].includes(c.req.query('sortOrder') ?? '') ? c.req.query('sortOrder') as ProductFilters['sortOrder'] : 'desc'),
  };

  const result = await getProducts(filters);
  return c.json(result);
});

// GET /products/:slug — single product detail
products.get('/:slug', async (c) => {
  const product = await getProductBySlug(c.req.param('slug'));
  if (!product) return c.json({ error: 'Producto no encontrado' }, 404);
  return c.json(product);
});

export default products;
