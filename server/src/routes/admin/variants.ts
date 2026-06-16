import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth.js';
import {
  listVariants,
  createVariant,
  createVariants,
  updateVariant,
  deleteVariant,
  bulkGenerateVariants,
  bulkUpdateVariants,
} from '../../services/variantService.js';

export const adminVariantRoutes = new Hono<AppEnv>();

// GET /admin/products/:id/variants
adminVariantRoutes.get('/products/:id/variants', async (c) => {
  const productId = c.req.param('id');
  const variants = await listVariants(productId);
  return c.json(variants);
});

// POST /admin/products/:id/variants — single or array
adminVariantRoutes.post('/products/:id/variants', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (Array.isArray(body)) {
    const results = await createVariants(productId, body);
    return c.json(results, 201);
  }
  const result = await createVariant(productId, body);
  return c.json(result, 201);
});

// POST /admin/products/:id/variants/bulk — generate by cartesian product
adminVariantRoutes.post('/products/:id/variants/bulk', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { attributeDefinitions, baseSku, basePrecio, basePrecioCoste } = body;
  if (!attributeDefinitions || !baseSku || basePrecio === undefined) {
    return c.json({ error: 'attributeDefinitions, baseSku y basePrecio son requeridos' }, 400);
  }

  const results = await bulkGenerateVariants(productId, {
    attributeDefinitions,
    baseSku,
    basePrecio,
    basePrecioCoste,
  });
  return c.json(results, 201);
});

// PUT /admin/products/:id/variants/bulk — bulk update precio/stock/activo
adminVariantRoutes.put('/products/:id/variants/bulk', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { precio, stock, activo } = body;
  const results = await bulkUpdateVariants(productId, { precio, stock, activo });
  return c.json(results);
});

// PUT /admin/variants/:id — update single variant
adminVariantRoutes.put('/variants/:id', async (c) => {
  const variantId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const result = await updateVariant(variantId, body);
  return c.json(result);
});

// DELETE /admin/variants/:id — soft-delete (sets activo = false)
adminVariantRoutes.delete('/variants/:id', async (c) => {
  const variantId = c.req.param('id');
  await deleteVariant(variantId);
  return c.json({ success: true });
});
