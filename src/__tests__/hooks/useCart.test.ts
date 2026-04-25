import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn().mockReturnValue({ isAuthenticated: true }),
}));

import { useCart } from '../../hooks/useCart';
import { apiClient } from '../../lib/apiClient';

describe('useCart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads empty cart on mount', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('maps server cart items to frontend format', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([{
      id: 'item-1', product_id: 'prod-1', cantidad: 2,
      opciones: { color: '#ff0000', colorName: 'Red' },
      product: { id: 'prod-1', nombre: 'Test Product', slug: 'test', precio: 29.99, imagenes: ['img.jpg'], stock: 10, marca: 'TestBrand', descripcion: 'Desc', categories: { nombre: 'Electronics' } },
    }]);
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.cart.length).toBe(1));
    expect(result.current.cart[0].name).toBe('Test Product');
    expect(result.current.cart[0].price).toBe(29.99);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cartTotal).toBeCloseTo(59.98);
    expect(result.current.cartCount).toBe(2);
  });

  it('addToCart calls API and reloads', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.addToCart('prod-1', '#ff0000', 'Red'); });
    expect(apiClient.post).toHaveBeenCalledWith('/cart', { productId: 'prod-1', cantidad: 1, opciones: { color: '#ff0000', colorName: 'Red' } });
  });

  it('clearCart empties local state', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.clearCart(); });
    expect(apiClient.delete).toHaveBeenCalledWith('/cart');
    expect(result.current.cart).toEqual([]);
  });
});
