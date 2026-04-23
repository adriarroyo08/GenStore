-- 007_emails_invoices_shipping.sql
-- Phase 3: Email alerts, PDF invoicing, shipping integration

-- 1. Stock alert deduplication log
CREATE TABLE IF NOT EXISTS stock_alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, alert_date)
);

ALTER TABLE stock_alerts_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on stock_alerts_log"
  ON stock_alerts_log FOR ALL USING (auth.role() = 'service_role');

-- 2. Invoice sequential counter
CREATE TABLE IF NOT EXISTS invoice_counter (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on invoice_counter"
  ON invoice_counter FOR ALL USING (auth.role() = 'service_role');

-- 3. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) UNIQUE,
  numero_factura TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on invoices"
  ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = invoices.order_id AND orders.user_id = auth.uid())
  );

-- 4. Add NIF field to addresses
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS nif TEXT;

-- 5. Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) UNIQUE,
  carrier TEXT NOT NULL CHECK (carrier IN ('seur', 'correos_express', 'mrw')),
  tracking_number TEXT,
  label_url TEXT,
  estado TEXT NOT NULL DEFAULT 'preparando'
    CHECK (estado IN ('preparando', 'recogido', 'en_transito', 'en_reparto', 'entregado', 'incidencia')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on shipments"
  ON shipments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own shipments"
  ON shipments FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = shipments.order_id AND orders.user_id = auth.uid())
  );

-- 6. Shipment tracking events
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  estado TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on shipment_events"
  ON shipment_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own shipment events"
  ON shipment_events FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shipments JOIN orders ON orders.id = shipments.order_id
      WHERE shipments.id = shipment_events.shipment_id AND orders.user_id = auth.uid()
    )
  );

-- 7. Atomic invoice number increment function
CREATE OR REPLACE FUNCTION next_invoice_number(p_year INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO invoice_counter (year, last_number)
  VALUES (p_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = invoice_counter.last_number + 1
  RETURNING last_number INTO v_next;
  RETURN v_next;
END;
$$;

-- NOTE: Create Supabase Storage bucket manually:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
