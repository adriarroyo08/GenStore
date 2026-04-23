import { Hono } from 'hono';
import * as shippingService from '../../services/shippingService.js';
import type { AppEnv } from '../../middleware/auth.js';

const adminShipping = new Hono<AppEnv>();

// GET /admin/shipping/carriers — list available carriers
adminShipping.get('/carriers', (c) => {
  const carriers = shippingService.getAvailableCarriers();
  return c.json({ carriers });
});

// POST /admin/shipping/orders/:id/ship — create shipment
adminShipping.post('/orders/:id/ship', async (c) => {
  const orderId = c.req.param('id');
  const { carrier } = await c.req.json<{ carrier: string }>();

  if (!carrier) return c.json({ error: 'Carrier requerido' }, 400);

  const shipment = await shippingService.createShipment(orderId, carrier);
  return c.json(shipment, 201);
});

// GET /admin/shipping/orders/:id/shipment — get shipment + events
adminShipping.get('/orders/:id/shipment', async (c) => {
  const orderId = c.req.param('id');
  const shipment = await shippingService.getShipmentByOrderId(orderId);
  if (!shipment) return c.json({ error: 'Envio no encontrado' }, 404);
  return c.json(shipment);
});

// GET /admin/shipping/labels/:id — download shipping label
adminShipping.get('/labels/:id', async (c) => {
  const shipmentId = c.req.param('id');
  const label = await shippingService.getLabel(shipmentId);
  c.header('Content-Type', 'application/pdf');
  c.header('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
  return c.body(new Uint8Array(label));
});

export default adminShipping;
