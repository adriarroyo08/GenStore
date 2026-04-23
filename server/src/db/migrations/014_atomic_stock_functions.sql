-- Atomic stock decrement (prevents race conditions)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - p_amount) WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic stock increment (for order cancellation)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock + p_amount WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
