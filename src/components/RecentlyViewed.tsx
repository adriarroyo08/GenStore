import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types/index';
import { useCurrency } from '../contexts/CurrencyContext';
import { ChevronLeft, ChevronRight, Clock, Star, Package } from 'lucide-react';

const STORAGE_KEY = 'genstore_recently_viewed';
const MAX_ITEMS = 12;

/** Save a product ID to recently viewed (localStorage). */
export function trackRecentlyViewed(productId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let ids: string[] = raw ? JSON.parse(raw) : [];
    ids = ids.filter(id => id !== productId);
    ids.unshift(productId);
    if (ids.length > MAX_ITEMS) ids = ids.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

interface RecentlyViewedProps {
  allProducts: Product[];
  onProductClick: (product: Product) => void;
  currentProductId?: string;
}

export function RecentlyViewed({ allProducts, onProductClick, currentProductId }: RecentlyViewedProps) {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      const filtered = ids
        .filter(id => id !== currentProductId)
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean) as Product[];
      setProducts(filtered.slice(0, 8));
    } catch { /* ignore */ }
  }, [allProducts, currentProductId]);

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-8 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Vistos recientemente</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        >
          {products.map((product) => {
            const imageUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
              ? product.image : null;
            const hasDiscount = product.onSale && product.originalPrice && product.originalPrice > product.price;
            return (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="flex-shrink-0 w-40 sm:w-44 bg-card rounded-xl border border-border hover:shadow-md transition-all text-left group"
              >
                <div className="relative aspect-square bg-muted/20 rounded-t-xl overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      -{Math.round((1 - product.price / product.originalPrice!) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug mb-1">{product.name}</p>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-0.5 mb-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-muted-foreground">{product.rating}</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    {hasDiscount && product.originalPrice && (
                      <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                    <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
