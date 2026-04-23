import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface ReviewEligibilityResult {
  canReview: boolean;
  reason: 'eligible' | 'not_logged_in' | 'no_purchases' | 'not_purchased_or_pending' | 'already_reviewed';
  message: string;
  orderDetails?: {
    orderId: string;
    orderDate: string;
    deliveryDate: string;
  };
  loading: boolean;
  error?: string;
}

export function useReviewEligibility(productId: string, user: any) {
  const [eligibility, setEligibility] = useState<ReviewEligibilityResult>({
    canReview: false,
    reason: 'not_logged_in',
    message: 'User not logged in',
    loading: true
  });

  useEffect(() => {
    const checkEligibility = async () => {
      // Reset state
      setEligibility(prev => ({ ...prev, loading: true, error: undefined }));

      // If no user, can't review
      if (!user?.access_token) {
        setEligibility({
          canReview: false,
          reason: 'not_logged_in',
          message: 'User not logged in',
          loading: false
        });
        return;
      }

      if (!productId) {
        setEligibility({
          canReview: false,
          reason: 'not_logged_in',
          message: 'No product specified',
          loading: false
        });
        return;
      }

      try {
        console.log('🔍 [ReviewEligibility] Checking eligibility for product:', productId);

        const data = await apiClient.get<any>(`/reviews/can-review/${productId}`);
        console.log('✅ [ReviewEligibility] Server response:', data);

        if (data.success !== undefined) {
          setEligibility({
            canReview: data.canReview,
            reason: data.reason,
            message: data.message,
            orderDetails: data.orderDetails,
            loading: false
          });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('❌ [ReviewEligibility] Error checking eligibility:', error);
        setEligibility({
          canReview: false,
          reason: 'not_logged_in',
          message: 'Error checking review eligibility',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkEligibility();
  }, [productId, user?.access_token]);

  return eligibility;
}