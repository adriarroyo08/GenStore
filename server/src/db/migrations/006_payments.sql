-- 006_payments.sql
-- Phase 2: Payment infrastructure

-- 1. Add stripe_customer_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. Add 'fallido' state to orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_estado_check;
ALTER TABLE orders ADD CONSTRAINT orders_estado_check
  CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado', 'devuelto', 'fallido'));

-- 3. Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider_refund_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage refunds"
  ON refunds FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
