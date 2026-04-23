import { supabaseAdmin } from '../config/supabase.js';

/**
 * Progressive points calculation.
 * Higher purchase amounts earn proportionally more points per euro.
 *
 *   0 - 25€   → 1 punto/€
 *  25 - 50€   → 1.5 puntos/€
 *  50 - 100€  → 2 puntos/€
 * 100 - 200€  → 2.5 puntos/€
 * 200€+       → 3 puntos/€
 */
export function calculatePoints(amount: number): number {
  if (amount <= 0) return 0;

  let points = 0;
  const tiers = [
    { limit: 25, rate: 1 },
    { limit: 50, rate: 1.5 },
    { limit: 100, rate: 2 },
    { limit: 200, rate: 2.5 },
    { limit: Infinity, rate: 3 },
  ];

  let remaining = amount;
  let prevLimit = 0;

  for (const tier of tiers) {
    const sliceSize = Math.min(remaining, tier.limit - prevLimit);
    if (sliceSize <= 0) break;
    points += sliceSize * tier.rate;
    remaining -= sliceSize;
    prevLimit = tier.limit;
  }

  return Math.floor(points);
}

/**
 * Get user points summary + recent transactions.
 */
export async function getUserPoints(userId: string) {
  // Get or create user_points row
  let { data: userPoints } = await supabaseAdmin
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!userPoints) {
    const { data: created } = await supabaseAdmin
      .from('user_points')
      .insert({ user_id: userId, current_points: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
      .select()
      .single();
    userPoints = created;
  }

  // Get recent transactions
  const { data: transactions } = await supabaseAdmin
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    currentPoints: userPoints?.current_points ?? 0,
    lifetimeEarned: userPoints?.lifetime_earned ?? 0,
    lifetimeRedeemed: userPoints?.lifetime_redeemed ?? 0,
    transactions: (transactions ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      orderId: t.order_id,
      createdAt: t.created_at,
    })),
  };
}

/**
 * Award points to a user after a purchase.
 */
export async function awardPoints(
  userId: string,
  orderId: string,
  purchaseAmount: number
): Promise<number> {
  const points = calculatePoints(purchaseAmount);
  if (points <= 0) return 0;

  // Insert transaction
  await supabaseAdmin.from('points_transactions').insert({
    user_id: userId,
    type: 'earned',
    amount: points,
    description: `Compra de ${purchaseAmount.toFixed(2)}€`,
    order_id: orderId,
  });

  // Upsert user_points
  const { data: existing } = await supabaseAdmin
    .from('user_points')
    .select('current_points, lifetime_earned')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('user_points')
      .update({
        current_points: existing.current_points + points,
        lifetime_earned: existing.lifetime_earned + points,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await supabaseAdmin.from('user_points').insert({
      user_id: userId,
      current_points: points,
      lifetime_earned: points,
      lifetime_redeemed: 0,
    });
  }

  return points;
}

/**
 * Get all active rewards.
 */
export async function getRewards() {
  const { data } = await supabaseAdmin
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pointsCost: r.points_cost,
    category: r.category,
    value: Number(r.valor),
    isActive: r.is_active,
    stock: r.stock,
  }));
}

/**
 * Redeem a reward. Creates a coupon for discount rewards.
 */
export async function redeemReward(userId: string, rewardId: string): Promise<{ couponCode?: string }> {
  // Get reward
  const { data: reward, error } = await supabaseAdmin
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single();

  if (error || !reward) {
    throw Object.assign(new Error('Recompensa no encontrada'), { status: 404 });
  }

  // Check stock
  if (reward.stock !== null && reward.stock <= 0) {
    throw Object.assign(new Error('Recompensa agotada'), { status: 400 });
  }

  // Check user has enough points
  const { data: userPoints } = await supabaseAdmin
    .from('user_points')
    .select('current_points')
    .eq('user_id', userId)
    .single();

  if (!userPoints || userPoints.current_points < reward.points_cost) {
    throw Object.assign(new Error('No tienes suficientes puntos'), { status: 400 });
  }

  // Deduct points
  await supabaseAdmin
    .from('user_points')
    .update({
      current_points: userPoints.current_points - reward.points_cost,
      lifetime_redeemed: (userPoints as any).lifetime_redeemed + reward.points_cost,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Record transaction
  await supabaseAdmin.from('points_transactions').insert({
    user_id: userId,
    type: 'redeemed',
    amount: -reward.points_cost,
    description: `Canjeo: ${reward.name}`,
  });

  // Reduce stock if applicable
  if (reward.stock !== null) {
    await supabaseAdmin
      .from('rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', rewardId);
  }

  // For discount/shipping rewards, create a personal coupon
  let couponCode: string | undefined;
  if (reward.category === 'discount' || reward.category === 'shipping') {
    couponCode = `REWARD-${Date.now().toString(36).toUpperCase()}`;
    await supabaseAdmin.from('coupons').insert({
      code: couponCode,
      description: `Recompensa: ${reward.name}`,
      tipo: 'fijo',
      valor: Number(reward.valor),
      max_uses: 1,
      max_uses_per_user: 1,
      is_active: true,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    });
  }

  return { couponCode };
}
