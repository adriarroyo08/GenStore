import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import type { Review, ReviewStats, ReviewFormData, ReviewSortBy, ReviewFilter } from '../types/reviews';

interface RawReview {
  id: string;
  user_id: string;
  rating: number;
  titulo: string | null;
  comentario: string | null;
  verificada: boolean;
  created_at: string;
  updated_at?: string;
  profile: { nombre: string; apellidos: string } | null;
}

function mapReview(r: RawReview): Review {
  const nombre = r.profile?.nombre ?? '';
  const apellidos = r.profile?.apellidos ?? '';
  return {
    id: r.id,
    productId: '',
    userId: r.user_id,
    userName: [nombre, apellidos].filter(Boolean).join(' ') || 'Anónimo',
    userEmail: '',
    rating: r.rating,
    title: r.titulo ?? '',
    comment: r.comentario ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? r.created_at,
    verified: r.verificada,
    helpful: 0,
    notHelpful: 0,
    userHelpfulVotes: [],
    userNotHelpfulVotes: [],
  };
}

export function useReviews(productId: string | null, _user?: any) {
  const [rawReviews, setRawReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<ReviewSortBy>('newest');
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.get<RawReview[]>(`/reviews/${productId}`);
      setRawReviews((Array.isArray(data) ? data : []).map(mapReview));
    } catch {
      setRawReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Filtered reviews
  const reviews = useMemo(() => {
    let filtered = rawReviews;

    if (filter === 'verified') {
      filtered = filtered.filter((r) => r.verified);
    } else if (filter !== 'all') {
      const rating = parseInt(filter);
      filtered = filtered.filter((r) => r.rating === rating);
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        sorted.sort((a, b) => b.helpful - a.helpful);
        break;
    }

    return sorted;
  }, [rawReviews, filter, sortBy]);

  // Stats (computed from ALL reviews, not filtered)
  const stats: ReviewStats = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rawReviews.forEach((r) => {
      const key = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof typeof distribution;
      distribution[key]++;
    });
    const avg =
      rawReviews.length > 0
        ? Math.round((rawReviews.reduce((s, r) => s + r.rating, 0) / rawReviews.length) * 10) / 10
        : 0;
    return { averageRating: avg, totalReviews: rawReviews.length, ratingDistribution: distribution };
  }, [rawReviews]);

  const userHasReviewed = useMemo(
    () => _user ? rawReviews.some((r) => r.userId === _user.id) : false,
    [rawReviews, _user],
  );

  const submitReview = useCallback(
    async (formData: ReviewFormData) => {
      if (!productId) return false;
      setIsSubmitting(true);
      try {
        await apiClient.post(`/reviews/${productId}`, {
          rating: formData.rating,
          titulo: formData.title,
          comentario: formData.comment,
        });
        await loadReviews();
        return true;
      } catch {
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [productId, loadReviews],
  );

  const voteOnReview = useCallback(async (_reviewId: string, _helpful: boolean) => {
    // Voting not implemented in backend yet — no-op
  }, []);

  return {
    reviews,
    stats,
    sortBy,
    setSortBy,
    filter,
    setFilter,
    userHasReviewed,
    isLoading,
    isSubmitting,
    submitReview,
    voteOnReview,
    loadReviews,
    averageRating: stats.averageRating,
    reviewCount: stats.totalReviews,
  };
}
