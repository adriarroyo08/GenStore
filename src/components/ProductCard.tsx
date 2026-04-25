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

  const [showRipple, setShowRipple] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart || cartState !== 'idle') return;
    setCartState('loading');
    setShowRipple(true);
    try {
      await Promise.resolve(onAddToCart(product));
      setCartState('done');
      setTimeout(() => {
        setCartState('idle');
        setShowRipple(false);
      }, 1500);
    } catch {
      setCartState('idle');
      setShowRipple(false);
    }
  };

  return (
    <>
    <article className={`group bg-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:shadow-black/5 ${
      showRipple ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]' : ''
    }`}>
      {/* Image */}
      <div
        className="relative aspect-square bg-muted/30 cursor-pointer overflow-hidden"
        onClick={() => onProductClick?.(product)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute top-3 left-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 text-xs font-bold px-2 py-1 rounded-lg">
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
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-black text-sm font-medium px-3 py-1 rounded-md">Agotado</span>
          </div>
        )}

        {/* Slide-up add button on hover */}
        {inStock && onAddToCart && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
            <button
              onClick={handleAddToCart}
              disabled={cartState !== 'idle'}
              className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
            >
              {cartState === 'loading' ? 'Añadiendo...' : cartState === 'done' ? '✓ Añadido' : t('product.addToCart')}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        {/* Category */}
        {product.category && (
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3
          className="text-sm font-semibold text-foreground line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-snug"
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
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className={`text-lg font-bold ${hasDiscount ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
              {formatPrice(product.price)}
            </span>
          </div>

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
