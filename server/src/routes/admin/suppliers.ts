import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth';
import * as supplierService from '../../services/supplierService.js';

const suppliers = new Hono<AppEnv>();

suppliers.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 15);
  const search = c.req.query('search') || undefined;
  const activeParam = c.req.query('active');
  const active = activeParam !== undefined ? activeParam === 'true' : undefined;

  const result = await supplierService.getSuppliers({ page, limit, search, active });
  return c.json(result);
});

suppliers.get('/:id', async (c) => {
  const id = c.req.param('id');
  const supplier = await supplierService.getSupplierById(id);
  const productCount = await supplierService.getSupplierProductCount(id);
  return c.json({ ...supplier, product_count: productCount });
});

suppliers.post('/', async (c) => {
  const body = await c.req.json();
  const supplier = await supplierService.createSupplier(body);
  return c.json(supplier, 201);
});

suppliers.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supplier = await supplierService.updateSupplier(id, body);
  return c.json(supplier);
});

suppliers.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await supplierService.deleteSupplier(id);
  return c.json({ success: true });
});

export default suppliers;
