import { stripe } from '../config/stripe.js';
import { supabaseAdmin } from '../config/supabase.js';
import { calculateVat } from './vatService.js';
import { clearCart } from './cartService.js';
import * as emailService from './emailService.js';
import { sendNewOrderAdminAlert } from './emailService.js';
import * as stockAlertService from './stockAlertService.js';
import * as invoiceService from './invoiceService.js';
import * as couponService from './couponService.js';
import * as pointsService from './pointsService.js';
import * as businessSettingsService from './businessSettingsService.js';
import * as notificationService from './notificationService.js';
import type Stripe from 'stripe';

interface CreatePaymentIntentInput {
  userId: string;
  email: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paisImpuesto: string;
  notas?: string;
  saveCard: boolean;
  paymentMethodId?: string;
  couponCode?: string;
}

interface PaymentIntentResult {
  clientSecret: string;
  orderId: string;
  numeroPedido: string;
  orderData: {
    subtotal: number;
    descuento: number;
    subtotalAfterDiscount: number;
    impuestos: number;
    tipoIva: number;
    gastosEnvio: number;
    total: number;
  };
}

const SHIPPING_FREE_THRESHOLD = 50;
const SHIPPING_COST = 9.99;

/**
 * Get or create a Stripe Customer for the user.
 * Stores stripe_customer_id in profiles table.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Create a PaymentIntent + order in one atomic flow.
 * Returns the client secret for Stripe Elements to confirm on the frontend.
 */
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
  const { userId, email, shippingAddressId, billingAddressId, paisImpuesto, notas, saveCard, paymentMethodId, couponCode } = input;

  // 1. Get cart items with product data
  const { data: cartItems, error: cartError } = await supabaseAdmin
    .from('cart_items')
    .select('*, product:products(id, nombre, precio, stock)')
    .eq('user_id', userId);

  if (cartError) throw new Error(cartError.message);
  if (!cartItems || cartItems.length === 0) {
    throw Object.assign(new Error('El carrito está vacío'), { status: 400 });
  }

  // 2. Verify stock
  for (const item of cartItems) {
    const product = (item as any).product;
    if (!product || product.stock < item.cantidad) {
      throw Object.assign(
        new Error(`Stock insuficiente para ${product?.nombre ?? 'producto desconocido'}`),
        { status: 400 }
      );
    }
  }

  // 3. Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item as any).product.precio * item.cantidad;
  }, 0);

  // 3b. Validate and apply coupon discount
  let descuento = 0;
  let couponId: string | undefined;
  if (couponCode) {
    const couponResult = await couponService.validateCoupon(couponCode, userId, subtotal);
    if (!couponResult.valid) {
      throw Object.assign(new Error(couponResult.error || 'Cupón no válido'), { status: 400 });
    }
    descuento = couponResult.discount!;
    couponId = couponResult.couponId;
  }

  const subtotalAfterDiscount = Math.round((subtotal - descuento) * 100) / 100;
  const vat = calculateVat(subtotalAfterDiscount, paisImpuesto);
  const gastosEnvio = subtotalAfterDiscount >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.round((vat.total + gastosEnvio) * 100) / 100;
  const totalCents = Math.round(total * 100); // Stripe uses cents

  // 4. Get or create Stripe Customer
  const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);

  // 5. Create order (pendiente)
  const orderInsert: Record<string, unknown> = {
    user_id: userId,
    shipping_address_id: shippingAddressId,
    billing_address_id: billingAddressId ?? shippingAddressId,
    estado: 'pendiente',
    subtotal: Math.round(subtotal * 100) / 100,
    impuestos: vat.amount,
    gastos_envio: gastosEnvio,
    total,
    pais_impuesto: paisImpuesto,
    tipo_iva: vat.rate,
    metodo_pago: 'stripe',
    notas,
  };
  if (descuento > 0) orderInsert.descuento = descuento;
  if (couponId) orderInsert.coupon_id = couponId;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert(orderInsert)
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // 6. Create order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    cantidad: item.cantidad,
    precio_unitario: (item as any).product.precio,
    subtotal: (item as any).product.precio * item.cantidad,
    opciones: item.opciones,
  }));

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
  if (itemsError) throw new Error(itemsError.message);

  // 7. Create Stripe PaymentIntent
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: totalCents,
    currency: 'eur',
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      userId,
      numeroPedido: order.numero_pedido,
    },
  };

  if (saveCard) {
    piParams.setup_future_usage = 'off_session';
  }

  if (paymentMethodId) {
    piParams.payment_method = paymentMethodId;
  }

  const paymentIntent = await stripe.paymentIntents.create(piParams);

  // 8. Store payment_intent_id on the order
  const { error: piUpdateError } = await supabaseAdmin
    .from('orders')
    .update({ payment_intent_id: paymentIntent.id })
    .eq('id', order.id);
  if (piUpdateError) throw new Error(piUpdateError.message);

  return {
    clientSecret: paymentIntent.client_secret!,
    orderId: order.id,
    numeroPedido: order.numero_pedido,
    orderData: {
      subtotal: Math.round(subtotal * 100) / 100,
      descuento,
      subtotalAfterDiscount,
      impuestos: vat.amount,
      tipoIva: vat.rate,
      gastosEnvio,
      total,
    },
  };
}

