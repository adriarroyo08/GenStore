import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  amount: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'product' | 'shipping' | 'exclusive';
  value: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: number;
}

export interface UserPoints {
  currentPoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface UsePointsReturn {
  userPoints: UserPoints | null;
  pointsHistory: PointsTransaction[];
  availableRewards: Reward[];
  isLoading: boolean;
  isEnabled: boolean;
  error: string | null;
  fetchUserPoints: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<boolean>;
  calculatePointsFromAmount: (amount: number) => number;
}

export function usePoints(user: any): UsePointsReturn {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progressive points calculation (mirrors backend logic)
  // 0-25€: 1pt/€, 25-50€: 1.5pt/€, 50-100€: 2pt/€, 100-200€: 2.5pt/€, 200€+: 3pt/€
  const calculatePointsFromAmount = useCallback((amount: number): number => {
    if (!isEnabled || amount <= 0) return 0;
    let points = 0;
    const tiers = [
      { limit: 25, rate: 1 },
      { limit: 50, rate: 1.5 },
      { limit: 100, rate: 2 },
      { limit: 200, rate: 2.5 },
      { limit: Infinity, rate: 3 },
    ];
    let remaining = amount;
    let prevLimit = 0;
    for (const tier of tiers) {
      const sliceSize = Math.min(remaining, tier.limit - prevLimit);
      if (sliceSize <= 0) break;
      points += sliceSize * tier.rate;
      remaining -= sliceSize;
      prevLimit = tier.limit;
    }
    return Math.floor(points);
  }, [isEnabled]);

  // Determine user tier based on lifetime earned points
  const calculateTier = (lifetimeEarned: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (lifetimeEarned >= 10000) return 'platinum';
    if (lifetimeEarned >= 5000) return 'gold';
    if (lifetimeEarned >= 1000) return 'silver';
    return 'bronze';
  };

  // Check if points system is enabled via public settings
  useEffect(() => {
    fetch('/api/v1/settings/public')
      .then((r) => r.json())
      .then((data) => {
        const enabled = data.puntos_enabled ?? true;
        setIsEnabled(enabled);
      })
      .catch(() => {});
  }, []);

  const fetchUserPoints = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<any>('/points');

      // Backend returns { disabled: true } when system is off
      if (data.disabled) {
        setIsEnabled(false);
        setUserPoints(null);
        setPointsHistory([]);
        return;
      }

      const tier = calculateTier(data.lifetimeEarned || 0);

      setUserPoints({
        currentPoints: data.currentPoints || 0,
        lifetimeEarned: data.lifetimeEarned || 0,
        lifetimeRedeemed: data.lifetimeRedeemed || 0,
        tier
      });

      setPointsHistory(data.transactions || []);
    } catch (err) {
      console.error('Error fetching user points:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch points');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableRewards = async () => {
    try {
      const data = await apiClient.get<any>('/rewards');
      if (data.disabled) {
        setAvailableRewards([]);
        return;
      }
      setAvailableRewards(data.rewards || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
    }
  };

  const redeemReward = async (rewardId: string): Promise<boolean> => {
    if (!user || !isEnabled) return false;

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/rewards/redeem', { rewardId });

      // Refresh user points and history
      await fetchUserPoints();
      return true;
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchUserPoints();
      fetchAvailableRewards();
    } else {
      setUserPoints(null);
      setPointsHistory([]);
    }
  }, [user]);

  return {
    userPoints,
    pointsHistory,
    availableRewards,
    isLoading,
    isEnabled,
    error,
    fetchUserPoints,
    redeemReward,
    calculatePointsFromAmount,
  };
}
