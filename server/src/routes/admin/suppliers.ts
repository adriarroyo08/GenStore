import { Hono } from 'hono';
import type { AppEnv } from '../../middleware/auth';
import * as supplierService from '../../services/supplierService.js';

const suppliers = new Hono<AppEnv>();

suppliers.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 15), 100);
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
  const { nombre, email, telefono, web, pais, condiciones_pago, plazo_envio_estimado, margen_defecto, notas, activo } = body;
  if (!nombre) return c.json({ error: 'nombre es requerido' }, 400);
  const safeBody: Record<string, unknown> = { nombre };
  if (email !== undefined) safeBody.email = email;
  if (telefono !== undefined) safeBody.telefono = telefono;
  if (web !== undefined) safeBody.web = web;
  if (pais !== undefined) safeBody.pais = pais;
  if (condiciones_pago !== undefined) safeBody.condiciones_pago = condiciones_pago;
  if (plazo_envio_estimado !== undefined) safeBody.plazo_envio_estimado = plazo_envio_estimado;
  if (margen_defecto !== undefined) safeBody.margen_defecto = margen_defecto;
  if (notas !== undefined) safeBody.notas = notas;
  if (activo !== undefined) safeBody.activo = activo;
  const supplier = await supplierService.createSupplier(safeBody as any);
  return c.json(supplier, 201);
});

suppliers.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { nombre, email, telefono, web, pais, condiciones_pago, plazo_envio_estimado, margen_defecto, notas, activo } = body;
  const safeBody: Record<string, unknown> = {};
  if (nombre !== undefined) safeBody.nombre = nombre;
  if (email !== undefined) safeBody.email = email;
  if (telefono !== undefined) safeBody.telefono = telefono;
  if (web !== undefined) safeBody.web = web;
  if (pais !== undefined) safeBody.pais = pais;
  if (condiciones_pago !== undefined) safeBody.condiciones_pago = condiciones_pago;
  if (plazo_envio_estimado !== undefined) safeBody.plazo_envio_estimado = plazo_envio_estimado;
  if (margen_defecto !== undefined) safeBody.margen_defecto = margen_defecto;
  if (notas !== undefined) safeBody.notas = notas;
  if (activo !== undefined) safeBody.activo = activo;
  const supplier = await supplierService.updateSupplier(id, safeBody as any);
  return c.json(supplier);
});

suppliers.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await supplierService.deleteSupplier(id);
  return c.json({ success: true });
});

export default suppliers;
