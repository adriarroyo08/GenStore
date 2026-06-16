import React, { useState } from 'react';
import { Product } from '../types/index';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, ShoppingCart, Star, Package, Check, Loader2, Eye, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ProductQuickView } from './ProductQuickView';
import { useProductComparator } from './ProductComparator';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  isInWishlist?: boolean;
  onToggleWishlist?: (product: Product) => void;
  user?: any;
}

export function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  isInWishlist = false,
  onToggleWishlist,
  user
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { addToCompare, removeFromCompare, isInCompare } = useProductComparator();
  const [cartState, setCartState] = useState<'idle' | 'loading' | 'done'>('idle');
  const inCompare = isInCompare(product.id);

  const hasDiscount = product.onSale && product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const inStock = (product.stock ?? 0) > 0;
  const imageUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
    ? product.image
    : null;

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart || cartState !== 'idle') return;
    setCartState('loading');
    try {
      await Promise.resolve(onAddToCart(product));
      setCartState('done');
      setTimeout(() => {
        setCartState('idle');
      }, 1500);
    } catch {
      setCartState('idle');
    }
  };

  return (
    <>
    <article className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group flex flex-col h-full">
      {/* Image */}
      <div
        className="relative aspect-[4/5] bg-muted/30 cursor-pointer rounded-2xl overflow-hidden"
        onClick={() => onProductClick?.(product)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105${!inStock ? ' opacity-50' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center${!inStock ? ' opacity-50' : ''}`}>
            <Package className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}

        {/* Hover overlay with Vista rapida button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-foreground rounded-full px-5 py-2 text-sm font-medium shadow-lg hover:bg-gray-50">
            Vista rapida
          </button>
        </div>

        {/* Discount badge */}
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-destructive text-white text-xs font-bold px-2.5 py-1">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist */}
        {user && onToggleWishlist && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
            className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-sm hover:scale-110 transition-transform"
            aria-label={isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        )}

        {/* Quick view & compare buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); if (inCompare) { removeFromCompare(product.id); } else { addToCompare(product); } }}
            className={`min-w-[36px] min-h-[36px] p-2 rounded-full shadow-sm transition-all hover:scale-110 ${
              inCompare ? 'bg-primary text-primary-foreground' : 'bg-white/90 dark:bg-black/80'
            }`}
            aria-label={inCompare ? 'Quitar de comparación' : 'Comparar'}
          >
            <ArrowRightLeft className={`w-4 h-4 ${inCompare ? '' : 'text-gray-600 dark:text-gray-300'}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setQuickViewOpen(true); }}
            className="min-w-[36px] min-h-[36px] p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-sm transition-all hover:scale-110"
            aria-label="Vista rápida"
          >
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-muted text-muted-foreground text-xs px-3 py-1">Agotado</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        {/* Category */}
        {product.category && (
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3
          className="text-sm font-medium text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-snug"
          onClick={() => onProductClick?.(product)}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">{product.rating}</span>
            {product.reviews > 0 && (
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + Add to cart */}
        <div className="flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {hasDiscount && product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>

          {inStock && onAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={cartState !== 'idle'}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              {cartState === 'loading' ? 'Añadiendo...' : cartState === 'done' ? '✓ Añadido' : t('product.addToCart')}
            </button>
          )}
        </div>
      </div>
    </article>

    <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <ProductQuickView
          product={product}
          onAddToCart={onAddToCart ? (p, color, colorName) => {
            onAddToCart(p);
          } : undefined}
          onProductClick={onProductClick}
          isInWishlist={isInWishlist}
          onToggleWishlist={onToggleWishlist}
          user={user}
          onClose={() => setQuickViewOpen(false)}
        />
      </DialogContent>
    </Dialog>
    </>
  );
}
