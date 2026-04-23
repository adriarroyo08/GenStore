import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import * as orderService from '../services/orderService.js';
import * as notificationService from '../services/notificationService.js';
import type { AppEnv } from '../middleware/auth.js';

const returns = new Hono<AppEnv>();
returns.use('*', authMiddleware);

returns.post('/', async (c) => {
  const user = c.get('user');
  const orderId = c.req.query('orderId');
  if (!orderId) return c.json({ error: 'orderId requerido' }, 400);

  const order = await orderService.getOrderById(user.id, orderId);
  if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
  if ((order as any).estado !== 'entregado') {
    return c.json({ error: 'Solo se pueden devolver pedidos entregados' }, 400);
  }

  const { data: existing } = await supabaseAdmin
    .from('return_requests')
    .select('id')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .not('estado', 'eq', 'rechazado')
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ error: 'Ya existe una solicitud de devolución para este pedido' }, 400);
  }

  const { motivo, descripcion, fotos } = await c.req.json();
  if (!motivo) return c.json({ error: 'Motivo requerido' }, 400);

  const { data: request, error } = await supabaseAdmin
    .from('return_requests')
    .insert({
      order_id: orderId,
      user_id: user.id,
      motivo,
      descripcion: descripcion || null,
      fotos: fotos || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  notificationService.create(
    user.id,
    'return_requested',
    'Solicitud de devolución recibida',
    `Tu solicitud de devolución para el pedido #${(order as any).numero_pedido} ha sido recibida`,
    { orderId, returnRequestId: request.id }
  ).catch(() => {});

  return c.json({ success: true, requestId: request.id }, 201);
});

returns.get('/', async (c) => {
  const user = c.get('user');
  const orderId = c.req.query('orderId');

  if (orderId) {
    const { data, error } = await supabaseAdmin
      .from('return_requests')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return c.json({ error: 'No encontrado' }, 404);
    return c.json(data);
  }

  const { data, error } = await supabaseAdmin
    .from('return_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return c.json({ success: true, returns: data ?? [] });
});

export default returns;
