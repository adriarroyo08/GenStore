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

import { useReviews } from '../../hooks/useReviews';
import { apiClient } from '../../lib/apiClient';

const makeRawReview = (overrides: Record<string, any> = {}) => ({
  id: 'rev-1',
  user_id: 'user-1',
  rating: 4,
  titulo: 'Great product',
  comentario: 'Really enjoyed it',
  verificada: true,
  created_at: '2024-01-10T10:00:00Z',
  profile: { nombre: 'Ana', apellidos: 'Garcia' },
  ...overrides,
});

const mockUser = { id: 'user-1', email: 'ana@example.com' };

describe('useReviews', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads reviews on mount for a given productId', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-1', rating: 4 }),
      makeRawReview({ id: 'rev-2', rating: 5, titulo: 'Excellent', user_id: 'user-2', profile: { nombre: 'Bob', apellidos: 'Smith' } }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith('/reviews/prod-1');
    expect(result.current.reviews).toHaveLength(2);
    expect(result.current.reviewCount).toBe(2);
  });

  it('does not fetch when productId is null', async () => {
    const { result } = renderHook(() => useReviews(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.reviews).toHaveLength(0);
  });

  it('maps raw review fields to Review interface', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-1', rating: 3, titulo: 'Ok product', comentario: 'Average', verificada: false, profile: { nombre: 'Carlos', apellidos: 'Lopez' } }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));

    const rev = result.current.reviews[0];
    expect(rev.userName).toBe('Carlos Lopez');
    expect(rev.rating).toBe(3);
    expect(rev.title).toBe('Ok product');
    expect(rev.comment).toBe('Average');
    expect(rev.verified).toBe(false);
  });

  it('sorts by newest (default)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-old', created_at: '2024-01-01T00:00:00Z', rating: 3 }),
      makeRawReview({ id: 'rev-new', created_at: '2024-06-01T00:00:00Z', rating: 4 }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(2));

    expect(result.current.reviews[0].id).toBe('rev-new');
    expect(result.current.reviews[1].id).toBe('rev-old');
  });

  it('sorts by highest rating', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-low', rating: 2, created_at: '2024-01-01T00:00:00Z' }),
      makeRawReview({ id: 'rev-high', rating: 5, created_at: '2024-01-02T00:00:00Z' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(2));

    act(() => result.current.setSortBy('highest'));

    expect(result.current.reviews[0].id).toBe('rev-high');
    expect(result.current.reviews[1].id).toBe('rev-low');
  });

  it('sorts by lowest rating', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-5', rating: 5, created_at: '2024-01-01T00:00:00Z' }),
      makeRawReview({ id: 'rev-1', rating: 1, created_at: '2024-01-02T00:00:00Z' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(2));

    act(() => result.current.setSortBy('lowest'));

    expect(result.current.reviews[0].id).toBe('rev-1');
  });

  it('filters by verified', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'ver', verificada: true }),
      makeRawReview({ id: 'unver', verificada: false }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(2));

    act(() => result.current.setFilter('verified'));

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].id).toBe('ver');
  });

  it('filters by star rating', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'r5', rating: 5, created_at: '2024-01-01T00:00:00Z' }),
      makeRawReview({ id: 'r3', rating: 3, created_at: '2024-01-02T00:00:00Z' }),
      makeRawReview({ id: 'r5b', rating: 5, created_at: '2024-01-03T00:00:00Z' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(3));

    act(() => result.current.setFilter('5'));

    expect(result.current.reviews).toHaveLength(2);
    expect(result.current.reviews.every(r => r.rating === 5)).toBe(true);
  });

  it('computes stats correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'r1', rating: 4, created_at: '2024-01-01T00:00:00Z' }),
      makeRawReview({ id: 'r2', rating: 5, created_at: '2024-01-02T00:00:00Z' }),
      makeRawReview({ id: 'r3', rating: 3, created_at: '2024-01-03T00:00:00Z' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.reviews).toHaveLength(3));

    expect(result.current.stats.totalReviews).toBe(3);
    expect(result.current.averageRating).toBe(4);
    expect(result.current.stats.ratingDistribution[4]).toBe(1);
    expect(result.current.stats.ratingDistribution[5]).toBe(1);
    expect(result.current.stats.ratingDistribution[3]).toBe(1);
  });

  it('submitReview calls API and reloads', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValueOnce({});

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.submitReview({ rating: 5, title: 'Great!', comment: 'Love it' });
    });

    expect(success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/reviews/prod-1', {
      rating: 5,
      titulo: 'Great!',
      comentario: 'Love it',
    });
  });

  it('submitReview returns false on API error', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useReviews('prod-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.submitReview({ rating: 4, title: 'Ok', comment: 'Fine' });
    });

    expect(success).toBe(false);
  });

  it('userHasReviewed is true when user already reviewed', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-1', user_id: 'user-1' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1', mockUser));
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));

    expect(result.current.userHasReviewed).toBe(true);
  });

  it('userHasReviewed is false when user has not reviewed', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      makeRawReview({ id: 'rev-1', user_id: 'other-user' }),
    ]);

    const { result } = renderHook(() => useReviews('prod-1', mockUser));
    await waitFor(() => expect(result.current.reviews).toHaveLength(1));

    expect(result.current.userHasReviewed).toBe(false);
  });
});
