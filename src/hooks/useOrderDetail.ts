import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export interface OrderDetailItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  selectedColorName?: string;
}

export interface ShipmentEvent {
  estado: string;
  descripcion: string;
  ubicacion?: string;
  occurred_at: string;
}

export interface ShipmentInfo {
  carrier: string;
  tracking_number: string | null;
  estado: string;
  events: ShipmentEvent[];
}

export interface OrderDetail {
  id: string;
  numeroPedido: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  items: OrderDetailItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  paymentMethod: { type: string; last4: string } | null;
  shipment: ShipmentInfo | null;
  paymentIntentId: string | null;
}

const STATUS_MAP: Record<string, OrderDetail['status']> = {
  pendiente: 'pending',
  pagado: 'confirmed',
  procesando: 'processing',
  enviado: 'shipped',
  entregado: 'delivered',
  cancelado: 'cancelled',
  fallido: 'cancelled',
  devuelto: 'cancelled',
};

export function useOrderDetail(orderId: string, user: any) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!user || !orderId) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get<any>(`/orders/${orderId}`);
      if (!data || !data.id) { setError('Pedido no encontrado'); return; }

      let shipment: ShipmentInfo | null = null;
      const mappedStatus = STATUS_MAP[data.estado] || 'pending';
      if (['shipped', 'delivered'].includes(mappedStatus)) {
        try {
          shipment = await apiClient.get<ShipmentInfo>(`/orders/${orderId}/tracking`);
        } catch { /* No tracking available */ }
      }

      setOrder({
        id: data.id,
        numeroPedido: data.numero_pedido || data.id.substring(0, 8).toUpperCase(),
        status: mappedStatus,
        orderDate: data.created_at,
        items: (data.order_items ?? []).map((item: any) => ({
          id: item.id,
          name: item.product?.nombre ?? 'Producto',
          quantity: item.cantidad,
          price: Number(item.precio_unitario),
          image: item.product?.imagenes?.[0],
        })),
        subtotal: Number(data.subtotal),
        tax: Number(data.impuestos),
        shipping: Number(data.gastos_envio),
        total: Number(data.total),
        shippingAddress: data.shippingAddress || null,
        paymentMethod: data.metodo_pago ? { type: data.metodo_pago, last4: '' } : null,
        shipment,
        paymentIntentId: data.payment_intent_id || null,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar el pedido');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  return { order, isLoading, error, refetch: fetchOrder };
}
