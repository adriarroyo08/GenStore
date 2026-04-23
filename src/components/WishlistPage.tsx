import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { AccountLayout } from './AccountLayout';
import { Product } from '../types';
import { Heart, ShoppingCart, Trash2, Star, ShoppingBag, ArrowRight, ShoppingBasket, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface WishlistPageProps {
  user: any;
  wishlist: string[];
  products: Product[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  onClearWishlist: () => void;
  onBackToAccount: () => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
  onCartClick: () => void;
  onCatalogClick: () => void;
  onProductSelect: (product: Product) => void;
  onLogout: () => void;
}

export function WishlistPage({
  user,
  wishlist,
  products,
  onToggleWishlist,
  onAddToCart,
  onClearWishlist,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick,
  onCatalogClick,
  onProductSelect,
  onLogout
}: WishlistPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Track add-to-cart animation state per product: 'idle' | 'loading' | 'done'
  const [cartStates, setCartStates] = useState<Record<string, 'idle' | 'loading' | 'done'>>({});
  const [addAllState, setAddAllState] = useState<'idle' | 'loading' | 'done'>('idle');

  const getCartState = (id: string) => cartStates[id] || 'idle';

  const handleAddToCartAnimated = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const id = product.id;
    if (getCartState(id) !== 'idle') return;

    setCartStates(prev => ({ ...prev, [id]: 'loading' }));

    // Simulate brief loading then trigger
    setTimeout(() => {
      onAddToCart(product);
      setCartStates(prev => ({ ...prev, [id]: 'done' }));
      setTimeout(() => {
        setCartStates(prev => ({ ...prev, [id]: 'idle' }));
      }, 1800);
    }, 400);
  }, [onAddToCart]);

  const wishlistProducts = wishlist
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const count = wishlistProducts.length;
  const availableProducts = wishlistProducts.filter(p => (p.stock ?? 0) > 0);
  const totalPrice = availableProducts.reduce((sum, p) => sum + p.price, 0);

  const handleAddAllToCart = () => {
    if (addAllState !== 'idle') return;
    setAddAllState('loading');
    setTimeout(() => {
      availableProducts.forEach(p => onAddToCart(p));
      setAddAllState('done');
      setTimeout(() => setAddAllState('idle'), 1800);
    }, 500);
  };

  return (
    <AccountLayout
      user={user}
      currentPage="wishlist"
      onProfileClick={onProfileClick}
      onOrdersClick={onOrdersClick}
      onAddressesClick={onAddressesClick}
      onPaymentMethodsClick={onPaymentMethodsClick}
      onWishlistClick={onWishlistClick}
      onRewardsClick={onRewardsClick}
      onSettingsClick={onSettingsClick}
      onAdminClick={onAdminClick}
      onLogout={onLogout}
      pageTitle={t('wishlist.title')}
      pageDescription={count === 0
        ? t('wishlist.emptyDescription')
        : `${count} ${count === 1 ? t('wishlist.itemSingular') : t('wishlist.itemPlural')}`
      }
    >
      {count === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('wishlist.empty')}
          </h3>
          <p className="text-muted-foreground text-center max-w-sm mb-8">
            {t('wishlist.emptyDescription')}
          </p>
          <Button onClick={onCatalogClick} className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            {t('wishlist.startShopping')}
          </Button>
        </div>
      ) : (
        /* ── Wishlist content ── */
        <div className="space-y-4">
          {/* Summary bar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {availableProducts.length} {t('wishlist.availableItems')}
                <span className="mx-1.5 text-border">|</span>
                <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
            </div>
            <Button
              size="sm"
              className={`gap-1.5 transition-all duration-300 ${
                addAllState === 'done'
                  ? 'bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-500'
                  : addAllState === 'loading'
                  ? 'opacity-80'
                  : ''
              }`}
              disabled={availableProducts.length === 0 || addAllState !== 'idle'}
              onClick={handleAddAllToCart}
            >
              {addAllState === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : addAllState === 'done' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ShoppingBasket className="w-3.5 h-3.5" />
              )}
              {addAllState === 'done'
                ? t('wishlist.addedAll')
                : t('wishlist.addAllToCart')}
            </Button>
          </motion.div>

          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={onClearWishlist}>
              <Trash2 className="w-3.5 h-3.5" />
              {t('wishlist.clearWishlist')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onCatalogClick}>
              {t('wishlist.continueShopping')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {wishlistProducts.map((product, idx) => {
              const hasDiscount = product.originalPrice && product.originalPrice > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                : 0;
              const outOfStock = product.stock !== undefined && product.stock <= 0;
              const state = getCartState(product.id);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex flex-col"
                  onClick={() => onProductSelect(product)}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTcwIDEwMEgxMzAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
                      }}
                    />
                    {hasDiscount && (
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{discountPct}%
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/80 dark:bg-black/50 text-red-500 hover:bg-white dark:hover:bg-black/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={t('wishlist.removeFromWishlist')}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-3 gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-2 text-xs sm:text-sm leading-snug">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                      )}
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-foreground">{product.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-bold text-foreground text-sm">
                        {formatPrice(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.originalPrice!)}
                        </span>
                      )}
                      {outOfStock && (
                        <span className="text-xs text-destructive font-medium w-full">
                          {t('wishlist.outOfStock')}
                        </span>
                      )}
                    </div>

                    {/* Add to cart */}
                    <Button
                      size="sm"
                      variant={state === 'done' ? 'default' : 'outline'}
                      className={`w-full gap-1.5 text-xs relative overflow-hidden transition-all duration-300 min-h-[44px] ${
                        state === 'done'
                          ? 'bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                          : state === 'loading'
                          ? 'border-primary/50 scale-95'
                          : ''
                      }`}
                      disabled={outOfStock || state !== 'idle'}
                      onClick={(e) => handleAddToCartAnimated(e, product)}
                    >
                      {state === 'done' && (
                        <motion.span
                          className="absolute inset-0 bg-emerald-400 rounded-md"
                          initial={{ scale: 0, opacity: 0.4 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                      <AnimatePresence mode="wait">
                        {state === 'loading' ? (
                          <motion.span key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </motion.span>
                        ) : state === 'done' ? (
                          <motion.span key="done" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                            <Check className="w-3.5 h-3.5" />
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <span className="relative z-10">
                        {state === 'done' ? t('wishlist.added') : t('wishlist.addToCart')}
                      </span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
