-- 005_rls_policies.sql
-- Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles: users see own, admins see all
CREATE POLICY profiles_select ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- addresses: users see own
CREATE POLICY addresses_all ON addresses FOR ALL USING (user_id = auth.uid());

-- categories: everyone reads active, admins manage
CREATE POLICY categories_select ON categories FOR SELECT USING (activo = true OR is_admin());
CREATE POLICY categories_insert ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY categories_update ON categories FOR UPDATE USING (is_admin());
CREATE POLICY categories_delete ON categories FOR DELETE USING (is_admin());

-- products: everyone reads active, admins manage
CREATE POLICY products_select ON products FOR SELECT USING (activo = true OR is_admin());
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY products_update ON products FOR UPDATE USING (is_admin());
CREATE POLICY products_delete ON products FOR DELETE USING (is_admin());

-- orders: users see own, admins see all
CREATE POLICY orders_select ON orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_update ON orders FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- order_items: via order ownership
CREATE POLICY order_items_select ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin())));
CREATE POLICY order_items_insert ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- inventory_movements: admins only
CREATE POLICY inventory_select ON inventory_movements FOR SELECT USING (is_admin());
CREATE POLICY inventory_insert ON inventory_movements FOR INSERT WITH CHECK (is_admin());

-- cart_items: users own
CREATE POLICY cart_all ON cart_items FOR ALL USING (user_id = auth.uid());

-- wishlist_items: users own
CREATE POLICY wishlist_all ON wishlist_items FOR ALL USING (user_id = auth.uid());

-- reviews: everyone reads, users create own
CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reviews_update ON reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY reviews_delete ON reviews FOR DELETE USING (user_id = auth.uid() OR is_admin());
