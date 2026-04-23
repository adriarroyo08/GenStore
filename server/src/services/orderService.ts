import { supabaseAdmin } from '../config/supabase.js';
import { stripe } from '../config/stripe.js';
import { calculateVat } from './vatService.js';
import * as notificationService from './notificationService.js';
import * as emailService from './emailService.js';
import type { Order, OrderItem } from '../types/index.js';

interface CreateOrderInput {
  userId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paisImpuesto: string;
  notas?: string;
  metodoPago?: 'stripe';
}

const SHIPPING_FREE_THRESHOLD = 50;
const SHIPPING_COST = 9.99;

export async function createOrder(input: CreateOrderInput): Promise<Order & { items: OrderItem[] }> {
  const { userId, shippingAddressId, billingAddressId, paisImpuesto, notas, metodoPago } = input;

  // 1. Get cart items with product data
  const { data: cartItems, error: cartError } = await supabaseAdmin
    .from('cart_items')
    .select('*, product:products(id, nombre, precio, stock)')
    .eq('user_id', userId);

  if (cartError) throw new Error(cartError.message);
  if (!cartItems || cartItems.length === 0) {
    throw Object.assign(new Error('El carrito está vacío'), { status: 400 });
  }

  // 2. Verify stock for all items
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
    const price = (item as any).product.precio;
    return sum + price * item.cantidad;
  }, 0);

  const vat = calculateVat(subtotal, paisImpuesto);
  const gastosEnvio = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.round((vat.total + gastosEnvio) * 100) / 100;

  // 4. Create order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
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
      metodo_pago: metodoPago ?? null,
      notas,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // 5. Create order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    cantidad: item.cantidad,
    precio_unitario: (item as any).product.precio,
    subtotal: (item as any).product.precio * item.cantidad,
    opciones: item.opciones,
  }));

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) throw new Error(itemsError.message);

  // NOTE: Cart is NOT cleared here. It gets cleared in paymentService.handlePaymentSuccess()
  // after the payment webhook confirms the charge succeeded.

  return { ...order, items: items as OrderItem[] } as Order & { items: OrderItem[] };
}

export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, product:products(nombre, slug, imagenes))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export async function getOrderById(userId: string, orderId: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, product:products(nombre, slug, imagenes, sku))')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Order;
}

const CANCELLABLE_STATES = ['pendiente', 'pagado', 'procesando'];

export async function cancelOrder(userId: string, orderId: string): Promise<{ refunded: boolean; refundAmount?: number }> {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, product:products(nombre, stock))')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 });
  if (!CANCELLABLE_STATES.includes(order.estado)) {
    throw Object.assign(new Error('Este pedido no se puede cancelar en su estado actual'), { status: 400 });
  }

  let refunded = false;
  let refundAmount: number | undefined;
  if (order.payment_intent_id && order.estado !== 'pendiente') {
    try {
      const refund = await stripe.refunds.create({ payment_intent: order.payment_intent_id });
      refunded = true;
      refundAmount = refund.amount / 100;
    } catch (err) {
      console.error('Refund failed:', err);
    }
  }

  for (const item of order.order_items ?? []) {
    await supabaseAdmin.rpc('increment_stock', {
      p_product_id: item.product_id,
      p_amount: item.cantidad,
    });
  }

  await supabaseAdmin
    .from('orders')
    .update({ estado: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  const { data: profile } = await supabaseAdmin.from('profiles').select('nombre, email').eq('id', userId).single();
  notificationService.create(userId, 'order_cancelled', 'Pedido cancelado', `Tu pedido #${order.numero_pedido} ha sido cancelado`, { orderId }).catch(() => {});
  emailService.sendOrderCancelled({ order, customerName: profile?.nombre ?? '', customerEmail: profile?.email ?? '' }).catch(() => {});

  return { refunded, refundAmount };
}
