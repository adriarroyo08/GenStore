import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import * as emailService from './emailService.js';
import * as notificationService from './notificationService.js';
import type { Order, Address, Shipment, ShipmentEvent } from '../types/index.js';

// ── Carrier interface ──

export interface ShippingCarrier {
  createShipment(order: Order, address: Address): Promise<{
    trackingNumber: string;
    labelUrl?: string;
  }>;
  getTracking(trackingNumber: string): Promise<Array<{
    estado: string;
    descripcion: string | null;
    ubicacion: string | null;
    occurred_at: string;
  }>>;
  getLabel(trackingNumber: string): Promise<Buffer>;
}

// ── Carrier registry ──

type CarrierFactory = () => Promise<ShippingCarrier>;
const carrierFactories = new Map<string, CarrierFactory>();

export function registerCarrier(name: string, factory: CarrierFactory): void {
  carrierFactories.set(name, factory);
}

async function getCarrier(name: string): Promise<ShippingCarrier> {
  const factory = carrierFactories.get(name);
  if (!factory) throw new Error(`Carrier ${name} not registered`);
  return factory();
}

// ── Available carriers (based on env config) ──

export function getAvailableCarriers(): string[] {
  const available: string[] = [];

  if (env.SEUR_USER && env.SEUR_PASSWORD) available.push('seur');
  if (env.CORREOS_EXPRESS_USER && env.CORREOS_EXPRESS_PASSWORD) available.push('correos_express');
  if (env.MRW_USER && env.MRW_PASSWORD) available.push('mrw');

  return available;
}

// ── Create shipment ──

export async function createShipment(orderId: string, carrier: string): Promise<Shipment> {
  const available = getAvailableCarriers();
  if (!available.includes(carrier)) {
    throw Object.assign(new Error(`Carrier ${carrier} no configurado`), { status: 400 });
  }

  // Check no existing shipment
  const { data: existing } = await supabaseAdmin
    .from('shipments')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (existing) {
    throw Object.assign(new Error('Este pedido ya tiene un envio'), { status: 400 });
  }

  // Fetch order + address
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error('Pedido no encontrado');

  const { data: address } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', order.shipping_address_id)
    .single();

  if (!address) throw new Error('Direccion de envio no encontrada');

  // Call carrier API
  const carrierImpl = await getCarrier(carrier);
  const result = await carrierImpl.createShipment(order, address);

  // Store shipment
  const { data: shipment, error: shipmentError } = await supabaseAdmin
    .from('shipments')
    .insert({
      order_id: orderId,
      carrier,
      tracking_number: result.trackingNumber,
      label_url: result.labelUrl ?? null,
      estado: 'preparando',
    })
    .select()
    .single();

  if (shipmentError) throw new Error(shipmentError.message);

  // Update order status to 'enviado'
  await supabaseAdmin
    .from('orders')
    .update({ estado: 'enviado' })
    .eq('id', orderId);

  // Send shipping email (non-blocking)
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', order.user_id)
      .single();

    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

    if (profile && authUser?.email) {
      await emailService.sendOrderShipped({
        order,
        customerName: `${profile.nombre} ${profile.apellidos}`,
        customerEmail: authUser.email,
        carrier: carrier.toUpperCase(),
        trackingNumber: result.trackingNumber,
      });
    }
    notificationService.create(
      order.user_id,
      'order_shipped',
      'Pedido enviado',
      `Tu pedido #${order.numero_pedido} ha sido enviado con ${carrier.toUpperCase()}`,
      { orderId, trackingNumber: result.trackingNumber, carrier }
    ).catch(() => {});
  } catch (e) {
    console.error('Error sending shipping email:', e);
  }

  return shipment;
}

// ── Sync tracking for a single shipment ──

