import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth.js';
import {
  uploadProductImage,
  deleteProductImage,
  reorderProductImages,
  uploadVariantImage,
  deleteVariantImage,
} from '../../services/imageService.js';

export const adminImageRoutes = new Hono<AppEnv>();

// POST /admin/products/:id/images — upload product image (multipart, field 'file')
adminImageRoutes.post('/products/:id/images', async (c) => {
  const productId = c.req.param('id');
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'El campo "file" es requerido' }, 400);
  }

  const url = await uploadProductImage(productId, file);
  return c.json({ url }, 201);
});

// DELETE /admin/products/:id/images/:index — delete product image by index
adminImageRoutes.delete('/products/:id/images/:index', async (c) => {
  const productId = c.req.param('id');
  const rawIndex = c.req.param('index');
  const imageIndex = Number(rawIndex);

  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return c.json({ error: 'El índice debe ser un número entero no negativo' }, 400);
  }

  await deleteProductImage(productId, imageIndex);
  return c.json({ message: 'Imagen eliminada' });
});

// PUT /admin/products/:id/images/reorder — reorder product images
adminImageRoutes.put('/products/:id/images/reorder', async (c) => {
  const productId = c.req.param('id');
  let body: { order?: number[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { order } = body;
  if (!Array.isArray(order) || order.some((v) => !Number.isInteger(v) || v < 0)) {
    return c.json({ error: 'El campo "order" debe ser un array de enteros no negativos' }, 400);
  }

  const images = await reorderProductImages(productId, order);
  return c.json({ images });
});

// POST /admin/variants/:id/images — upload variant image (multipart, field 'file')
adminImageRoutes.post('/variants/:id/images', async (c) => {
  const variantId = c.req.param('id');
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'El campo "file" es requerido' }, 400);
  }

  const url = await uploadVariantImage(variantId, file);
  return c.json({ url }, 201);
});

// DELETE /admin/variants/:id/images/:index — delete variant image by index
adminImageRoutes.delete('/variants/:id/images/:index', async (c) => {
  const variantId = c.req.param('id');
  const rawIndex = c.req.param('index');
  const imageIndex = Number(rawIndex);

  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return c.json({ error: 'El índice debe ser un número entero no negativo' }, 400);
  }

  await deleteVariantImage(variantId, imageIndex);
  return c.json({ message: 'Imagen eliminada' });
});
