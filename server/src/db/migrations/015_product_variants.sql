-- Migration 015: Product Variants
-- Adds product_variants table, variant stock functions, and alters cart/order items.
-- Depends on: update_updated_at() function (defined in earlier migrations)

-- ============================================================
-- 1. Create product_variants table
-- ============================================================
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

-- ============================================================
-- 2. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- ============================================================
-- 3. Updated_at trigger (reuses existing update_updated_at() function)
-- ============================================================
CREATE TRIGGER set_variant_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. Add has_variants flag to products table
-- ============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- ============================================================
-- 5. Add variant_id to cart_items
-- ============================================================
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- ============================================================
-- 6. Add variant_id to order_items
-- ============================================================
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- ============================================================
-- 7. Atomic stock functions
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_variant_stock(vid UUID, qty INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock INTO current_stock FROM product_variants WHERE id = vid FOR UPDATE;
  IF current_stock IS NULL THEN RETURN false; END IF;
  IF current_stock < qty THEN RETURN false; END IF;
  UPDATE product_variants SET stock = stock - qty, updated_at = now() WHERE id = vid;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION increment_variant_stock(vid UUID, qty INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE product_variants SET stock = stock + qty, updated_at = now() WHERE id = vid;
END;
$$;

-- ============================================================
-- 8. Row Level Security
-- ============================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are publicly readable"
  ON product_variants
  FOR SELECT
  USING (true);

-- ============================================================
-- 9. Storage bucket (manual step)
-- NOTE: A dedicated storage bucket for variant images must be
-- created manually in Supabase Dashboard (or via the CLI):
--   supabase storage create variant-images --public
-- Set appropriate RLS policies on the bucket as needed.
-- ============================================================
