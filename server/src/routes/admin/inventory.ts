import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';
import * as inventoryService from '../../services/inventoryService.js';
import type { AppEnv } from '../../middleware/auth.js';

const adminInventory = new Hono<AppEnv>();

// GET /admin/inventory/alerts — low stock products
adminInventory.get('/alerts', async (c) => {
  const alerts = await inventoryService.getLowStockAlerts();
  return c.json({ alerts });
});

// POST /admin/inventory/import — import CSV
adminInventory.post('/import', async (c) => {
  const user = c.get('user');
  const contentType = c.req.header('content-type') ?? '';

  let csvContent: string;
  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return c.json({ error: 'Archivo CSV requerido' }, 400);
    csvContent = await file.text();
  } else {
    csvContent = await c.req.text();
  }

  const result = await inventoryService.importCsv(csvContent, user.id);
  return c.json(result);
});

// GET /admin/inventory/export — export CSV
adminInventory.get('/export', async (c) => {
  const filter = c.req.query('filter') ?? 'all';
  const csv = await inventoryService.exportCsv(filter);
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="productos-${filter}.csv"` },
  });
});

// POST /admin/inventory/adjust — manual stock adjustment
adminInventory.post('/adjust', async (c) => {
  const user = c.get('user');
  const { productId, cantidad, motivo } = await c.req.json();

  if (!productId || cantidad === undefined || !motivo) {
    return c.json({ error: 'productId, cantidad y motivo son requeridos' }, 400);
  }

  await inventoryService.adjustStock(productId, cantidad, motivo, user.id);
  return c.json({ message: 'Stock ajustado' });
});

// GET /admin/inventory/movements — inventory history
adminInventory.get('/movements', async (c) => {
  const productId = c.req.query('productId');
  const page = Number(c.req.query('page') ?? 1);
  const pageSize = Number(c.req.query('pageSize') ?? 50);
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('inventory_movements')
    .select('*, product:products(nombre, sku)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (productId) query = query.eq('product_id', productId);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return c.json({ movements: data, total: count ?? 0, page, pageSize });
});

// GET /admin/dashboard — stats
adminInventory.get('/dashboard', async (c) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [salesResult, activeOrdersResult, lowStockAlerts, usersResult, recentOrdersResult] = await Promise.all([
    supabaseAdmin.from('orders').select('total').gte('created_at', firstOfMonth).in('estado', ['pagado', 'enviado', 'entregado']),
    supabaseAdmin.from('orders').select('id', { count: 'exact' }).in('estado', ['pendiente', 'pagado', 'enviado']),
    inventoryService.getLowStockAlerts(),
    supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
    supabaseAdmin.from('orders').select('id, numero_pedido, estado, total, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const ventasMes = (salesResult.data ?? []).reduce((sum: number, o: any) => sum + Number(o.total), 0);

  return c.json({
    ventasMes: Math.round(ventasMes * 100) / 100,
    pedidosActivos: activeOrdersResult.count ?? 0,
    stockBajo: lowStockAlerts.length,
    usuariosActivos: usersResult.count ?? 0,
    pedidosRecientes: recentOrdersResult.data ?? [],
    alertasStock: lowStockAlerts.slice(0, 10),
  });
});

export default adminInventory;
