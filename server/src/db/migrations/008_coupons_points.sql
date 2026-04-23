-- 008_coupons_points.sql

-- ═══════════════════════════════════════════
-- COUPONS / DISCOUNT CODES
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),  -- percentage or fixed amount
  valor DECIMAL(10,2) NOT NULL,  -- percentage (0-100) or fixed EUR amount
  min_purchase DECIMAL(10,2) DEFAULT 0,  -- minimum order subtotal
  max_discount DECIMAL(10,2),  -- max discount for percentage coupons
  max_uses INT,  -- total uses allowed (NULL = unlimited)
  uses_count INT NOT NULL DEFAULT 0,
  max_uses_per_user INT DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);

CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

-- Add discount fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS descuento DECIMAL(10,2) NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════
-- POINTS / REWARDS SYSTEM
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  current_points INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  lifetime_redeemed INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
  amount INT NOT NULL,  -- positive for earned, negative for redeemed
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_tx_user ON points_transactions(user_id);
CREATE INDEX idx_points_tx_order ON points_transactions(order_id);

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('discount', 'product', 'shipping', 'exclusive')),
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,  -- discount value in EUR
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Coupons: anyone can read active, only service_role writes
CREATE POLICY coupons_select ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY coupon_uses_select ON coupon_uses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY coupon_uses_insert ON coupon_uses FOR INSERT WITH CHECK (user_id = auth.uid());

-- Points: users see their own
CREATE POLICY user_points_select ON user_points FOR SELECT USING (user_id = auth.uid());
CREATE POLICY points_tx_select ON points_transactions FOR SELECT USING (user_id = auth.uid());

-- Rewards: anyone can read active
CREATE POLICY rewards_select ON rewards FOR SELECT USING (is_active = true);

-- Insert some sample rewards
INSERT INTO rewards (name, description, points_cost, category, valor) VALUES
  ('5€ de descuento', 'Cupón de 5€ para tu próxima compra', 500, 'discount', 5),
  ('10€ de descuento', 'Cupón de 10€ para tu próxima compra', 900, 'discount', 10),
  ('Envío gratis', 'Envío gratuito en tu próximo pedido', 300, 'shipping', 9.99),
  ('25€ de descuento', 'Cupón de 25€ para compras superiores a 100€', 2000, 'discount', 25)
ON CONFLICT DO NOTHING;