export async function syncTracking(shipmentId: string): Promise<ShipmentEvent[]> {
  const { data: shipment } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (!shipment || !shipment.tracking_number) return [];

  const carrierImpl = await getCarrier(shipment.carrier);
  const events = await carrierImpl.getTracking(shipment.tracking_number);

  // Get existing events to avoid duplicates
  const { data: existingEvents } = await supabaseAdmin
    .from('shipment_events')
    .select('occurred_at, estado')
    .eq('shipment_id', shipmentId);

  const existingSet = new Set(
    (existingEvents ?? []).map((e) => `${e.occurred_at}|${e.estado}`)
  );

  const newEvents = events.filter(
    (e) => !existingSet.has(`${e.occurred_at}|${e.estado}`)
  );

  if (newEvents.length > 0) {
    await supabaseAdmin.from('shipment_events').insert(
      newEvents.map((e) => ({
        shipment_id: shipmentId,
        estado: e.estado,
        descripcion: e.descripcion,
        ubicacion: e.ubicacion,
        occurred_at: e.occurred_at,
      }))
    );
  }

  // Update shipment estado based on latest event
  const latestEvent = events[events.length - 1];
  if (latestEvent && latestEvent.estado !== shipment.estado) {
    await supabaseAdmin
      .from('shipments')
      .update({ estado: latestEvent.estado, updated_at: new Date().toISOString() })
      .eq('id', shipmentId);

    // If delivered, update order + send email
    if (latestEvent.estado === 'entregado') {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', shipment.order_id)
        .single();

      if (order) {
        await supabaseAdmin
          .from('orders')
          .update({ estado: 'entregado' })
          .eq('id', order.id);

        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('nombre, apellidos')
            .eq('id', order.user_id)
            .single();

          const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

          if (profile && authUser?.email) {
            await emailService.sendOrderDelivered({
              order,
              customerName: `${profile.nombre} ${profile.apellidos}`,
              customerEmail: authUser.email,
            });
          }
          notificationService.create(
            order.user_id,
            'order_delivered',
            'Pedido entregado',
            `Tu pedido #${order.numero_pedido} ha sido entregado`,
            { orderId: order.id }
          ).catch(() => {});
        } catch (e) {
          console.error('Error sending delivery email:', e);
        }
      }
    }
  }

  // Return all events
  const { data: allEvents } = await supabaseAdmin
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('occurred_at', { ascending: true });

  return allEvents ?? [];
}

// ── Sync all active shipments ──

export async function syncAllActiveShipments(): Promise<void> {
  const { data: shipments } = await supabaseAdmin
    .from('shipments')
    .select('id')
    .not('estado', 'in', '(entregado,incidencia)');

  if (!shipments) return;

  for (const shipment of shipments) {
    try {
      await syncTracking(shipment.id);
    } catch (e) {
      console.error(`Error syncing shipment ${shipment.id}:`, e);
    }
  }
}

// ── Get shipment by order ID ──

export async function getShipmentByOrderId(
  orderId: string
): Promise<(Shipment & { events: ShipmentEvent[] }) | null> {
  const { data: shipment } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (!shipment) return null;

  const { data: events } = await supabaseAdmin
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipment.id)
    .order('occurred_at', { ascending: true });

  return { ...shipment, events: events ?? [] };
}

// ── Get label ──

export async function getLabel(shipmentId: string): Promise<Buffer> {
  const { data: shipment } = await supabaseAdmin
    .from('shipments')
    .select('carrier, tracking_number')
    .eq('id', shipmentId)
    .single();

  if (!shipment || !shipment.tracking_number) {
    throw Object.assign(new Error('Envio no encontrado'), { status: 404 });
  }

  const carrierImpl = await getCarrier(shipment.carrier);
  return carrierImpl.getLabel(shipment.tracking_number);
}

// ── Register carriers ──

registerCarrier('seur', async () => {
  const { SeurCarrier } = await import('./carriers/seurCarrier.js');
  return new SeurCarrier();
});

registerCarrier('correos_express', async () => {
  const { CorreosExpressCarrier } = await import('./carriers/correosExpressCarrier.js');
  return new CorreosExpressCarrier();
});

registerCarrier('mrw', async () => {
  const { MrwCarrier } = await import('./carriers/mrwCarrier.js');
  return new MrwCarrier();
});
