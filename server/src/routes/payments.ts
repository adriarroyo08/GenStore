import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as paymentService from '../services/paymentService.js';
import * as paymentMethodService from '../services/paymentMethodService.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { AppEnv } from '../middleware/auth.js';

const payments = new Hono<AppEnv>();
payments.use('*', authMiddleware);

// POST /payments/create-intent
payments.post('/create-intent', async (c) => {
  const user = c.get('user');
  const {
    shippingAddressId,
    billingAddressId,
    paisImpuesto = 'ES',
    notas,
    saveCard = false,
    paymentMethodId,
    couponCode,
  } = await c.req.json();

  if (!shippingAddressId) {
    return c.json({ error: 'Dirección de envío requerida' }, 400);
  }

  const result = await paymentService.createPaymentIntent({
    userId: user.id,
    email: user.email,
    shippingAddressId,
    billingAddressId,
    paisImpuesto,
    notas,
    saveCard,
    paymentMethodId,
    couponCode,
  });

  return c.json(result);
});

// POST /payments/confirm — fallback to confirm payment when webhook doesn't arrive (dev/local)
payments.post('/confirm', async (c) => {
  const user = c.get('user');
  const { orderId } = await c.req.json();

  if (!orderId) return c.json({ error: 'orderId requerido' }, 400);

  // Verify order belongs to user and is still pending
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, estado, payment_intent_id')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error || !order) return c.json({ error: 'Pedido no encontrado' }, 404);
  if (order.estado !== 'pendiente') return c.json({ success: true, message: 'Ya procesado' });

  // Verify with Stripe that the payment actually succeeded
  if (!order.payment_intent_id) {
    return c.json({ error: 'Pedido sin pago asociado' }, 400);
  }

  const { stripe } = await import('../config/stripe.js');
  const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
  if (pi.status !== 'succeeded') {
    return c.json({ error: `Pago no completado (estado: ${pi.status})` }, 400);
  }

  // Run the same logic as the webhook handler (reuse retrieved PI)
  await paymentService.handlePaymentSuccess(pi);

  return c.json({ success: true });
});

// GET /payments/methods — list saved payment methods
payments.get('/methods', async (c) => {
  const user = c.get('user');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return c.json({ methods: [] });
  }

  const methods = await paymentMethodService.listPaymentMethods(profile.stripe_customer_id);
  return c.json({ methods });
});

// POST /payments/methods — save a new payment method
payments.post('/methods', async (c) => {
  const user = c.get('user');
  const { paymentMethodId } = await c.req.json();

  if (!paymentMethodId) {
    return c.json({ error: 'paymentMethodId requerido' }, 400);
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return c.json({ error: 'No hay cliente de Stripe asociado' }, 400);
  }

  const method = await paymentMethodService.attachPaymentMethod(
    profile.stripe_customer_id,
    paymentMethodId
  );

  return c.json(method, 201);
});

// POST /payments/setup-intent — create a SetupIntent for securely saving a card
payments.post('/setup-intent', async (c) => {
  const user = c.get('user');

  const customerId = await paymentService.getOrCreateStripeCustomer(user.id, user.email);

  const { stripe } = await import('../config/stripe.js');
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });

  return c.json({ clientSecret: setupIntent.client_secret });
});

// DELETE /payments/methods/:id — remove saved payment method
payments.delete('/methods/:id', async (c) => {
  const user = c.get('user');
  const methodId = c.req.param('id');

  // Verify the payment method belongs to this user's Stripe customer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return c.json({ error: 'No hay cliente de Stripe asociado' }, 400);
  }

  const { stripe } = await import('../config/stripe.js');
  const pm = await stripe.paymentMethods.retrieve(methodId);
  if (pm.customer !== profile.stripe_customer_id) {
    return c.json({ error: 'No autorizado' }, 403);
  }

  await paymentMethodService.detachPaymentMethod(methodId);
  return c.json({ message: 'Método de pago eliminado' });
});

export default payments;
