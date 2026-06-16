# P0: Product Variants + Image Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete product variant system (per-variant stock/price/SKU/images) and drag-and-drop image uploads to Supabase Storage, making GenStore production-ready for admin product management.

**Architecture:** New `product_variants` table with flat JSONB attributes. Supabase Storage `product-images` public bucket for image hosting. Backend Hono routes for CRUD + upload. Frontend components for drag-drop image gallery and variant table management. Full backward compatibility — products without variants work unchanged.

**Tech Stack:** Hono 4, Supabase (PostgreSQL + Storage), React 18, TypeScript, Tailwind CSS 4, shadcn/ui, Vitest

**Spec:** `docs/superpowers/specs/2026-06-16-p0-variants-images-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `server/src/db/migrations/015_product_variants.sql` | DB schema: product_variants table, alter cart_items/order_items, atomic stock functions |
| `server/src/services/imageService.ts` | Supabase Storage upload/delete operations |
| `server/src/services/variantService.ts` | Variant CRUD, bulk generation, stock operations |
| `server/src/routes/admin/images.ts` | Admin image upload/delete/reorder endpoints |
| `server/src/routes/admin/variants.ts` | Admin variant CRUD + bulk endpoints |
| `src/components/Admin/ImageUploader.tsx` | Drag-drop image upload with preview grid |
| `src/components/Admin/VariantManager.tsx` | Attribute definition + variant table generator |
| `src/components/VariantSelector.tsx` | Customer-facing variant selection (swatches + pills) |

### Modified Files

| File | Changes |
|------|---------|
| `server/src/index.ts` | Register new admin routes (images, variants) |
| `server/src/routes/admin/products.ts` | Add `has_variants` to create/update, include variants in GET |
| `server/src/routes/products.ts` | Include variants in public GET /products/:slug |
| `server/src/routes/cart.ts` | Accept `variantId`, validate variant stock |
| `server/src/services/cartService.ts` | Variant-aware stock check and cart upsert |
| `server/src/services/orderService.ts` | Variant-aware stock decrement on order |
| `src/components/Admin/AdminProductForm.tsx` | Replace URL input with ImageUploader, add VariantManager |
| `src/components/ProductDetailPage.tsx` | Replace color swatches with VariantSelector, variant-aware pricing |
| `src/hooks/useCart.ts` | Send variantId, map variant data in cart items |
| `src/lib/apiClient.ts` | Add `upload()` method for multipart FormData |

---

## Task 1: Database Migration

**Files:**
- Create: `server/src/db/migrations/015_product_variants.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 015_product_variants.sql
-- Product Variants system: per-variant stock, price, SKU, images

-- 1. New product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  attributes JSONB NOT NULL DEFAULT '{}',
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_coste DECIMAL(10,2),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  imagenes TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- Updated_at trigger
CREATE TRIGGER set_variant_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Add has_variants flag to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 3. Add variant_id to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- 4. Add variant_id to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- 5. Atomic stock functions for variants
CREATE OR REPLACE FUNCTION decrement_variant_stock(vid UUID, qty INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock INTO current_stock
  FROM product_variants
  WHERE id = vid
  FOR UPDATE;

  IF current_stock IS NULL THEN
    RETURN false;
  END IF;

  IF current_stock < qty THEN
    RETURN false;
  END IF;

  UPDATE product_variants
  SET stock = stock - qty, updated_at = now()
  WHERE id = vid;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_stock(vid UUID, qty INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock + qty, updated_at = now()
  WHERE id = vid;
END;
$$;

-- 6. RLS policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public read for active variants of active products
CREATE POLICY "Variants are publicly readable"
  ON product_variants FOR SELECT
  USING (true);

-- Admin full access via service role (supabaseAdmin bypasses RLS)

-- 7. Supabase Storage bucket (run manually or via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
```

- [ ] **Step 2: Run the migration**

```bash
cd /home/ubuntu/GenStore
# Connect to Supabase and run migration
# If using Supabase CLI:
# supabase db push
# If manual, copy-paste into Supabase SQL Editor

# Also create the storage bucket:
# In Supabase Dashboard > Storage > New Bucket > "product-images" > Public
```

Verify tables exist:
```bash
# Via Supabase SQL Editor:
# SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_variants';
# Should show: id, product_id, sku, attributes, precio, precio_coste, stock, stock_minimo, imagenes, activo, created_at, updated_at
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/db/migrations/015_product_variants.sql
git commit -m "feat(db): add product_variants table, variant stock functions, alter cart/order items"
```

---

## Task 2: Image Upload Service

**Files:**
- Create: `server/src/services/imageService.ts`

- [ ] **Step 1: Create the image service**

```typescript
// server/src/services/imageService.ts
import { supabaseAdmin } from '../config/supabase.js';

const BUCKET = 'product-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 5;

function generateFilename(prefix: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}.${ext}`;
}

export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipo no permitido: ${file.type}. Usa JPG, PNG o WebP`;
  }
  if (file.size > MAX_SIZE) {
    return `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximo 5MB`;
  }
  return null;
}

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  const validationError = await validateImageFile(file);
  if (validationError) throw Object.assign(new Error(validationError), { status: 400 });

  // Check current image count
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  if ((product.imagenes?.length ?? 0) >= MAX_IMAGES) {
    throw Object.assign(new Error(`Maximo ${MAX_IMAGES} imagenes por producto`), { status: 400 });
  }

  const filename = generateFilename('main', file.name);
  const filePath = `${productId}/${filename}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Append URL to product imagenes array
  const newImagenes = [...(product.imagenes ?? []), publicUrl];
  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({ imagenes: newImagenes, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}

export async function deleteProductImage(
  productId: string,
  imageIndex: number
): Promise<void> {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  const imagenes = product.imagenes ?? [];
  if (imageIndex < 0 || imageIndex >= imagenes.length) {
    throw Object.assign(new Error('Indice de imagen invalido'), { status: 400 });
  }

  const url = imagenes[imageIndex];
  // Extract storage path from public URL
  const bucketPath = url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
  if (bucketPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([bucketPath]);
  }

  const newImagenes = imagenes.filter((_, i) => i !== imageIndex);
  const { error } = await supabaseAdmin
    .from('products')
    .update({ imagenes: newImagenes, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);
}

export async function reorderProductImages(
  productId: string,
  newOrder: number[]
): Promise<string[]> {
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('imagenes')
    .eq('id', productId)
    .single();

  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  const imagenes = product.imagenes ?? [];

  if (newOrder.length !== imagenes.length) {
    throw Object.assign(new Error('El orden debe incluir todos los indices'), { status: 400 });
  }

  const reordered = newOrder.map(i => {
    if (i < 0 || i >= imagenes.length) throw Object.assign(new Error('Indice invalido'), { status: 400 });
    return imagenes[i];
  });

  const { error } = await supabaseAdmin
    .from('products')
    .update({ imagenes: reordered, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);
  return reordered;
}

export async function uploadVariantImage(
  variantId: string,
  file: File
): Promise<string> {
  const validationError = await validateImageFile(file);
  if (validationError) throw Object.assign(new Error(validationError), { status: 400 });

  const { data: variant } = await supabaseAdmin
    .from('product_variants')
    .select('product_id, imagenes')
    .eq('id', variantId)
    .single();

  if (!variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
  if ((variant.imagenes?.length ?? 0) >= MAX_IMAGES) {
    throw Object.assign(new Error(`Maximo ${MAX_IMAGES} imagenes por variante`), { status: 400 });
  }

  const filename = generateFilename(variantId, file.name);
  const filePath = `${variant.product_id}/variants/${filename}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  const newImagenes = [...(variant.imagenes ?? []), publicUrl];
  const { error: updateError } = await supabaseAdmin
    .from('product_variants')
    .update({ imagenes: newImagenes })
    .eq('id', variantId);

  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}

