import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ success: true, orders: [] }),
    post: vi.fn().mockResolvedValue({ success: true }),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { useOrders } from '../../hooks/useOrders';
import { apiClient } from '../../lib/apiClient';

const mockUser = { id: 'user-1', email: 'test@example.com' };

const makeOrder = (overrides: Partial<ReturnType<typeof makeOrder>> = {}) => ({
  id: 'order-1',
  numeroPedido: 'ORD-001',
  status: 'pending' as const,
  orderDate: '2024-01-01T00:00:00Z',
  items: [{ id: 'item-1', name: 'Product', quantity: 1, price: 50 }],
  total: 50,
  itemCount: 1,
  ...overrides,
});

describe('useOrders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches orders on mount when user provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      orders: [makeOrder()],
    });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith('/orders');
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].id).toBe('order-1');
  });

  it('does not fetch when user is null', async () => {
    const { result } = renderHook(() => useOrders(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.orders).toHaveLength(0);
  });

  it('handles array response format', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([makeOrder(), makeOrder({ id: 'order-2', numeroPedido: 'ORD-002' })]);

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.orders).toHaveLength(2);
  });

  it('filters orders by status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      orders: [
        makeOrder({ id: 'o1', status: 'pending' }),
        makeOrder({ id: 'o2', status: 'delivered' }),
        makeOrder({ id: 'o3', status: 'cancelled' }),
      ],
    });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Default filter is 'all'
    expect(result.current.orders).toHaveLength(3);

    act(() => {
      result.current.setFilter('delivered');
    });

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].id).toBe('o2');
  });

  it('filters by pending status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      orders: [
        makeOrder({ id: 'o1', status: 'pending' }),
        makeOrder({ id: 'o2', status: 'pending' }),
        makeOrder({ id: 'o3', status: 'shipped' }),
      ],
    });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setFilter('pending'));

    expect(result.current.orders).toHaveLength(2);
    expect(result.current.pendingOrders).toBe(2);
  });

  it('cancelOrder calls API and refetches', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      orders: [makeOrder()],
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancelOrder('order-1');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/orders/order-1/cancel');
    // refetch was called
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('computes filterCounts correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      orders: [
        makeOrder({ id: 'o1', status: 'pending' }),
        makeOrder({ id: 'o2', status: 'pending' }),
        makeOrder({ id: 'o3', status: 'delivered' }),
      ],
    });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filterCounts['pending']).toBe(2);
    expect(result.current.filterCounts['delivered']).toBe(1);
  });

  it('recentOrders returns at most 5 orders', async () => {
    const orders = Array.from({ length: 8 }, (_, i) =>
      makeOrder({ id: `order-${i}`, numeroPedido: `ORD-00${i}` })
    );
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, orders });

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.recentOrders).toHaveLength(5);
  });

  it('returns empty orders on API error', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useOrders(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.orders).toHaveLength(0);
  });
});
