-- 002_categories_products.sql

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  sku TEXT UNIQUE NOT NULL,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_original DECIMAL(10,2),
  en_oferta BOOLEAN NOT NULL DEFAULT false,
  porcentaje_descuento INT DEFAULT 0 CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100),
  marca TEXT,
  modelo TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT NOT NULL DEFAULT 5,
  imagenes TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_activo ON products(activo);

-- Full-text search index
ALTER TABLE products ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', COALESCE(nombre, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(descripcion, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

CREATE INDEX idx_products_fts ON products USING GIN(fts);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
