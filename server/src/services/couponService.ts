import { supabaseAdmin } from '../config/supabase.js';

interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  tipo?: 'porcentaje' | 'fijo';
  valor?: number;
  maxDiscount?: number;
  discount?: number;
  error?: string;
}

/**
 * Validate a coupon code for a given user and subtotal.
 * Returns the discount amount if valid.
 */
export async function validateCoupon(
  code: string,
  userId: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const normalizedCode = code.trim().toUpperCase();

  // 1. Find the coupon
  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: 'Cupón no encontrado o inactivo' };
  }

  // 2. Check dates
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: 'Este cupón aún no está activo' };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, error: 'Este cupón ha expirado' };
  }

  // 3. Check total uses
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return { valid: false, error: 'Este cupón ha alcanzado el límite de usos' };
  }

  // 4. Check per-user uses
  if (coupon.max_uses_per_user) {
    const { count } = await supabaseAdmin
      .from('coupon_uses')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);

    if ((count ?? 0) >= coupon.max_uses_per_user) {
      return { valid: false, error: 'Ya has usado este cupón el máximo de veces permitido' };
    }
  }

  // 5. Check minimum purchase
  if (coupon.min_purchase && subtotal < Number(coupon.min_purchase)) {
    return {
      valid: false,
      error: `Compra mínima de ${Number(coupon.min_purchase).toFixed(2)}€ requerida`,
    };
  }

  // 6. Calculate discount
  let discount: number;
  if (coupon.tipo === 'porcentaje') {
    discount = Math.round(subtotal * (Number(coupon.valor) / 100) * 100) / 100;
    if (coupon.max_discount) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    discount = Math.min(Number(coupon.valor), subtotal);
  }

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    tipo: coupon.tipo,
    valor: Number(coupon.valor),
    maxDiscount: coupon.max_discount ? Number(coupon.max_discount) : undefined,
    discount: Math.round(discount * 100) / 100,
  };
}

/**
 * Record a coupon use after successful payment.
 */
export async function applyCoupon(
  couponId: string,
  userId: string,
  orderId: string
): Promise<void> {
  // Insert usage record
  await supabaseAdmin.from('coupon_uses').insert({
    coupon_id: couponId,
    user_id: userId,
    order_id: orderId,
  });

  // Increment uses_count
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('uses_count')
    .eq('id', couponId)
    .single();

  if (coupon) {
    await supabaseAdmin
      .from('coupons')
      .update({ uses_count: coupon.uses_count + 1 })
      .eq('id', couponId);
  }
}
