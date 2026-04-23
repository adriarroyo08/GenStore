import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PriceDisplay } from './PriceDisplay';

interface OffersCarouselProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  user?: any; // Add user prop
}

// Deterministic hash from product ID to generate a stable offset in ms (1-48 hours)
function getOfferEndTime(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash + productId.charCodeAt(i)) | 0;
  }
  // Map hash to 1-48 hours in milliseconds
  const offsetMs = (Math.abs(hash) % (47 * 3600 * 1000)) + 3600 * 1000;
  // Anchor to the start of the current day so the value is stable within a page session
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart.getTime() + offsetMs;
}

function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } | null {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export function OffersCarousel({
  products,
  onProductClick,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  user
}: OffersCarouselProps) {
  const { t } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const { isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [cartStates, setCartStates] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const handleAddToCartAnimated = useCallback(async (product: Product) => {
    const id = product.id;
    if (cartStates[id] && cartStates[id] !== 'idle') return;
    setCartStates(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await Promise.resolve(onAddToCart(product));
      setCartStates(prev => ({ ...prev, [id]: 'done' }));
      setTimeout(() => setCartStates(prev => ({ ...prev, [id]: 'idle' })), 1800);
    } catch {
      setCartStates(prev => ({ ...prev, [id]: 'idle' }));
    }
  }, [onAddToCart, cartStates]);

  // Filter products for offers (randomly select some products as on sale)
  const saleProducts = products.slice(0, 6).map(product => ({
    ...product,
    onSale: true,
    salePercentage: Math.floor(Math.random() * 30) + 10, // 10-40% off
    originalPrice: product.price + (product.price * 0.2) // Original price 20% higher
  }));

  // Pre-compute end times (stable per product ID, memoised on product list)
  const endTimes = useMemo(() => {
    const map: Record<string, number> = {};
    saleProducts.forEach(p => {
      map[p.id] = getOfferEndTime(p.id);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Single countdown interval at component level
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAutoScrolling && saleProducts.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex =>
          prevIndex >= saleProducts.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000); // Change slide every 4 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoScrolling, saleProducts.length]);

  const handlePrevious = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => prev === 0 ? saleProducts.length - 1 : prev - 1);

    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const handleNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => prev >= saleProducts.length - 1 ? 0 : prev + 1);

    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const handleDotClick = (index: number) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);

    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const getVisibleProducts = () => {
    if (saleProducts.length === 0) return [];

    const visibleCount = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const result = [];

    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % saleProducts.length;
      result.push(saleProducts[index]);
    }

    return result;
  };

  // Determine badge type based on original index in saleProducts
  const getBadgeType = (product: Product): 'bestseller' | 'new' | null => {
    const idx = saleProducts.findIndex(p => p.id === product.id);
    if (idx >= 0 && idx <= 1) return 'bestseller';
    if (idx >= saleProducts.length - 2) return 'new';
    return null;
  };

  if (saleProducts.length === 0) {
    return null;
  }

  const visibleProducts = getVisibleProducts();

  return (
    <section aria-labelledby="offers-heading" className={`w-full py-12 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 ${isDarkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span className="animate-pulse">🔥</span>
            <span>{t('offers.limitedTime')}</span>
          </div>

          <h2 id="offers-heading" className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            {t('offers.title')}
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('offers.subtitle')}
          </p>

          {/* Auto-scroll indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-6">
            <div className={`w-2 h-2 rounded-full ${isAutoScrolling ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span>{t('offers.autoScroll')}</span>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 hover:shadow-xl transition-all duration-200 hover:scale-105"
            aria-label="Diapositiva anterior"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 hover:shadow-xl transition-all duration-200 hover:scale-105"
            aria-label="Siguiente diapositiva"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Products Grid */}
          <div
            ref={carouselRef}
            aria-live="polite"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out"
          >
            {visibleProducts.map((product, index) => {
              const countdown = formatCountdown(
                (endTimes[product.id] ?? getOfferEndTime(product.id)) - now
              );
              const badgeType = getBadgeType(product);
              const showLowStock = typeof product.stock === 'number' && product.stock <= 10;

              return (
                <div
                  key={`${product.id}-${currentIndex}-${index}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-red-200 dark:border-red-800/30 flex flex-col h-full"
                >

                  {/* Sale Badge + Stock + Extra Badges */}
                  <div className="relative flex-shrink-0">
                    {/* Left badges column */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        -{product.salePercentage}%
                      </div>

                      {showLowStock && (
                        <div className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-md">
                          Quedan {product.stock}
                        </div>
                      )}

                      {badgeType === 'bestseller' && (
                        <div className="bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-md">
                          Mas vendido
                        </div>
                      )}
                      {badgeType === 'new' && (
                        <div className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-md">
                          Nuevo
                        </div>
                      )}
                    </div>

                    {/* Wishlist Button - Only show if user is logged in */}
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label={wishlist.includes(product.id) ? t('product.removeFromWishlist') : t('product.addToWishlist')}
                      >
                        <svg
                          className={`w-5 h-5 ${wishlist.includes(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                          fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    )}

                    {/* Product Image */}
                    <div
                      className="cursor-pointer"
                      onClick={() => onProductClick(product)}
                    >
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-lg text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => onProductClick(product)}
                      >
                        {product.name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Countdown Timer */}
                      {countdown && (
                        <div className="flex items-center gap-1.5 mb-4">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Termina en</span>
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-8 h-7 rounded bg-red-600 dark:bg-red-700 text-white text-xs font-bold tabular-nums">
                              {countdown.hours}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-bold text-xs">:</span>
                            <span className="inline-flex items-center justify-center w-8 h-7 rounded bg-red-600 dark:bg-red-700 text-white text-xs font-bold tabular-nums">
                              {countdown.minutes}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-bold text-xs">:</span>
                            <span className="inline-flex items-center justify-center w-8 h-7 rounded bg-red-600 dark:bg-red-700 text-white text-xs font-bold tabular-nums">
                              {countdown.seconds}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="mb-4">
                        <PriceDisplay
                          product={product}
                          size="lg"
                          className="text-red-600 dark:text-red-400"
                        />
                      </div>
                    </div>

                    {/* Add to Cart Button - Always at bottom */}
                    {(() => {
                      const state = cartStates[product.id] || 'idle';
                      return (
                        <button
                          onClick={() => handleAddToCartAnimated(product)}
                          disabled={state !== 'idle'}
                          className={`relative w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 mt-auto overflow-hidden ${
                            state === 'done'
                              ? 'bg-emerald-500 text-white scale-[1.03] shadow-lg shadow-emerald-500/30'
                              : state === 'loading'
                              ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white scale-[0.98]'
                              : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                          }`}
                        >
                          {state === 'done' && (
                            <span className="absolute inset-0 animate-ping bg-emerald-400 rounded-xl opacity-20" />
                          )}
                          {state === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : state === 'done' ? (
                            <Check className="w-5 h-5 animate-[bounceIn_0.4s_ease-out]" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L14 18M9 18l5 0" />
                            </svg>
                          )}
                          {state === 'done' ? t('product.addedToCart', 'Añadido') : state === 'loading' ? '' : t('product.addToCart')}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {saleProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-red-500 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Ir a diapositiva ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>

          {/* Timer Indicator */}
          {isAutoScrolling && (
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
              <div className="offers-progress-bar h-full bg-red-500 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
