import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';
import { useReviews } from '../hooks/useReviews';

// Helper function to format date relative to now
const formatDate = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'hoy';
  } else if (diffInDays === 1) {
    return 'ayer';
  } else if (diffInDays < 7) {
    return `${diffInDays} días`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 semana' : `${weeks} semanas`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 mes' : `${months} meses`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 año' : `${years} años`;
  }
};

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          aria-hidden="true"
          className={`${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

export function GoogleReviews() {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // Get all reviews from all products for the Google Reviews section
  const [realReviews, setRealReviews] = useState<any[]>([]);
  
  useEffect(() => {
    // Load all reviews from localStorage for the Google Reviews component
    const stored = localStorage.getItem('techstore_reviews');
    if (stored) {
      try {
        const allReviews = JSON.parse(stored);
        // Get a sample of reviews from different products, limit to 6 most recent
        const sortedReviews = allReviews
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
        setRealReviews(sortedReviews);
      } catch (error) {
        console.error('Error parsing reviews:', error);
        setRealReviews([]);
      }
    }
  }, []);
  
  const averageRating = realReviews.length > 0 
    ? realReviews.reduce((sum, review) => sum + review.rating, 0) / realReviews.length 
    : 0;
  const totalReviews = realReviews.length;

  const handleWriteReview = () => {
    try {
      // URL de ejemplo para Google My Business reviews
      // En una implementación real, esto sería la URL específica del negocio en Google
      const googleReviewsUrl = 'https://www.google.com/maps/place/GenStore/@40.7128,-74.0060,15z/data=!4m6!3m5!1s0x0:0x0!8m2!3d40.7128!4d-74.0060!16s%2Fg%2F11example';
      
      // Intentar abrir la página en una nueva pestaña
      const newWindow = window.open(googleReviewsUrl, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        // Mostrar notificación de éxito
        showNotification(t('googleReviews.reviewOpened'), 'success');
      } else {
        // Si no se pudo abrir (bloqueador de popups), mostrar error
        showNotification(t('googleReviews.reviewOpenError'), 'error');
      }
    } catch (error) {
      console.error('Error opening Google Reviews:', error);
      showNotification(t('googleReviews.reviewOpenError'), 'error');
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="bg-muted/50 w-full">
      {/* Top Separator */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border"></div>
            <div className="flex items-center gap-2 px-4">
              <div className="w-2 h-2 rounded-full bg-primary/20"></div>
              <div className="w-3 h-3 rounded-full bg-primary/40"></div>
              <div className="w-2 h-2 rounded-full bg-primary/20"></div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border"></div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 pb-12 lg:pb-20">
        <div className="flex flex-col gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col gap-4 items-center text-center w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="##FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <h2 id="reviews-heading" className="font-bold text-2xl sm:text-3xl text-foreground">
                  {t('googleReviews.title')}
                </h2>
              </div>
            </div>
            
            {realReviews.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(averageRating)} />
                  <span className="font-semibold text-lg text-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-base text-muted-foreground">
                  {t('googleReviews.basedOnReviews', { count: totalReviews })}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-base text-muted-foreground">
                  {t('googleReviews.noReviewsYet')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('googleReviews.beFirstToReview')}
                </span>
              </div>
            )}
          </div>

          {/* Reviews Grid or No Reviews Message */}
          {realReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {realReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-card flex flex-col gap-4 items-start p-6 rounded-2xl shadow-sm border border-border w-full"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative shrink-0 w-12 h-12">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="font-semibold text-white text-sm">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base text-foreground truncate">
                          {review.userName}
                        </h4>
                        {review.verified && (
                          <div className="flex items-center gap-1">
                            <div className="bg-blue-500 rounded-full p-1">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20,6 9,17 4,12" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('googleReviews.timeAgo', { time: formatDate(review.createdAt) })}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <StarRating rating={review.rating} />

                  {/* Title and Comment */}
                  {review.title && (
                    <h5 className="font-semibold text-sm text-foreground">
                      {review.title}
                    </h5>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed w-full">
                    {review.comment}
                  </p>

                  {/* Google Badge */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border w-full">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-xs text-muted-foreground font-medium">
                      {t('googleReviews.postedOnGoogle')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                  <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                  <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                  <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                  <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground">
                  {t('googleReviews.noReviewsTitle')}
                </h3>
                <p className="text-muted-foreground">
                  {t('googleReviews.noReviewsDescription')}
                </p>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl">
            <h3 className="font-bold text-xl sm:text-2xl text-foreground">
              {realReviews.length > 0 ? t('googleReviews.alreadyPurchased') : t('googleReviews.shareYourThoughts')}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {realReviews.length > 0 ? t('googleReviews.shareExperience') : t('googleReviews.helpOthersDecide')}
            </p>
            <button 
              onClick={handleWriteReview}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 px-6 sm:px-8 py-3 rounded-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="white"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="white"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="white"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="white"
                />
              </svg>
              <span className="font-semibold text-base text-white">
                {t('googleReviews.writeReview')}
              </span>
            </button>
          </div>
        </div>
        
        {/* Bottom Separator */}
        <div className="flex items-center justify-center pt-8">
          <div className="flex items-center gap-4 w-full max-w-lg">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-muted-foreground/30"></div>
            <div className="px-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground/50"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                  opacity="0.6"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                  opacity="0.5"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                  opacity="0.4"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                  opacity="0.3"
                />
              </svg>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-muted-foreground/30"></div>
          </div>
        </div>
      </div>
    </section>
  );
}