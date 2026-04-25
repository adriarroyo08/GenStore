import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

// Mock global fetch for /api/v1/settings/public
const mockFetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ puntos_enabled: true }),
});
vi.stubGlobal('fetch', mockFetch);

import { usePoints } from '../../hooks/usePoints';
import { apiClient } from '../../lib/apiClient';

const mockUser = { id: 'user-1', email: 'test@example.com' };

describe('usePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ puntos_enabled: true }),
    });
  });

  it('loads points balance on mount when user provided', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') {
        return Promise.resolve({
          currentPoints: 500,
          lifetimeEarned: 1200,
          lifetimeRedeemed: 700,
          transactions: [],
        });
      }
      if (url === '/rewards') {
        return Promise.resolve({ rewards: [] });
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userPoints).not.toBeNull();
    expect(result.current.userPoints?.currentPoints).toBe(500);
    expect(result.current.userPoints?.lifetimeEarned).toBe(1200);
    expect(result.current.userPoints?.tier).toBe('silver'); // 1200 >= 1000
  });

  it('assigns correct tier based on lifetime earned', async () => {
    const tiers = [
      { lifetimeEarned: 500, expected: 'bronze' },
      { lifetimeEarned: 1500, expected: 'silver' },
      { lifetimeEarned: 6000, expected: 'gold' },
      { lifetimeEarned: 12000, expected: 'platinum' },
    ];

    for (const { lifetimeEarned, expected } of tiers) {
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url === '/points') {
          return Promise.resolve({ currentPoints: 100, lifetimeEarned, lifetimeRedeemed: 0, transactions: [] });
        }
        return Promise.resolve({ rewards: [] });
      });

      const { result } = renderHook(() => usePoints(mockUser));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.userPoints?.tier).toBe(expected);
    }
  });

  it('does not fetch when user is null', async () => {
    const { result } = renderHook(() => usePoints(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.userPoints).toBeNull();
  });

  it('handles disabled points system from API', async () => {
    // Both fetch (settings) and API must agree system is disabled
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ puntos_enabled: false }),
    });
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') return Promise.resolve({ disabled: true });
      return Promise.resolve({ rewards: [] });
    });

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userPoints).toBeNull();
    expect(result.current.isEnabled).toBe(false);
  });

  it('redeemReward calls API and refreshes points', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') {
        return Promise.resolve({ currentPoints: 300, lifetimeEarned: 1000, lifetimeRedeemed: 700, transactions: [] });
      }
      return Promise.resolve({ rewards: [] });
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({});

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.redeemReward('reward-1');
    });

    expect(success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/rewards/redeem', { rewardId: 'reward-1' });
  });

  it('redeemReward returns false when system is disabled', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ puntos_enabled: false }),
    });

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') return Promise.resolve({ disabled: true });
      return Promise.resolve({ rewards: [] });
    });

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.redeemReward('reward-1');
    });

    expect(success).toBe(false);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('calculatePointsFromAmount applies tiered rates', () => {
    vi.mocked(apiClient.get).mockResolvedValue({ rewards: [] });
    const { result } = renderHook(() => usePoints(null));

    // 0-25€: 1pt/€ → 25pts
    expect(result.current.calculatePointsFromAmount(25)).toBe(25);
    // 0-25: 25pts, 25-50: 25*1.5=37.5 → floor(62.5)=62
    expect(result.current.calculatePointsFromAmount(50)).toBe(62);
    // 0-25: 25, 25-50: 37.5, 50-100: 50*2=100 → floor(162.5)=162
    expect(result.current.calculatePointsFromAmount(100)).toBe(162);
  });

  it('calculatePointsFromAmount returns 0 for negative or zero amount', () => {
    const { result } = renderHook(() => usePoints(null));

    expect(result.current.calculatePointsFromAmount(0)).toBe(0);
    expect(result.current.calculatePointsFromAmount(-10)).toBe(0);
  });

  it('loads available rewards', async () => {
    const rewards = [
      { id: 'r1', name: '10% Discount', description: 'Desc', pointsCost: 100, category: 'discount', value: 10, isActive: true },
    ];
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') {
        return Promise.resolve({ currentPoints: 100, lifetimeEarned: 100, lifetimeRedeemed: 0, transactions: [] });
      }
      if (url === '/rewards') {
        return Promise.resolve({ rewards });
      }
      return Promise.resolve({});
    });

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.availableRewards).toHaveLength(1));

    expect(result.current.availableRewards[0].name).toBe('10% Discount');
  });

  it('sets error state on API failure', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/points') return Promise.reject(new Error('Network error'));
      return Promise.resolve({ rewards: [] });
    });

    const { result } = renderHook(() => usePoints(mockUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.userPoints).toBeNull();
  });
});
