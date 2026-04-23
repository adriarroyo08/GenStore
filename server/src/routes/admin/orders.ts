import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';
import * as paymentService from '../../services/paymentService.js';
import * as invoiceService from '../../services/invoiceService.js';
import type { AppEnv } from '../../middleware/auth.js';

const adminOrders = new Hono<AppEnv>();

adminOrders.get('/', async (c) => {
  const estado = c.req.query('estado');
  const page = Number(c.req.query('page') ?? 1);
  const pageSize = Number(c.req.query('pageSize') ?? 50);
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (estado) query = query.eq('estado', estado);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return c.json({ orders: data, total: count ?? 0, page, pageSize });
});

adminOrders.get('/:id', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, product:products(nombre, sku, imagenes, precio_coste, supplier_sku, suppliers!left(id, nombre, email, web, telefono))), shipping:addresses!shipping_address_id(*), billing:addresses!billing_address_id(*)')
    .eq('id', c.req.param('id'))
    .single();

  if (error) throw new Error(error.message);

  const enrichedItems = (data.order_items ?? []).map((item: any) => ({
    ...item,
    precio_coste: item.product?.precio_coste ?? null,
    supplier_sku: item.product?.supplier_sku ?? null,
    supplier: item.product?.suppliers ?? null,
    product: item.product
      ? { nombre: item.product.nombre, sku: item.product.sku, imagenes: item.product.imagenes }
      : item.product,
  }));

  return c.json({ ...data, items: enrichedItems, order_items: undefined });
});

adminOrders.put('/:id/status', async (c) => {
  const { estado } = await c.req.json();
  const validStates = ['pendiente', 'confirmado', 'procesando', 'pagado', 'enviado', 'entregado', 'cancelado', 'devuelto', 'fallido'];
  if (!validStates.includes(estado)) {
    return c.json({ error: `Estado inválido. Valores: ${validStates.join(', ')}` }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ estado })
    .eq('id', c.req.param('id'))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data);
});

// POST /admin/orders/:id/refund
adminOrders.post('/:id/refund', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');
  const { amount, motivo } = await c.req.json();

  if (!motivo || !motivo.trim()) {
    return c.json({ error: 'El motivo del reembolso es obligatorio' }, 400);
  }

  const result = await paymentService.createRefund(orderId, amount ?? null, motivo.trim(), user.id);
  return c.json(result);
});

// GET /admin/orders/:id/refunds
adminOrders.get('/:id/refunds', async (c) => {
  const orderId = c.req.param('id');

  const { data, error } = await supabaseAdmin
    .from('refunds')
    .select('*, admin:profiles!created_by(nombre, apellidos)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return c.json({ refunds: data ?? [] });
});

// GET /admin/orders/:id/invoice — signed download URL
adminOrders.get('/:id/invoice', async (c) => {
  const orderId = c.req.param('id');
  const url = await invoiceService.getInvoiceDownloadUrl(orderId);
  if (!url) return c.json({ error: 'Factura no disponible' }, 404);
  return c.json({ url });
});

export default adminOrders;
