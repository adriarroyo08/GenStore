import { Hono } from 'hono';
import { getProducts, getProductBySlug } from '../services/productService.js';
import type { ProductFilters } from '../types/index.js';

const products = new Hono();

// GET /products — public catalog with pagination and filters
products.get('/', async (c) => {
  const filters: ProductFilters = {
    q: c.req.query('q') || undefined,
    category: c.req.query('category') || undefined,
    minPrice: c.req.query('minPrice') ? Number(c.req.query('minPrice')) : undefined,
    maxPrice: c.req.query('maxPrice') ? Number(c.req.query('maxPrice')) : undefined,
    onSale: c.req.query('onSale') === 'true' || undefined,
    inStock: c.req.query('inStock') === 'true' || undefined,
    page: c.req.query('page') ? Number(c.req.query('page')) : 1,
    pageSize: c.req.query('pageSize') ? Number(c.req.query('pageSize')) : 20,
    sortBy: (c.req.query('sortBy') as ProductFilters['sortBy']) || 'created_at',
    sortOrder: (c.req.query('sortOrder') as ProductFilters['sortOrder']) || 'desc',
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
