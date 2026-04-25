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
  useAuthContext: vi.fn().mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } }),
}));

import { useWishlist } from '../../hooks/useWishlist';
import { apiClient } from '../../lib/apiClient';
import { useAuthContext } from '../../contexts/AuthContext';

describe('useWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to authenticated state before each test
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' } as any,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('loads wishlist items on mount when authenticated', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { id: 'w1', product_id: 'prod-1', product: { id: 'prod-1', nombre: 'Product 1', slug: 'p1', precio: 10, imagenes: [], rating: 4 } },
      { id: 'w2', product_id: 'prod-2', product: { id: 'prod-2', nombre: 'Product 2', slug: 'p2', precio: 20, imagenes: [], rating: 5 } },
    ]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith('/wishlist');
    expect(result.current.wishlist).toEqual(['prod-1', 'prod-2']);
    expect(result.current.entries).toHaveLength(2);
  });

  it('returns empty wishlist when not authenticated', async () => {
    vi.mocked(useAuthContext).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.wishlist).toEqual([]);
    expect(result.current.entries).toHaveLength(0);
  });

  it('toggleWishlist adds item when not in wishlist', async () => {
    // Initial load returns empty
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleWishlist('prod-new');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/wishlist/prod-new');
  });

  it('toggleWishlist removes item when already in wishlist', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { id: 'w1', product_id: 'prod-1', product: { id: 'prod-1', nombre: 'P1', slug: 'p1', precio: 10, imagenes: [], rating: 4 } },
    ]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.wishlist).toContain('prod-1'));

    await act(async () => {
      await result.current.toggleWishlist('prod-1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/wishlist/prod-1');
  });

  it('isInWishlist returns correct boolean', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { id: 'w1', product_id: 'prod-A', product: { id: 'prod-A', nombre: 'A', slug: 'a', precio: 5, imagenes: [], rating: 3 } },
    ]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.wishlist).toContain('prod-A'));

    expect(result.current.isInWishlist('prod-A')).toBe(true);
    expect(result.current.isInWishlist('prod-unknown')).toBe(false);
  });

  it('toggleWishlist accepts product object with id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleWishlist({ id: 'prod-obj' });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/wishlist/prod-obj');
  });

  it('setWishlist sets product IDs directly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    const { result } = renderHook(() => useWishlist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setWishlist(['id-1', 'id-2', 'id-3']);
    });

    expect(result.current.wishlist).toEqual(['id-1', 'id-2', 'id-3']);
  });
});
