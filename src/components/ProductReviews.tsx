import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useReviews } from '../hooks/useReviews';
import { useReviewEligibility } from '../hooks/useReviewEligibility';
import { ReviewFormData, ReviewSortBy, ReviewFilter } from '../types/reviews';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Star, ThumbsUp, ThumbsDown, User, ShieldCheck, Edit3, ShoppingBag, Clock, AlertCircle } from 'lucide-react';

interface ProductReviewsProps {
  product: any;
  user: any;
}

export function ProductReviews({ product, user }: ProductReviewsProps) {
  const { t } = useLanguage();
  const productId = product?.id;
  
  const {
    reviews,
    stats,
    sortBy,
    setSortBy,
    filter,
    setFilter,
    userHasReviewed,
    isSubmitting,
    submitReview,
    voteOnReview
  } = useReviews(productId, user);

  // Check if user is eligible to write a review
  const eligibility = useReviewEligibility(productId, user);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: ''
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) return;

    const success = await submitReview(reviewForm);
    if (success) {
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStars = (rating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400 hover:scale-110'
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredReviewsCount = () => {
    if (filter === 'all') return stats.totalReviews;
    if (filter === 'verified') return reviews.filter(r => r.verified).length;
    const rating = parseInt(filter);
    return stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
  };

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            {t('reviews.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-center sm:text-left">
              <div className="text-4xl font-bold text-foreground mb-2">
                {stats.averageRating || 0}
              </div>
              <div className="mb-2">
                {renderStars(Math.round(stats.averageRating), 'lg')}
              </div>
              <div className="text-muted-foreground">
                {t('reviews.basedOn', { count: stats.totalReviews })}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{rating}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Action Section */}
          <div className="pt-4 border-t">
            {!user ? (
              // Not logged in
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{t('reviews.loginToReview')}</p>
                  <p className="text-sm text-muted-foreground">{t('reviews.loginToReviewDescription')}</p>
                </div>
              </div>
            ) : eligibility.loading ? (
              // Loading eligibility check
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-muted-foreground">{t('reviews.checkingEligibility')}</span>
              </div>
            ) : eligibility.canReview && !userHasReviewed ? (
              // Can write review
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">{t('reviews.eligibleToReview')}</p>
                    <p className="text-sm text-green-600 dark:text-green-300">{t('reviews.purchaseVerified')}</p>
                    {eligibility.orderDetails && (
                      <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                        {t('reviews.deliveredOn')}: {new Date(eligibility.orderDetails.deliveryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('reviews.writeReview')}
                </Button>
              </div>
            ) : userHasReviewed ? (
              // Already reviewed
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{t('reviews.alreadyReviewed')}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{t('reviews.thankYouForReview')}</p>
                </div>
              </div>
            ) : (
              // Not eligible
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  {eligibility.reason === 'no_purchases' ? (
                    <ShoppingBag className="w-5 h-5 text-orange-600 mt-0.5" />
                  ) : eligibility.reason === 'not_purchased_or_pending' ? (
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      {eligibility.reason === 'no_purchases' && t('reviews.noPurchases')}
                      {eligibility.reason === 'not_purchased_or_pending' && t('reviews.needPurchaseAndDelivery')}
                      {eligibility.reason === 'already_reviewed' && t('reviews.alreadyReviewed')}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                      {eligibility.reason === 'no_purchases' && t('reviews.noPurchasesDescription')}
                      {eligibility.reason === 'not_purchased_or_pending' && t('reviews.needPurchaseAndDeliveryDescription')}
                      {eligibility.reason === 'already_reviewed' && t('reviews.oneReviewPerProduct')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && user && eligibility.canReview && !userHasReviewed && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reviews.writeReview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('reviews.yourRating')}
                </label>
                {renderInteractiveStars(reviewForm.rating, (rating) =>
                  setReviewForm(prev => ({ ...prev, rating }))
                )}
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('reviews.reviewTitle')}
                </label>
                <Input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('reviews.titlePlaceholder')}
                  maxLength={100}
                  required
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('reviews.yourReview')}
                </label>
                <Textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={t('reviews.commentPlaceholder')}
                  rows={4}
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {reviewForm.comment.length}/1000 {t('reviews.characters')}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !reviewForm.title.trim() || !reviewForm.comment.trim()}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('reviews.submitting')}
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      {t('reviews.submitReview')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  {t('general.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {stats.totalReviews > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>
                {t('reviews.customerReviews')} ({getFilteredReviewsCount()})
              </CardTitle>
              
              {/* Sort and Filter Controls */}
              <div className="flex gap-3">
                <Select value={filter} onValueChange={(value) => setFilter(value as ReviewFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reviews.allReviews')}</SelectItem>
                    <SelectItem value="5">5 {t('reviews.stars')}</SelectItem>
                    <SelectItem value="4">4 {t('reviews.stars')}</SelectItem>
                    <SelectItem value="3">3 {t('reviews.stars')}</SelectItem>
                    <SelectItem value="2">2 {t('reviews.stars')}</SelectItem>
                    <SelectItem value="1">1 {t('reviews.star')}</SelectItem>
                    <SelectItem value="verified">{t('reviews.verifiedOnly')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as ReviewSortBy)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('reviews.newest')}</SelectItem>
                    <SelectItem value="oldest">{t('reviews.oldest')}</SelectItem>
                    <SelectItem value="highest">{t('reviews.highestRated')}</SelectItem>
                    <SelectItem value="lowest">{t('reviews.lowestRated')}</SelectItem>
                    <SelectItem value="helpful">{t('reviews.mostHelpful')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id}>
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && (
                            <Badge variant="secondary" className="gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {t('reviews.verified')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-2">
                    <h4 className="font-medium">{review.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {t('reviews.wasHelpful')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteOnReview(review.id, true)}
                        disabled={!user}
                        className="gap-1 h-8"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {review.helpful}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteOnReview(review.id, false)}
                        disabled={!user}
                        className="gap-1 h-8"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        {review.notHelpful}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator className="mt-6" />
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {filter === 'verified'
                  ? t('reviews.noVerifiedReviews')
                  : t('reviews.noReviewsForFilter')
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Reviews State */}
      {stats.totalReviews === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('reviews.noReviews')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('reviews.beFirstToReview')}
            </p>
            {user && eligibility.canReview && !userHasReviewed && (
              <Button onClick={() => setShowReviewForm(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                {t('reviews.writeReview')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}