/**
 * Called by webhook when payment_intent.succeeded.
 * Deducts stock, creates inventory movements, clears cart.
 */
export async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  // Idempotency: atomically claim this order (only succeeds if still pendiente)
  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ estado: 'pagado', payment_intent_id: paymentIntent.id })
    .eq('id', orderId)
    .eq('estado', 'pendiente')
    .select('id, user_id, estado')
    .single();

  if (updateError || !updatedOrder) return; // Already processed by another handler

  const order = updatedOrder;

  // 2. Get order items for stock deduction
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, cantidad')
    .eq('order_id', orderId);

  // 3. Deduct stock atomically + create inventory movements
  if (items) {
    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_amount: item.cantidad,
      });

      await supabaseAdmin.from('inventory_movements').insert({
        product_id: item.product_id,
        order_id: orderId,
        tipo: 'salida',
        cantidad: -item.cantidad,
        motivo: `Venta - Pedido ${paymentIntent.metadata.numeroPedido}`,
        created_by: order.user_id,
      });
    }
  }

  // 4. Award points (if enabled) and record coupon use
  try {
    const { data: fullOrderForPoints } = await supabaseAdmin
      .from('orders')
      .select('subtotal')
      .eq('id', orderId)
      .single();

    if (fullOrderForPoints) {
      // Only award points if the system is enabled
      const puntosEnabled = await businessSettingsService.getSetting<boolean>('puntos_enabled');
      if (puntosEnabled !== false) {
        await pointsService.awardPoints(order.user_id, orderId, Number(fullOrderForPoints.subtotal));
      }

      // Record coupon use if applicable — use raw SQL to avoid schema cache issues with coupon_id column
      try {
        const { data: couponRows } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        const orderCouponId = couponRows?.coupon_id;
        if (orderCouponId) {
          await couponService.applyCoupon(orderCouponId, order.user_id, orderId);
        }
      } catch {
        // coupon_id column might not be in schema cache, skip coupon recording
        console.warn('[Payment] Could not read coupon_id from order, skipping coupon recording');
      }
    }
  } catch (pointsError) {
    console.error('Error awarding points or recording coupon:', pointsError);
  }

  // 5. Clear cart
  await clearCart(order.user_id);

  // 6. Send payment confirmation email + stock alerts (non-blocking)
  try {
    const { data: fullOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*, product:products(nombre)')
      .eq('order_id', orderId);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', order.user_id)
      .single();

    // Get user email from auth
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

    if (fullOrder && orderItems && authUser?.email) {
      const customerName = profile ? `${profile.nombre} ${profile.apellidos}` : 'Cliente';

      await emailService.sendPaymentConfirmation({
        order: fullOrder,
        items: orderItems,
        customerName,
        customerEmail: authUser.email,
      });
    }

    // Generate invoice + send invoice email
    if (fullOrder && authUser?.email) {
      const customerName = profile ? `${profile.nombre} ${profile.apellidos}` : 'Cliente';
      const result = await invoiceService.generateInvoice(orderId);
      const invoiceUrl = await invoiceService.getInvoiceDownloadUrl(orderId);
      if (invoiceUrl) {
        await emailService.sendInvoiceReady({
          order: fullOrder,
          customerName,
          customerEmail: authUser.email,
          invoiceUrl,
          numeroFactura: result.numeroFactura,
        });
      }
    }

    // Check stock alerts for each product
    if (items) {
      for (const item of items) {
        await stockAlertService.checkAndAlertImmediate(item.product_id);
      }
    }
    // In-app notification
    const numeroPedido = paymentIntent.metadata.numeroPedido;
    notificationService.create(
      order.user_id,
      'payment_confirmed',
      'Pago confirmado',
      `Tu pago para el pedido #${numeroPedido} ha sido confirmado`,
      { orderId }
    ).catch(() => {});
  } catch (emailError) {
    console.error('Error sending payment emails/stock alerts:', emailError);
  }

  // 7. Send admin alert for new order (non-blocking)
  try {
    const { data: fullOrderForAlert } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    const { data: alertItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        cantidad, precio_unitario, product_id,
        product:products!left(nombre, precio_coste, supplier_sku, suppliers!left(nombre))
      `)
      .eq('order_id', orderId);

    const { data: shippingAddr } = fullOrderForAlert?.shipping_address_id
      ? await supabaseAdmin
          .from('addresses')
          .select('*')
          .eq('id', fullOrderForAlert.shipping_address_id)
          .single()
      : { data: null };

    const alertItemsMapped = (alertItems ?? []).map((item: any) => ({
      nombre: item.product?.nombre ?? 'Producto',
      cantidad: item.cantidad,
      precio: item.precio_unitario,
      supplierName: item.product?.suppliers?.nombre ?? null,
      supplierSku: item.product?.supplier_sku ?? null,
    }));

    const totalCost = (alertItems ?? []).reduce((sum: number, item: any) => {
      const cost = item.product?.precio_coste ?? 0;
      return sum + cost * item.cantidad;
    }, 0);

    const addressStr = shippingAddr
      ? `${shippingAddr.nombre}\n${shippingAddr.calle}\n${shippingAddr.codigo_postal} ${shippingAddr.ciudad}\n${shippingAddr.pais}`
      : 'No disponible';

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

    await sendNewOrderAdminAlert({
      numeroPedido: fullOrderForAlert?.numero_pedido ?? paymentIntent.metadata.numeroPedido,
      customerName: shippingAddr?.nombre ?? 'Cliente',
      customerEmail: user?.email ?? '',
      shippingAddress: addressStr,
      items: alertItemsMapped,
      total: fullOrderForAlert?.total ?? 0,
      estimatedProfit: (fullOrderForAlert?.total ?? 0) - totalCost - (fullOrderForAlert?.gastos_envio ?? 0),
      orderAdminUrl: `/admin/orders/${orderId}`,
    });
  } catch (alertErr) {
    console.error('[Admin Alert] Error sending new order alert:', alertErr);
  }
}

/**
 * Called by webhook when payment_intent.payment_failed.
 */
export async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('estado')
    .eq('id', orderId)
    .single();

  if (!order || order.estado !== 'pendiente') return;

  await supabaseAdmin
    .from('orders')
    .update({ estado: 'fallido' })
    .eq('id', orderId);
}

/**
 * Initiate a refund via Stripe.
 */
export async function createRefund(
  orderId: string,
  amount: number | null,
  motivo: string,
  adminId: string
): Promise<{ refundId: string }> {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, payment_intent_id, total, estado')
    .eq('id', orderId)
    .single();

  if (error || !order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 });
  if (!order.payment_intent_id) throw Object.assign(new Error('Este pedido no tiene un pago asociado'), { status: 400 });
  if (!['pagado', 'enviado', 'entregado'].includes(order.estado)) {
    throw Object.assign(new Error('Solo se pueden reembolsar pedidos pagados, enviados o entregados'), { status: 400 });
  }

  const refundAmount = amount ?? order.total;
  const refundAmountCents = Math.round(refundAmount * 100);

  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.payment_intent_id,
    amount: refundAmountCents,
  });

  const { data: refund, error: refundError } = await supabaseAdmin
    .from('refunds')
    .insert({
      order_id: orderId,
      provider_refund_id: stripeRefund.id,
      amount: refundAmount,
      motivo,
      estado: stripeRefund.status === 'succeeded' ? 'completado' : 'pendiente',
      created_by: adminId,
    })
    .select()
    .single();

  if (refundError) throw new Error(refundError.message);

  // If refund is immediate and full, update order status
  if (stripeRefund.status === 'succeeded' && refundAmount >= order.total) {
    await supabaseAdmin.from('orders').update({ estado: 'devuelto' }).eq('id', orderId);
  }

  return { refundId: refund.id };
}

/**
 * Called by webhook when charge.refunded.
 */
export async function handleRefundCompleted(charge: Stripe.Charge): Promise<void> {
  const refunds = charge.refunds?.data ?? [];
  for (const refund of refunds) {
    // Update refund record
    await supabaseAdmin
      .from('refunds')
      .update({ estado: 'completado' })
      .eq('provider_refund_id', refund.id);
  }

  // Check if order should be marked as devuelto
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (paymentIntentId) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, total')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (order) {
      const { data: refundRecords } = await supabaseAdmin
        .from('refunds')
        .select('amount')
        .eq('order_id', order.id)
        .eq('estado', 'completado');

      const totalRefunded = (refundRecords ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
      if (totalRefunded >= order.total) {
        await supabaseAdmin.from('orders').update({ estado: 'devuelto' }).eq('id', order.id);
      }
    }
  }
}
