import React, { useState } from 'react';
import { Product } from '../types/index';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PriceDisplay } from './PriceDisplay';
import {
  Heart, ShoppingCart, Minus, Plus, Star, Package,
  Check, Loader2, ExternalLink,
} from 'lucide-react';

interface ProductQuickViewProps {
  product: Product;
  onAddToCart?: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  onProductClick?: (product: Product) => void;
  isInWishlist?: boolean;
  onToggleWishlist?: (product: Product) => void;
  user?: any;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  onAddToCart,
  onProductClick,
  isInWishlist = false,
  onToggleWishlist,
  user,
  onClose,
}: ProductQuickViewProps) {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors?.[0]?.name ?? null
  );
  const [cartState, setCartState] = useState<'idle' | 'loading' | 'done'>('idle');

  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const imageUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
    ? product.image
    : null;

  const handleAddToCart = async () => {
    if (!onAddToCart || !inStock || cartState !== 'idle') return;
    setCartState('loading');
    try {
      const colorObj = product.colors?.find(c => c.name === selectedColor);
      for (let i = 0; i < quantity; i++) {
        await Promise.resolve(onAddToCart(product, colorObj?.color, selectedColor ?? undefined));
      }
      setCartState('done');
      setTimeout(() => {
        setCartState('idle');
        onClose();
      }, 1200);
    } catch {
      setCartState('idle');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 max-h-[85vh] overflow-y-auto">
      {/* Image */}
      <div className="relative aspect-square bg-muted/20 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-8"
          />
        ) : (
          <Package className="w-20 h-20 text-muted-foreground/30" />
        )}

        {product.onSale && product.salePercentage && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
            -{product.salePercentage}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5 sm:p-6 flex flex-col gap-3">
        {/* Category */}
        {product.category && (
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        )}

        {/* Price */}
        <PriceDisplay product={product} size="lg" />

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Color options */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedColor === c.name
                    ? 'border-primary ring-2 ring-primary/30 scale-110'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
                aria-label={`Color ${c.name}`}
              />
            ))}
          </div>
        )}

        {/* Quantity */}
        {inStock && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Cantidad:</span>
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 hover:bg-muted transition-colors rounded-l-lg"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="p-1.5 hover:bg-muted transition-colors rounded-r-lg"
                disabled={quantity >= stock}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {inStock ? (
            <button
              onClick={handleAddToCart}
              disabled={cartState !== 'idle'}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                cartState === 'done'
                  ? 'bg-emerald-500 text-white'
                  : cartState === 'loading'
                  ? 'bg-primary/80 text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {cartState === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : cartState === 'done' ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {cartState === 'done' ? 'Agregado' : 'Agregar al Carrito'}
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl font-semibold text-sm text-center bg-muted text-muted-foreground">
              Agotado
            </div>
          )}

          <div className="flex gap-2">
            {user && onToggleWishlist && (
              <button
                onClick={() => onToggleWishlist(product)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors ${
                  isInWishlist
                    ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-current' : ''}`} />
                {isInWishlist ? 'En favoritos' : 'Favoritos'}
              </button>
            )}
            <button
              onClick={() => { onClose(); onProductClick?.(product); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border border-border hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