export async function deleteVariantImage(
  variantId: string,
  imageIndex: number
): Promise<void> {
  const { data: variant } = await supabaseAdmin
    .from('product_variants')
    .select('imagenes')
    .eq('id', variantId)
    .single();

  if (!variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
  const imagenes = variant.imagenes ?? [];
  if (imageIndex < 0 || imageIndex >= imagenes.length) {
    throw Object.assign(new Error('Indice de imagen invalido'), { status: 400 });
  }

  const url = imagenes[imageIndex];
  const bucketPath = url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
  if (bucketPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([bucketPath]);
  }

  const newImagenes = imagenes.filter((_, i) => i !== imageIndex);
  const { error } = await supabaseAdmin
    .from('product_variants')
    .update({ imagenes: newImagenes })
    .eq('id', variantId);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/services/imageService.ts
git commit -m "feat(backend): add image upload/delete service for products and variants"
```

---

## Task 3: Image Upload API Routes

**Files:**
- Create: `server/src/routes/admin/images.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create image routes**

```typescript
// server/src/routes/admin/images.ts
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

// Upload product image
adminImageRoutes.post('/products/:id/images', async (c) => {
  const productId = c.req.param('id');
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) return c.json({ error: 'Archivo requerido' }, 400);

  const url = await uploadProductImage(productId, file);
  return c.json({ url }, 201);
});

// Delete product image by index
adminImageRoutes.delete('/products/:id/images/:index', async (c) => {
  const productId = c.req.param('id');
  const index = parseInt(c.req.param('index'), 10);

  if (isNaN(index)) return c.json({ error: 'Indice invalido' }, 400);

  await deleteProductImage(productId, index);
  return c.json({ success: true });
});

// Reorder product images
adminImageRoutes.put('/products/:id/images/reorder', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { order } = body;
  if (!Array.isArray(order)) return c.json({ error: 'order debe ser un array de indices' }, 400);

  const reordered = await reorderProductImages(productId, order);
  return c.json({ imagenes: reordered });
});

// Upload variant image
adminImageRoutes.post('/variants/:id/images', async (c) => {
  const variantId = c.req.param('id');
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) return c.json({ error: 'Archivo requerido' }, 400);

  const url = await uploadVariantImage(variantId, file);
  return c.json({ url }, 201);
});

// Delete variant image by index
adminImageRoutes.delete('/variants/:id/images/:index', async (c) => {
  const variantId = c.req.param('id');
  const index = parseInt(c.req.param('index'), 10);

  if (isNaN(index)) return c.json({ error: 'Indice invalido' }, 400);

  await deleteVariantImage(variantId, index);
  return c.json({ success: true });
});
```

- [ ] **Step 2: Register routes in index.ts**

In `server/src/index.ts`, add after existing admin route registrations (around line 88):

```typescript
import { adminImageRoutes } from './routes/admin/images.js';
```

And inside the admin route group (after the existing `admin.route(...)` calls):

```typescript
admin.route('/', adminImageRoutes);
```

This mounts image routes at `/admin/products/:id/images` and `/admin/variants/:id/images`.

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/routes/admin/images.ts server/src/index.ts
git commit -m "feat(api): add image upload/delete/reorder endpoints for products and variants"
```

---

## Task 4: Variant CRUD Service

**Files:**
- Create: `server/src/services/variantService.ts`

- [ ] **Step 1: Create the variant service**

```typescript
// server/src/services/variantService.ts
import { supabaseAdmin } from '../config/supabase.js';

interface VariantInput {
  sku: string;
  attributes: Record<string, string>;
  precio: number;
  precio_coste?: number | null;
  stock?: number;
  stock_minimo?: number;
  imagenes?: string[];
  activo?: boolean;
}

interface BulkGenerateInput {
  attributeDefinitions: { name: string; values: string[] }[];
  baseSku: string;
  basePrecio: number;
  basePrecioCoste?: number | null;
}

export async function listVariants(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVariant(productId: string, input: VariantInput) {
  // Verify product exists
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, has_variants')
    .eq('id', productId)
    .single();

  if (!product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });

  // Check for duplicate attributes
  const { data: existing } = await supabaseAdmin
    .from('product_variants')
    .select('id, attributes')
    .eq('product_id', productId);

  const inputAttrsKey = JSON.stringify(input.attributes, Object.keys(input.attributes).sort());
  const duplicate = (existing ?? []).find(v => {
    const vKey = JSON.stringify(v.attributes, Object.keys(v.attributes as Record<string, string>).sort());
    return vKey === inputAttrsKey;
  });

  if (duplicate) {
    throw Object.assign(new Error('Ya existe una variante con estos atributos'), { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: input.sku,
      attributes: input.attributes,
      precio: input.precio,
      precio_coste: input.precio_coste ?? null,
      stock: input.stock ?? 0,
      stock_minimo: input.stock_minimo ?? 5,
      imagenes: input.imagenes ?? [],
      activo: input.activo ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-set has_variants on product
  if (!product.has_variants) {
    await supabaseAdmin
      .from('products')
      .update({ has_variants: true, updated_at: new Date().toISOString() })
      .eq('id', productId);
  }

  return data;
}

export async function createVariants(productId: string, inputs: VariantInput[]) {
  const results = [];
  for (const input of inputs) {
    results.push(await createVariant(productId, input));
  }
  return results;
}

export async function updateVariant(variantId: string, input: Partial<VariantInput>) {
  const updateData: Record<string, unknown> = {};

  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.attributes !== undefined) updateData.attributes = input.attributes;
  if (input.precio !== undefined) updateData.precio = input.precio;
  if (input.precio_coste !== undefined) updateData.precio_coste = input.precio_coste;
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.stock_minimo !== undefined) updateData.stock_minimo = input.stock_minimo;
  if (input.imagenes !== undefined) updateData.imagenes = input.imagenes;
  if (input.activo !== undefined) updateData.activo = input.activo;

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .update(updateData)
    .eq('id', variantId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVariant(variantId: string) {
  const { error } = await supabaseAdmin
    .from('product_variants')
    .update({ activo: false })
    .eq('id', variantId);

  if (error) throw new Error(error.message);
}

export async function bulkGenerateVariants(productId: string, input: BulkGenerateInput) {
  const { attributeDefinitions, baseSku, basePrecio, basePrecioCoste } = input;

  if (attributeDefinitions.length === 0) {
    throw Object.assign(new Error('Se necesita al menos un atributo'), { status: 400 });
  }

  // Generate cartesian product of all attribute values
  const combinations = cartesianProduct(
    attributeDefinitions.map(a => a.values.map(v => ({ name: a.name, value: v })))
  );

  if (combinations.length > 100) {
    throw Object.assign(new Error('Demasiadas combinaciones (max 100)'), { status: 400 });
  }

  // Delete existing variants for this product before regenerating
  await supabaseAdmin
    .from('product_variants')
    .delete()
    .eq('product_id', productId);

  const variants: VariantInput[] = combinations.map(combo => {
    const attributes: Record<string, string> = {};
    const skuParts: string[] = [baseSku];

    for (const attr of combo) {
      attributes[attr.name] = attr.value;
      skuParts.push(attr.value.slice(0, 3).toUpperCase().replace(/\s+/g, ''));
    }

    return {
      sku: skuParts.join('-'),
      attributes,
      precio: basePrecio,
      precio_coste: basePrecioCoste ?? null,
      stock: 0,
      stock_minimo: 5,
      activo: true,
    };
  });

  const results = await createVariants(productId, variants);

  // Ensure has_variants is true
  await supabaseAdmin
    .from('products')
    .update({ has_variants: true, updated_at: new Date().toISOString() })
    .eq('id', productId);

  return results;
}

export async function bulkUpdateVariants(
  productId: string,
  updates: { precio?: number; stock?: number; activo?: boolean }
) {
  const updateData: Record<string, unknown> = {};
  if (updates.precio !== undefined) updateData.precio = updates.precio;
  if (updates.stock !== undefined) updateData.stock = updates.stock;
  if (updates.activo !== undefined) updateData.activo = updates.activo;

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .update(updateData)
    .eq('product_id', productId)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  return first.flatMap(val => restProduct.map(combo => [val, ...combo]));
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/services/variantService.ts
git commit -m "feat(backend): add variant CRUD service with bulk generation and cartesian product"
```

---

## Task 5: Variant API Routes

**Files:**
- Create: `server/src/routes/admin/variants.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create variant routes**

```typescript
// server/src/routes/admin/variants.ts
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

// List variants for a product
adminVariantRoutes.get('/products/:id/variants', async (c) => {
  const productId = c.req.param('id');
  const variants = await listVariants(productId);
  return c.json(variants);
});

// Create one or more variants
adminVariantRoutes.post('/products/:id/variants', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  // Accept single object or array
  if (Array.isArray(body)) {
    const results = await createVariants(productId, body);
    return c.json(results, 201);
  }

  const result = await createVariant(productId, body);
  return c.json(result, 201);
});

// Bulk generate from attribute definitions
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

// Bulk update all variants of a product
adminVariantRoutes.put('/products/:id/variants/bulk', async (c) => {
  const productId = c.req.param('id');
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const results = await bulkUpdateVariants(productId, body);
  return c.json(results);
});

// Update single variant
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

// Delete (soft) single variant
adminVariantRoutes.delete('/variants/:id', async (c) => {
  const variantId = c.req.param('id');
  await deleteVariant(variantId);
  return c.json({ success: true });
});
```

- [ ] **Step 2: Register in index.ts**

Add import in `server/src/index.ts`:

```typescript
import { adminVariantRoutes } from './routes/admin/variants.js';
```

Add route registration inside the admin group:

```typescript
admin.route('/', adminVariantRoutes);
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/routes/admin/variants.ts server/src/index.ts
git commit -m "feat(api): add variant CRUD and bulk generation admin endpoints"
```

---

## Task 6: Modify Public Product Routes to Include Variants

**Files:**
- Modify: `server/src/routes/products.ts`

- [ ] **Step 1: Update GET /products/:slug to include variants**

In `server/src/routes/products.ts`, find the GET `/:slug` handler. After fetching the product, add a variants query:

```typescript
// After the existing product fetch, before returning:
let variants = [];
if (product.has_variants) {
  const { data: variantData } = await supabaseAdmin
    .from('product_variants')
    .select('id, sku, attributes, precio, stock, imagenes, activo')
    .eq('product_id', product.id)
    .eq('activo', true)
    .order('created_at', { ascending: true });

  variants = variantData ?? [];
}

return c.json({ ...product, variants });
```

- [ ] **Step 2: Update GET /products listing for price range**

In the product listing endpoint, after fetching products, for each product with `has_variants`, compute the min price:

```typescript
// After fetching products array, enrich with variant price range:
const enriched = await Promise.all(
  products.map(async (p: any) => {
    if (!p.has_variants) return p;
    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('precio')
      .eq('product_id', p.id)
      .eq('activo', true)
      .order('precio', { ascending: true })
      .limit(1);

    const minPrice = variants?.[0]?.precio ?? p.precio;
    return { ...p, precio_desde: minPrice };
  })
);
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/routes/products.ts
git commit -m "feat(api): include variants in public product endpoints, add precio_desde"
```

---

## Task 7: Modify Cart Service for Variant Support

**Files:**
- Modify: `server/src/routes/cart.ts`
- Modify: `server/src/services/cartService.ts`

- [ ] **Step 1: Update cart route to accept variantId**

In `server/src/routes/cart.ts`, update the POST handler:

```typescript
// Replace the existing destructure line:
const { productId, variantId, cantidad = 1, opciones = {} } = body;

// Add validation after existing checks:
if (variantId && typeof variantId !== 'string') {
  return c.json({ error: 'variantId debe ser un UUID string' }, 400);
}

// Update the service call:
const item = await cartService.addToCart(user.id, productId, cantidad, opciones, variantId);
```

- [ ] **Step 2: Update cartService.addToCart for variant-aware stock**

In `server/src/services/cartService.ts`, update the `addToCart` function signature and stock check logic:

```typescript
export async function addToCart(
  userId: string,
  productId: string,
  cantidad: number,
  opciones: Record<string, unknown> = {},
  variantId?: string
): Promise<CartItem> {
  // Fetch product
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('stock, activo, has_variants')
    .eq('id', productId)
    .single();

  if (productError || !product) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  if (!product.activo) throw Object.assign(new Error('Producto no disponible'), { status: 400 });

  // If product has variants, variantId is required
  if (product.has_variants && !variantId) {
    throw Object.assign(new Error('Debes seleccionar una variante'), { status: 400 });
  }

  // Determine stock source
  let availableStock = product.stock;
  if (variantId) {
    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('stock, activo')
      .eq('id', variantId)
      .eq('product_id', productId)
      .single();

    if (!variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 });
    if (!variant.activo) throw Object.assign(new Error('Variante no disponible'), { status: 400 });
    availableStock = variant.stock;
  }

  if (availableStock < cantidad) {
    throw Object.assign(new Error('Stock insuficiente'), { status: 400 });
  }

  // Upsert: check existing cart item with same product + variant
  const query = supabaseAdmin
    .from('cart_items')
    .select('id, cantidad')
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (variantId) {
    query.eq('variant_id', variantId);
  } else {
    query.is('variant_id', null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const newQty = existing.cantidad + cantidad;
    if (newQty > availableStock) {
      throw Object.assign(new Error('Stock insuficiente'), { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ cantidad: newQty })
      .eq('id', existing.id)
      .select('*, product:products(*), variant:product_variants(*)')
      .single();

    if (error) throw new Error(error.message);
    return data as CartItem;
  }

  // Insert new
  const insertData: Record<string, unknown> = {
    user_id: userId,
    product_id: productId,
    cantidad,
    opciones,
  };
  if (variantId) insertData.variant_id = variantId;

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert(insertData)
    .select('*, product:products(*), variant:product_variants(*)')
    .single();

  if (error) throw new Error(error.message);
  return data as CartItem;
}
```

Also update the `getCart` function to join variants:

```typescript
// In getCart, update the select to include variant:
.select('*, product:products(*, categories(*)), variant:product_variants(*)')
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/routes/cart.ts server/src/services/cartService.ts
git commit -m "feat(cart): variant-aware stock check and cart upsert with variant_id"
```

---

## Task 8: Modify Order Service for Variant Stock

**Files:**
- Modify: `server/src/services/orderService.ts` (or the order creation route)

- [ ] **Step 1: Update order creation to decrement variant stock**

In the order creation flow (where stock is decremented after payment), add variant-aware logic:

```typescript
// For each order item, check if it has a variant_id
for (const item of orderItems) {
  if (item.variant_id) {
    // Use variant stock decrement
    const { data: success } = await supabaseAdmin.rpc('decrement_variant_stock', {
      vid: item.variant_id,
      qty: item.cantidad,
    });
    if (!success) throw new Error(`Stock insuficiente para variante ${item.variant_id}`);
  } else {
    // Use product stock decrement (existing logic)
    const { data: success } = await supabaseAdmin.rpc('decrement_stock', {
      pid: item.product_id,
      qty: item.cantidad,
    });
    if (!success) throw new Error(`Stock insuficiente para producto ${item.product_id}`);
  }
}
```

Also update order cancellation / refund to use `increment_variant_stock` when `variant_id` is present.

- [ ] **Step 2: Update order_items insert to include variant_id**

In the order creation, when inserting `order_items` from cart items:

```typescript
// Map cart items to order items, preserving variant_id
const orderItemsInsert = cartItems.map(ci => ({
  order_id: order.id,
  product_id: ci.product_id,
  variant_id: ci.variant_id ?? null,
  cantidad: ci.cantidad,
  precio_unitario: ci.variant_id && ci.variant
    ? ci.variant.precio
    : ci.product.precio,
  subtotal: (ci.variant_id && ci.variant ? ci.variant.precio : ci.product.precio) * ci.cantidad,
  opciones: ci.variant_id && ci.variant
    ? { ...ci.opciones, variant_attributes: ci.variant.attributes }
    : ci.opciones,
}));
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/services/orderService.ts
git commit -m "feat(orders): variant-aware stock decrement/increment on order create/cancel"
```

---

## Task 9: Update Admin Product Routes for has_variants

**Files:**
- Modify: `server/src/routes/admin/products.ts`

- [ ] **Step 1: Add has_variants to product create/update**

In the POST `/admin/products` handler, add `has_variants` to the destructured fields and the insert data:

```typescript
// Add to destructure:
const { nombre, sku, /* ...existing fields... */, has_variants } = body;

// Add to insertData conditional block:
if (has_variants !== undefined) insertData.has_variants = has_variants;
```

Same for PUT `/admin/products/:id`:

```typescript
// Add to destructure:
const { nombre, sku, /* ...existing fields... */, has_variants } = body;

// Add to updateData conditional block:
if (has_variants !== undefined) updateData.has_variants = has_variants;
```

- [ ] **Step 2: Include variants in admin GET products**

In the admin GET `/admin/products` handler, update the select to include `has_variants`:

```typescript
.select('*, categories(nombre), suppliers(nombre), variants:product_variants(id, sku, attributes, precio, stock, activo)')
```

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/GenStore
git add server/src/routes/admin/products.ts
git commit -m "feat(api): support has_variants in product CRUD, include variants in admin listing"
```

---

## Task 10: Frontend — apiClient Upload Method

**Files:**
- Modify: `src/lib/apiClient.ts`

- [ ] **Step 1: Add upload method to apiClient**

Add a new `upload` method that sends `multipart/form-data` instead of JSON:

```typescript
// Add to the apiClient object:
async upload<T = unknown>(path: string, file: File, fieldName = 'file'): Promise<T> {
  const { signal, clear } = withTimeout(30_000); // 30s for uploads
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: HeadersInit = {};
    if (_accessToken) {
      headers['Authorization'] = `Bearer ${_accessToken}`;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    // Do NOT set Content-Type — browser sets it with boundary for FormData

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      signal,
    });

    return handleResponse<T>(response);
  } finally {
    clear();
  }
},
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/lib/apiClient.ts
git commit -m "feat(frontend): add upload method to apiClient for multipart file uploads"
```

---

## Task 11: Frontend — ImageUploader Component

**Files:**
- Create: `src/components/Admin/ImageUploader.tsx`

- [ ] **Step 1: Create the ImageUploader component**

```tsx
// src/components/Admin/ImageUploader.tsx
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, GripVertical, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface ImageUploaderProps {
  images: string[];
  uploadEndpoint: string; // e.g. "/admin/products/{id}/images"
  deleteEndpoint: string; // e.g. "/admin/products/{id}/images"
  reorderEndpoint?: string; // e.g. "/admin/products/{id}/images/reorder"
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUploader({
  images,
  uploadEndpoint,
  deleteEndpoint,
  reorderEndpoint,
  maxImages = 5,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;
      if (remaining <= 0) return;

      const toUpload = fileArray.slice(0, remaining);
      setUploading(true);

      try {
        for (const file of toUpload) {
          if (!ALLOWED_TYPES.includes(file.type)) {
            alert(`${file.name}: tipo no permitido. Usa JPG, PNG o WebP`);
            continue;
          }
          if (file.size > MAX_SIZE) {
            alert(`${file.name}: demasiado grande (max 5MB)`);
            continue;
          }

          const result = await apiClient.upload<{ url: string }>(uploadEndpoint, file);
          onImagesChange([...images, result.url]);
          // Update images reference for subsequent uploads in the same batch
          images = [...images, result.url];
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error subiendo imagen');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [images, uploadEndpoint, maxImages, onImagesChange]
  );

  const handleDelete = async (index: number) => {
    try {
      await apiClient.delete(`${deleteEndpoint}/${index}`);
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error eliminando imagen');
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onImagesChange(newImages);

    // Persist reorder to backend
    if (reorderEndpoint) {
      const order = newImages.map(img => images.indexOf(img));
      apiClient.put(reorderEndpoint, { order }).catch(console.error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Imagenes ({images.length}/{maxImages})
        </label>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) handleDragReorder(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`relative group aspect-square rounded-lg border-2 overflow-hidden ${
                dragIndex === index ? 'opacity-50 border-dashed border-primary' : 'border-border'
              }`}
            >
              <img
                src={url}
                alt={`Producto imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white rounded-full p-0.5">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing p-1 bg-white/90 rounded"
                >
                  <GripVertical className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Arrastra imagenes o haz click para seleccionar
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WebP — Max 5MB
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/Admin/ImageUploader.tsx
git commit -m "feat(admin): add ImageUploader component with drag-drop, preview, reorder, delete"
```

---

## Task 12: Frontend — VariantManager Component

**Files:**
- Create: `src/components/Admin/VariantManager.tsx`

- [ ] **Step 1: Create the VariantManager component**

```tsx
// src/components/Admin/VariantManager.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, Upload } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { ImageUploader } from './ImageUploader';

interface Attribute {
  name: string;
  values: string[];
}

interface Variant {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  precio: number;
  precio_coste: number | null;
  stock: number;
  stock_minimo: number;
  imagenes: string[];
  activo: boolean;
}

interface VariantManagerProps {
  productId: string | null; // null if product not yet created
  productSku: string;
  productPrecio: number;
  productPrecioCoste: number | null;
  hasVariants: boolean;
  onHasVariantsChange: (val: boolean) => void;
}

export function VariantManager({
  productId,
  productSku,
  productPrecio,
  productPrecioCoste,
  hasVariants,
  onHasVariantsChange,
}: VariantManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [bulkPrecio, setBulkPrecio] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Load existing variants when editing a product
  useEffect(() => {
    if (!productId || !hasVariants) return;
    loadVariants();
  }, [productId, hasVariants]);

  const loadVariants = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await apiClient.get<Variant[]>(`/admin/products/${productId}/variants`);
      setVariants(data);

      // Reconstruct attributes from existing variants
      if (data.length > 0) {
        const attrMap = new Map<string, Set<string>>();
        for (const v of data) {
          for (const [key, val] of Object.entries(v.attributes)) {
            if (!attrMap.has(key)) attrMap.set(key, new Set());
            attrMap.get(key)!.add(val);
          }
        }
        setAttributes(
          Array.from(attrMap.entries()).map(([name, vals]) => ({
            name,
            values: Array.from(vals),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading variants:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', values: [] }]);
  };

  const updateAttributeName = (index: number, name: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], name };
    setAttributes(updated);
  };

  const addAttributeValue = (attrIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex] = {
      ...updated[attrIndex],
      values: [...updated[attrIndex].values, ''],
    };
    setAttributes(updated);
  };

  const updateAttributeValue = (attrIndex: number, valIndex: number, value: string) => {
    const updated = [...attributes];
    const vals = [...updated[attrIndex].values];
    vals[valIndex] = value;
    updated[attrIndex] = { ...updated[attrIndex], values: vals };
    setAttributes(updated);
  };

  const removeAttributeValue = (attrIndex: number, valIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex] = {
      ...updated[attrIndex],
      values: updated[attrIndex].values.filter((_, i) => i !== valIndex),
    };
    setAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const generateVariants = async () => {
    if (!productId) {
      alert('Guarda el producto primero antes de generar variantes');
      return;
    }

    const validAttrs = attributes.filter(
      (a) => a.name.trim() && a.values.some((v) => v.trim())
    );
    if (validAttrs.length === 0) {
      alert('Define al menos un atributo con valores');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.post<Variant[]>(
        `/admin/products/${productId}/variants/bulk`,
        {
          attributeDefinitions: validAttrs.map((a) => ({
            name: a.name.trim(),
            values: a.values.filter((v) => v.trim()).map((v) => v.trim()),
          })),
          baseSku: productSku || 'PROD',
          basePrecio: productPrecio,
          basePrecioCoste: productPrecioCoste,
        }
      );
      setVariants(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error generando variantes');
    } finally {
      setLoading(false);
    }
  };

  const updateVariantField = async (
    variantId: string,
    field: string,
    value: unknown
  ) => {
    try {
      const updated = await apiClient.put<Variant>(`/admin/variants/${variantId}`, {
        [field]: value,
      });
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, ...updated } : v))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error actualizando variante');
    }
  };

  const applyBulkPrecio = async () => {
    if (!productId || !bulkPrecio) return;
    const precio = parseFloat(bulkPrecio);
    if (isNaN(precio) || precio < 0) return;
    setLoading(true);
    try {
      const result = await apiClient.put<Variant[]>(
        `/admin/products/${productId}/variants/bulk`,
        { precio }
      );
      setVariants(result);
      setBulkPrecio('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const applyBulkStock = async () => {
    if (!productId || !bulkStock) return;
    const stock = parseInt(bulkStock, 10);
    if (isNaN(stock) || stock < 0) return;
    setLoading(true);
    try {
      const result = await apiClient.put<Variant[]>(
        `/admin/products/${productId}/variants/bulk`,
        { stock }
      );
      setVariants(result);
      setBulkStock('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onHasVariantsChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
        </label>
        <span className="text-sm font-medium text-foreground">
          Este producto tiene variantes
        </span>
      </div>

      {!hasVariants ? null : (
      <>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando variantes...</span>
        </div>
      )}

      {/* Attribute definitions */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Atributos</h4>
        {attributes.map((attr, attrIdx) => (
          <div key={attrIdx} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attr.name}
                onChange={(e) => updateAttributeName(attrIdx, e.target.value)}
                placeholder="Nombre (ej: Color, Talla)"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-md"
              />
              <button
                type="button"
                onClick={() => removeAttribute(attrIdx)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val, valIdx) => (
                <div key={valIdx} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateAttributeValue(attrIdx, valIdx, e.target.value)}
                    placeholder="Valor"
                    className="w-24 px-2 py-1 text-sm bg-background border border-border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttributeValue(attrIdx, valIdx)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addAttributeValue(attrIdx)}
                className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30"
              >
                + Valor
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addAttribute}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30"
          >
            <Plus className="w-4 h-4" /> Atributo
          </button>
          {attributes.length > 0 && productId && (
            <button
              type="button"
              onClick={generateVariants}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 disabled:opacity-50"
            >
              Generar combinaciones
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {variants.length > 0 && (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Precio a todas</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={bulkPrecio}
                onChange={(e) => setBulkPrecio(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-24 px-2 py-1 text-sm bg-background border border-border rounded-md"
              />
              <button
                type="button"
                onClick={applyBulkPrecio}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Stock a todas</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="0"
                className="w-24 px-2 py-1 text-sm bg-background border border-border rounded-md"
              />
              <button
                type="button"
                onClick={applyBulkStock}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variants table */}
      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {attributes.filter(a => a.name).map((a) => (
                  <th key={a.name} className="px-2 py-2 font-medium">{a.name}</th>
                ))}
                <th className="px-2 py-2 font-medium">SKU</th>
                <th className="px-2 py-2 font-medium">Precio</th>
                <th className="px-2 py-2 font-medium">Stock</th>
                <th className="px-2 py-2 font-medium">Imgs</th>
                <th className="px-2 py-2 font-medium">Activo</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <>
                  <tr key={variant.id ?? variant.sku} className="border-b border-border/50 hover:bg-muted/30">
                    {attributes.filter(a => a.name).map((a) => (
                      <td key={a.name} className="px-2 py-2">
                        {variant.attributes[a.name] ?? '-'}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={variant.sku}
                        onBlur={(e) =>
                          variant.id && e.target.value !== variant.sku &&
                          updateVariantField(variant.id, 'sku', e.target.value)
                        }
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id ? { ...v, sku: e.target.value } : v
                            )
                          )
                        }
                        className="w-32 px-1 py-0.5 text-xs bg-background border border-border rounded"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={variant.precio}
                        step="0.01"
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (variant.id && !isNaN(val)) updateVariantField(variant.id, 'precio', val);
                        }}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id
                                ? { ...v, precio: parseFloat(e.target.value) || 0 }
                                : v
                            )
                          )
                        }
                        className="w-20 px-1 py-0.5 text-xs bg-background border border-border rounded"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={variant.stock}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (variant.id && !isNaN(val)) updateVariantField(variant.id, 'stock', val);
                        }}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((v) =>
                              v.id === variant.id
                                ? { ...v, stock: parseInt(e.target.value, 10) || 0 }
                                : v
                            )
                          )
                        }
                        className="w-16 px-1 py-0.5 text-xs bg-background border border-border rounded"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedVariant(
                            expandedVariant === variant.id ? null : variant.id ?? null
                          )
                        }
                        className="flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded hover:bg-muted/80"
                      >
                        <Upload className="w-3 h-3" />
                        {variant.imagenes?.length ?? 0}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={variant.activo}
                        onChange={(e) =>
                          variant.id &&
                          updateVariantField(variant.id, 'activo', e.target.checked)
                        }
                        className="rounded"
                      />
                    </td>
                  </tr>
                  {/* Expanded image uploader row */}
                  {expandedVariant === variant.id && variant.id && (
                    <tr key={`${variant.id}-images`}>
                      <td colSpan={attributes.length + 5} className="px-2 py-3 bg-muted/20">
                        <ImageUploader
                          images={variant.imagenes ?? []}
                          uploadEndpoint={`/admin/variants/${variant.id}/images`}
                          deleteEndpoint={`/admin/variants/${variant.id}/images`}
                          maxImages={5}
                          onImagesChange={(imgs) =>
                            setVariants((prev) =>
                              prev.map((v) =>
                                v.id === variant.id ? { ...v, imagenes: imgs } : v
                              )
                            )
                          }
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!productId && hasVariants && (
        <p className="text-sm text-amber-400">
          Guarda el producto primero para poder gestionar variantes.
        </p>
      )}
      </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/Admin/VariantManager.tsx
git commit -m "feat(admin): add VariantManager component with attribute builder, variant table, bulk actions"
```

---

## Task 13: Update AdminProductForm

**Files:**
- Modify: `src/components/Admin/AdminProductForm.tsx`

- [ ] **Step 1: Add imports and state for new components**

At the top of AdminProductForm.tsx, add:

```typescript
import { ImageUploader } from './ImageUploader';
import { VariantManager } from './VariantManager';
```

Add to the form state type and initial form:

```typescript
// Add to emptyForm:
has_variants: false,

// In the useEffect that loads product data:
has_variants: product.has_variants ?? false,
```

- [ ] **Step 2: Replace the imagenes text input with ImageUploader**

Replace the imagenes text field (around lines 793-806) with:

```tsx
{/* Replace old imagenes input with ImageUploader */}
{product?.id ? (
  <ImageUploader
    images={product?.imagenes ?? []}
    uploadEndpoint={`/admin/products/${product.id}/images`}
    deleteEndpoint={`/admin/products/${product.id}/images`}
    reorderEndpoint={`/admin/products/${product.id}/images/reorder`}
    maxImages={5}
    onImagesChange={(imgs) => {
      // Update local form state so the parent knows images changed
      handleChange('imagenes', imgs.join(', '));
    }}
  />
) : (
  <div className="text-sm text-amber-400 p-3 border border-amber-600/30 rounded-lg">
    Guarda el producto primero para subir imagenes.
  </div>
)}
```

- [ ] **Step 3: Add VariantManager section after the content section**

Add a new collapsible section (following the existing pattern with color-coded borders):

```tsx
{/* Section: Variantes — Orange border */}
<div className="border-l-4 border-orange-500 pl-4 space-y-4">
  <button
    type="button"
    onClick={() => toggleSection('variantes')}
    className="flex items-center justify-between w-full text-left"
  >
    <h3 className="text-lg font-semibold text-foreground">Variantes</h3>
    <ChevronDown className={`w-5 h-5 transition-transform ${openSections.variantes ? 'rotate-180' : ''}`} />
  </button>

  {openSections.variantes && (
    <VariantManager
      productId={product?.id ?? null}
      productSku={form.sku}
      productPrecio={form.precio}
      productPrecioCoste={form.precio_coste || null}
      hasVariants={form.has_variants}
      onHasVariantsChange={(val) => handleChange('has_variants', val)}
    />
  )}
</div>
```

Add `'variantes'` to the `openSections` state initialization.

- [ ] **Step 4: Conditionally hide precio/stock fields when has_variants is true**

Wrap the precio and stock inputs with a condition:

```tsx
{!form.has_variants && (
  <>
    {/* existing precio field */}
    {/* existing stock field */}
    {/* existing stock_minimo field */}
  </>
)}
{form.has_variants && (
  <p className="text-sm text-muted-foreground italic">
    Precio y stock se gestionan desde las variantes.
  </p>
)}
```

- [ ] **Step 5: Add has_variants to the submit payload**

In the `handleSubmit` function, add to the payload object:

```typescript
has_variants: form.has_variants,
```

- [ ] **Step 6: Remove the old colors JSON textarea**

Remove the entire colors textarea section (the one that expects manual JSON input like `[{"name":"Azul","value":"blue","hex":"#0000FF"}]`). Colors are now managed as variant attributes through the VariantManager.

- [ ] **Step 7: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/Admin/AdminProductForm.tsx
git commit -m "feat(admin): integrate ImageUploader and VariantManager into product form"
```

---

## Task 14: Frontend — VariantSelector Component (Customer-facing)

**Files:**
- Create: `src/components/VariantSelector.tsx`

- [ ] **Step 1: Create the VariantSelector component**

```tsx
// src/components/VariantSelector.tsx
import { useState, useMemo, useEffect } from 'react';

interface Variant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  precio: number;
  stock: number;
  imagenes: string[];
  activo: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantSelect: (variant: Variant | null) => void;
}

// Detect if an attribute looks like a color (has hex-like values or common color names)
function isColorAttribute(name: string): boolean {
  return /color|colour|colou?r/i.test(name);
}

export function VariantSelector({ variants, onVariantSelect }: VariantSelectorProps) {
  // Extract unique attribute names and their possible values
  const attributeOptions = useMemo(() => {
    const attrMap = new Map<string, string[]>();

    for (const v of variants) {
      for (const [key, val] of Object.entries(v.attributes)) {
        if (!attrMap.has(key)) attrMap.set(key, []);
        const existing = attrMap.get(key)!;
        if (!existing.includes(val)) existing.push(val);
      }
    }

    return Array.from(attrMap.entries()).map(([name, values]) => ({ name, values }));
  }, [variants]);

  // Track user selections for each attribute
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Auto-select first value of each attribute on mount
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const attr of attributeOptions) {
      initial[attr.name] = attr.values[0] ?? '';
    }
    setSelections(initial);
  }, [attributeOptions]);

  // Find the matching variant for current selections
  const selectedVariant = useMemo(() => {
    if (Object.keys(selections).length !== attributeOptions.length) return null;

    return variants.find((v) =>
      Object.entries(selections).every(([key, val]) => v.attributes[key] === val)
    ) ?? null;
  }, [selections, variants, attributeOptions]);

  // Notify parent of selection change
  useEffect(() => {
    onVariantSelect(selectedVariant);
  }, [selectedVariant, onVariantSelect]);

  // Check if a specific attribute value has any available variant (for availability indication)
  const isValueAvailable = (attrName: string, attrValue: string): boolean => {
    const testSelections = { ...selections, [attrName]: attrValue };
    return variants.some(
      (v) =>
        v.activo &&
        v.stock > 0 &&
        Object.entries(testSelections).every(([k, val]) =>
          v.attributes[k] === undefined || v.attributes[k] === val
        )
    );
  };

  const handleSelect = (attrName: string, value: string) => {
    setSelections((prev) => ({ ...prev, [attrName]: value }));
  };

  if (attributeOptions.length === 0) return null;

  return (
    <div className="space-y-4">
      {attributeOptions.map((attr) => (
        <div key={attr.name} className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {attr.name}:{' '}
            <span className="text-muted-foreground font-normal">
              {selections[attr.name] || ''}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {attr.values.map((value) => {
              const isSelected = selections[attr.name] === value;
              const available = isValueAvailable(attr.name, value);

              if (isColorAttribute(attr.name)) {
                // Render as color swatch
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelect(attr.name, value)}
                    disabled={!available}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-primary scale-110 ring-2 ring-primary/30'
                        : available
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-30 cursor-not-allowed'
                    } ${!available ? 'relative after:content-[""] after:absolute after:inset-0 after:bg-gray-500/40 after:rounded-full after:bg-[linear-gradient(to_top_right,transparent_45%,gray_45%,gray_55%,transparent_55%)]' : ''}`}
                    style={{ backgroundColor: value }}
                    title={value}
                    aria-label={`${attr.name}: ${value}`}
                  />
                );
              }

              // Render as pill button
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSelect(attr.name, value)}
                  disabled={!available}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground font-medium'
                      : available
                        ? 'border-border bg-background text-foreground hover:border-primary/50'
                        : 'border-border bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50'
                  }`}
                  aria-label={`${attr.name}: ${value}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/VariantSelector.tsx
git commit -m "feat(frontend): add VariantSelector component with color swatches and pill buttons"
```

---

## Task 15: Update ProductDetailPage for Variant Selection

**Files:**
- Modify: `src/components/ProductDetailPage.tsx`

- [ ] **Step 1: Import VariantSelector and add variant state**

Add imports and state:

```typescript
import { VariantSelector } from './VariantSelector';

// Inside the component, add state:
const [selectedVariant, setSelectedVariant] = useState<any>(null);
```

- [ ] **Step 2: Replace the old color selection block**

Replace the old color swatch section (around lines 280-307) with:

```tsx
{/* Variant selection */}
{product.has_variants && product.variants?.length > 0 ? (
  <VariantSelector
    variants={product.variants}
    onVariantSelect={setSelectedVariant}
  />
) : product.colors && product.colors.length > 0 ? (
  /* Keep old color-only display as fallback for products without has_variants */
  <div className="space-y-2">
    {/* ... existing color swatches code ... */}
  </div>
) : null}
```

- [ ] **Step 3: Use variant pricing and stock**

Update the price display and stock checks to use variant data when available:

```typescript
// Computed values based on variant or product
const displayPrecio = selectedVariant?.precio ?? product.precio;
const displayStock = selectedVariant?.stock ?? product.stock;
const displaySku = selectedVariant?.sku ?? product.sku;
const displayImages = (selectedVariant?.imagenes?.length > 0)
  ? selectedVariant.imagenes
  : (product.imagenes ?? []);
const inStock = displayStock > 0;
```

Replace references to `product.precio` with `displayPrecio`, `product.stock` with `displayStock` in the price display, stock badge, and quantity selector sections.

Update the images array to use `displayImages` instead of `product.imagenes`.

- [ ] **Step 4: Update the addToCart handler to send variantId**

```typescript
const handleAddToCart = async () => {
  if (!inStock || cartState !== 'idle') return;

  // If product has variants, require a selection
  if (product.has_variants && !selectedVariant) return;

  setCartState('loading');
  try {
    for (let i = 0; i < quantity; i++) {
      await Promise.resolve(
        onAddToCart(
          product,
          selectedVariant?.id,  // variantId
          selectedVariant
            ? JSON.stringify(selectedVariant.attributes)
            : (product.colors?.find(c => c.name === selectedColor)?.color),
          selectedVariant
            ? Object.values(selectedVariant.attributes).join(' / ')
            : (selectedColor ?? undefined)
        )
      );
    }
    setCartState('done');
    setTimeout(() => setCartState('idle'), 2000);
  } catch {
    setCartState('idle');
  }
};
```

- [ ] **Step 5: Disable add-to-cart when variant required but not fully selected**

```tsx
<button
  onClick={handleAddToCart}
  disabled={
    !inStock ||
    cartState !== 'idle' ||
    (product.has_variants && !selectedVariant)
  }
  className="..."
>
  {product.has_variants && !selectedVariant
    ? 'Selecciona una opcion'
    : cartState === 'loading'
      ? 'Agregando...'
      : cartState === 'done'
        ? 'Agregado al carrito'
        : 'Anadir al carrito'}
</button>
```

- [ ] **Step 6: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/ProductDetailPage.tsx
git commit -m "feat(product): variant-aware pricing, stock, images, and add-to-cart"
```

---

## Task 16: Update useCart Hook and Cart Display

**Files:**
- Modify: `src/hooks/useCart.ts`

- [ ] **Step 1: Update addToCart to send variantId**

Change the `addToCart` signature and body:

```typescript
const addToCart = useCallback(
  async (
    productOrId: any,
    variantId?: string,
    selectedColor?: string,
    selectedColorName?: string
  ) => {
    const productId = typeof productOrId === 'string' ? productOrId : productOrId?.id;
    if (!productId) throw new Error('Producto no valido');

    const opciones: Record<string, unknown> = {};
    if (selectedColor) opciones.color = selectedColor;
    if (selectedColorName) opciones.colorName = selectedColorName;

    const body: Record<string, unknown> = { productId, cantidad: 1, opciones };
    if (variantId) body.variantId = variantId;

    await apiClient.post('/cart', body);
    await loadCart();
  },
  [loadCart]
);
```

- [ ] **Step 2: Update cart item mapping to include variant data**

In the cart item mapping, add variant info:

```typescript
const mappedCart = cart.map((item: any) => ({
  id: item.id,
  productId: item.product_id,
  variantId: item.variant_id ?? undefined,
  name: item.product.nombre,
  price: item.variant?.precio ?? item.product.precio,
  image: (item.variant?.imagenes?.length > 0
    ? item.variant.imagenes[0]
    : item.product.imagenes?.[0]) || '',
  category: item.product.categories?.nombre ?? '',
  brand: item.product.marca ?? '',
  rating: 0,
  reviews: 0,
  description: item.product.descripcion ?? '',
  stock: item.variant?.stock ?? item.product.stock,
  quantity: item.cantidad,
  selectedColor: (item.opciones?.color as string) || undefined,
  selectedColorName: (item.opciones?.colorName as string) || undefined,
  variantAttributes: item.variant?.attributes ?? undefined,
}));
```

- [ ] **Step 3: Update ShoppingCartPage to show variant attributes**

In `src/components/ShoppingCartPage.tsx`, where cart items are rendered, add variant info below the product name:

```tsx
{/* After the product name display */}
{item.variantAttributes && (
  <p className="text-xs text-muted-foreground">
    {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}
  </p>
)}
```

- [ ] **Step 4: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/hooks/useCart.ts src/components/ShoppingCartPage.tsx
git commit -m "feat(cart): variant-aware cart with variantId, variant pricing, and attribute display"
```

---

## Task 17: Update onAddToCart Prop Chain

**Files:**
- Modify: `src/components/PageRouter.tsx` (or wherever onAddToCart is defined and passed down)

- [ ] **Step 1: Update the onAddToCart handler signature**

Find where `onAddToCart` is defined (likely in `PageRouter.tsx` or `App.tsx`) and update the signature to match the new useCart.addToCart:

```typescript
// Old:
const handleAddToCart = (product: Product, selectedColor?: string, selectedColorName?: string) => {
  addToCart(product, selectedColor, selectedColorName);
};

// New:
const handleAddToCart = (product: Product, variantId?: string, selectedColor?: string, selectedColorName?: string) => {
  addToCart(product, variantId, selectedColor, selectedColorName);
};
```

Update the prop type for `onAddToCart` in `ProductDetailPage` props interface:

```typescript
onAddToCart: (product: Product, variantId?: string, selectedColor?: string, selectedColorName?: string) => void;
```

- [ ] **Step 2: Commit**

```bash
cd /home/ubuntu/GenStore
git add src/components/PageRouter.tsx src/components/ProductDetailPage.tsx
git commit -m "feat: update onAddToCart prop chain to pass variantId through component tree"
```

---

## Task 18: Build and Verify

- [ ] **Step 1: Build the backend**

```bash
cd /home/ubuntu/GenStore/server && npm run build
```

Expected: Clean build with no TypeScript errors.

- [ ] **Step 2: Build the frontend**

```bash
cd /home/ubuntu/GenStore && npm run build
```

Expected: Clean build with no TypeScript errors.

- [ ] **Step 3: Fix any type errors**

Review and fix any TypeScript compilation errors found in steps 1 and 2. Common fixes:
- Add `variant_id` to CartItem interface
- Add `has_variants` and `variants` to Product type
- Update function signatures that changed

- [ ] **Step 4: Run existing tests**

```bash
cd /home/ubuntu/GenStore && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: Existing tests still pass (some cart tests may need mock updates for the new `variantId` parameter).

- [ ] **Step 5: Fix any broken tests**

Update mocked data in cart tests to account for the new optional `variantId` parameter and `variant` join field.

- [ ] **Step 6: Final commit**

```bash
cd /home/ubuntu/GenStore
git add -A
git commit -m "fix: resolve type errors and update tests for variant system"
```
