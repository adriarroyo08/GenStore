import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { stripe } from '../config/stripe.js';
import * as orderService from '../services/orderService.js';
import * as invoiceService from '../services/invoiceService.js';
import * as shippingService from '../services/shippingService.js';
import type { AppEnv } from '../middleware/auth.js';

const orders = new Hono<AppEnv>();
orders.use('*', authMiddleware);

orders.post('/', async (c) => {
  const user = c.get('user');
  const { shippingAddressId, billingAddressId, paisImpuesto = 'ES', notas } = await c.req.json();

  if (!shippingAddressId) return c.json({ error: 'Dirección de envío requerida' }, 400);

  const order = await orderService.createOrder({
    userId: user.id,
    shippingAddressId,
    billingAddressId,
    paisImpuesto,
    notas,
  });

  return c.json(order, 201);
});

orders.get('/', async (c) => {
  const user = c.get('user');
  const orderList = await orderService.getOrders(user.id);

  // Map DB fields (Spanish) to frontend fields (English)
  const statusMap: Record<string, string> = {
    pendiente: 'pending',
    pagado: 'confirmed',
    procesando: 'processing',
    enviado: 'shipped',
    entregado: 'delivered',
    cancelado: 'cancelled',
    fallido: 'cancelled',
    devuelto: 'cancelled',
  };

  const mapped = orderList.map((o: any) => ({
    id: o.id,
    numeroPedido: o.numero_pedido,
    status: statusMap[o.estado] || 'pending',
    orderDate: o.created_at,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
    impuestos: Number(o.impuestos),
    gastos_envio: Number(o.gastos_envio),
    itemCount: o.order_items?.length ?? 0,
    items: (o.order_items ?? []).map((item: any) => ({
      id: item.id,
      name: item.product?.nombre ?? 'Producto',
      quantity: item.cantidad,
      price: Number(item.precio_unitario),
      image: item.product?.imagenes?.[0] ?? '',
      slug: item.product?.slug ?? '',
    })),
  }));

  return c.json({ success: true, orders: mapped });
});

orders.get('/:id', async (c) => {
  const user = c.get('user');
  const order = await orderService.getOrderById(user.id, c.req.param('id'));
  if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);

  // Enrich with shipping address
  let shippingAddress = null;
  if ((order as any).shipping_address_id) {
    const { data: addr } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', (order as any).shipping_address_id)
      .single();
    if (addr) {
      shippingAddress = {
        name: addr.nombre,
        address: addr.calle,
        city: addr.ciudad,
        state: addr.provincia,
        zipCode: addr.codigo_postal,
        country: addr.pais,
      };
    }
  }

  return c.json({ ...order, shippingAddress });
});

// GET /orders/:id/tracking — shipment tracking for customer's own order
orders.get('/:id/tracking', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  // Verify order belongs to user
  const order = await orderService.getOrderById(user.id, orderId);
  if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);

  const shipment = await shippingService.getShipmentByOrderId(orderId);
  if (!shipment) return c.json({ error: 'Sin informacion de envio' }, 404);

  return c.json(shipment);
});

// GET /orders/:id/invoice — signed download URL for customer's own order
orders.get('/:id/invoice', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  // Verify order belongs to user
  const order = await orderService.getOrderById(user.id, orderId);
  if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);

  const url = await invoiceService.getInvoiceDownloadUrl(orderId);
  if (!url) return c.json({ error: 'Factura no disponible' }, 404);

  return c.json({ url });
});

orders.post('/:id/cancel', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');
  try {
    const result = await orderService.cancelOrder(user.id, orderId);
    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ error: err.message }, err.status || 500);
  }
});

orders.post('/:id/retry-payment', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  const order = await orderService.getOrderById(user.id, orderId);
  if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
  if ((order as any).estado !== 'pendiente') {
    return c.json({ error: 'Este pedido no está pendiente de pago' }, 400);
  }

  const raw = order as any;
  let clientSecret: string;
  let paymentIntentId: string;

  if (raw.payment_intent_id) {
    try {
      const existing = await stripe.paymentIntents.retrieve(raw.payment_intent_id);
      if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
        clientSecret = existing.client_secret!;
        paymentIntentId = existing.id;
        return c.json({ clientSecret, paymentIntentId });
      }
    } catch { /* Intent not found or invalid — create new one */ }
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(Number(raw.total) * 100),
    currency: 'eur',
    metadata: { orderId: raw.id, userId: user.id, numeroPedido: raw.numero_pedido },
  });

  await supabaseAdmin
    .from('orders')
    .update({ payment_intent_id: intent.id })
    .eq('id', orderId);

  return c.json({ clientSecret: intent.client_secret!, paymentIntentId: intent.id });
});

export default orders;
