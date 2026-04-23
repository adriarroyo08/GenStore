-- 013_dropshipping_fields.sql
-- Add dropshipping-oriented fields to products

ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'ES';
ALTER TABLE products ADD COLUMN IF NOT EXISTS peso_gramos INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS largo_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ancho_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS alto_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tiempo_envio_min INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tiempo_envio_max INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notas_internas TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
