import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { AppEnv } from '../middleware/auth.js';

const reviews = new Hono<AppEnv>();

// GET /products/:productId/reviews — public
reviews.get('/:productId', async (c) => {
  const productId = c.req.param('productId');
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*, profile:profiles(nombre, apellidos)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return c.json(data);
});

// GET /can-review/:productId — check if user can review this product
reviews.get('/can-review/:productId', authMiddleware, async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');

  // Check if user already reviewed this product
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .limit(1);

  if (existingReview && existingReview.length > 0) {
    return c.json({ canReview: false, reason: 'already_reviewed' });
  }

  // Check if user has a delivered/paid order containing this product
  const { data: purchaseCheck } = await supabaseAdmin
    .from('order_items')
    .select('order_id, orders!inner(user_id, estado)')
    .eq('product_id', productId)
    .eq('orders.user_id', user.id)
    .in('orders.estado', ['entregado', 'pagado'])
    .limit(1);

  if (!purchaseCheck || purchaseCheck.length === 0) {
    return c.json({ canReview: false, reason: 'not_purchased' });
  }

  return c.json({ canReview: true, reason: 'eligible' });
});

// POST /products/:productId/reviews — authenticated, verified buyers only
reviews.post('/:productId', authMiddleware, async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  const { rating, titulo, comentario } = await c.req.json();

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating debe ser entre 1 y 5' }, 400);
  }

  // Check if user has purchased this product
  const { data: purchaseCheck } = await supabaseAdmin
    .from('order_items')
    .select('order_id, orders!inner(user_id, estado)')
    .eq('product_id', productId)
    .eq('orders.user_id', user.id)
    .in('orders.estado', ['pagado', 'enviado', 'entregado'])
    .limit(1);

  const verificada = (purchaseCheck?.length ?? 0) > 0;
  const orderId = verificada ? (purchaseCheck![0] as any).order_id : null;

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .upsert({
      user_id: user.id,
      product_id: productId,
      order_id: orderId,
      rating,
      titulo,
      comentario,
      verificada,
    }, { onConflict: 'user_id,product_id' })
    .select('*, profile:profiles(nombre, apellidos)')
    .single();

  if (error) throw new Error(error.message);
  return c.json(data, 201);
});

export default reviews;
