import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  slug?: string;
}

export interface Order {
  id: string;
  numeroPedido?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  itemCount: number;
}

const FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderFilter = typeof FILTERS[number];
export { FILTERS };

export function useOrders(user: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>('all');

  const fetchOrders = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const data = await apiClient.get<any>('/orders');
      if (data.success && data.orders) {
        setOrders(data.orders);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const filterCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const cancelOrder = useCallback(async (orderId: string) => {
    const data = await apiClient.post<any>(`/orders/${orderId}/cancel`);
    if (data.success) await fetchOrders();
    return data;
  }, [fetchOrders]);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  return {
    orders: filteredOrders,
    allOrders: orders,
    isLoading,
    filter,
    setFilter,
    filterCounts,
    cancelOrder,
    refetch: fetchOrders,
    pendingOrders,
    recentOrders,
  };
}
