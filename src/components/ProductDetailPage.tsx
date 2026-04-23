import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types/index';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { ProductReviews } from './ProductReviews';
import { ProductCard } from './ProductCard';
import { PriceDisplay } from './PriceDisplay';
import { ImageZoom } from './ImageZoom';
import { ImageLightbox } from './ImageLightbox';
import { RecentlyViewed, trackRecentlyViewed } from './RecentlyViewed';
import {
  ChevronLeft, ChevronRight, Heart, ShoppingCart, Zap,
  Star, Package, Truck, ShieldCheck, RotateCcw, Minus, Plus,
  Check, Loader2, Expand, Bell,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  access_token: string;
  profile?: any;
}

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  cart: CartItem[];
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  cartItemsCount: number;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
  onBackToCatalog: () => void;
  onCartClick: () => void;
  onCheckoutClick?: () => void;
  onProductSelect: (product: Product) => void;
  onNavigateToProduct: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  onSearch: (query: string) => void;
}

export function ProductDetailPage({
  product,
  allProducts,
  cart,
  user,
  onAddToCart,
  onBackToHome,
  onBackToCatalog,
  onCheckoutClick,
  onNavigateToProduct,
  wishlist,
  onToggleWishlist,
}: ProductDetailPageProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [cartState, setCartState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'loading' | 'done'>('idle');

  // Images
  const images = useMemo(() => {
    const imgs = [product.image, ...(product.additionalImages ?? [])];
    return imgs.filter(img => img && (img.startsWith('http') || img.startsWith('data:')));
  }, [product.image, product.additionalImages]);

  // Related products (same category)
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  // "Others also viewed" — similar price range, different category, high rated
  const alsoViewedProducts = useMemo(() => {
    const priceRange = product.price * 0.4;
    return allProducts
      .filter(p =>
        p.id !== product.id &&
        p.category !== product.category &&
        Math.abs(p.price - product.price) <= priceRange &&
        p.rating >= 3
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  }, [allProducts, product]);

  // Stock
  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const lowStock = stock > 0 && stock <= 10;
  const isInWishlist = wishlist.includes(product.id);

  // Reset state and scroll to top when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(inStock ? 1 : 0);
    setSelectedColor(product.colors?.[0]?.name ?? null);
    setSelectedTab('description');
    trackRecentlyViewed(product.id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [product.id]);

  const handleAddToCart = async () => {
    if (!inStock || cartState !== 'idle') return;
    setCartState('loading');
    try {
      const colorObj = product.colors?.find(c => c.name === selectedColor);
      for (let i = 0; i < quantity; i++) {
        await Promise.resolve(onAddToCart(product, colorObj?.color, selectedColor ?? undefined));
      }
      setCartState('done');
      setTimeout(() => setCartState('idle'), 2000);
    } catch {
      setCartState('idle');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    onCheckoutClick?.();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <nav className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={onBackToHome} className="hover:text-foreground transition-colors">Inicio</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={onBackToCatalog} className="hover:text-foreground transition-colors">Catalogo</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ===== LEFT: Image gallery ===== */}
          <div className="space-y-3">
            {/* Main image with zoom */}
            <div className="relative aspect-square bg-muted/20 rounded-2xl border border-border overflow-hidden group">
              {images.length > 0 ? (
                <ImageZoom
                  src={images[selectedImageIndex]}
                  alt={`${product.name} - Imagen ${selectedImageIndex + 1}`}
                  className="w-full h-full"
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}

              {/* Fullscreen button */}
              {images.length > 0 && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/80 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Ver en pantalla completa"
                >
                  <Expand className="w-4 h-4" />
                </button>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-black/80 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-black/80 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {product.onSale && product.salePercentage && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                  -{product.salePercentage}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 min-w-[44px] min-h-[44px] rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      i === selectedImageIndex ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== RIGHT: Product info ===== */}
          <div className="flex flex-col gap-5">
            {/* Category + Brand */}
            <div className="flex items-center gap-2">
              {product.category && (
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium bg-muted px-2 py-1 rounded">
                  {product.category}
                </span>
              )}
              {product.brand && (
                <span className="text-xs text-muted-foreground">{product.brand}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} {t('product.reviews').toLowerCase()})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <PriceDisplay product={product} size="xl" />
            </div>

            {/* Short description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base line-clamp-3">
                {product.description}
              </p>
            )}

            <hr className="border-border" />

            {/* Color options */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Color: <span className="text-muted-foreground font-normal">{selectedColor}</span>
                </label>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                        // Try to find an image matching this color name
                        const colorLower = c.name.toLowerCase();
                        const matchIdx = images.findIndex(img => img.toLowerCase().includes(colorLower));
                        if (matchIdx >= 0) setSelectedImageIndex(matchIdx);
                      }}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        selectedColor === c.name ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: c.color || c.value }}
                      title={c.name}
                      aria-label={`Color: ${c.name}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Cantidad</label>
                <span className={`text-sm ${lowStock ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                  {!inStock ? 'Agotado' : lowStock ? `Solo ${stock} disponibles` : `${stock} en stock`}
                </span>
              </div>
              <div className="inline-flex items-center border border-border rounded-lg bg-card">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !inStock}
                  className="p-2.5 hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Reducir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock || !inStock}
                  className="p-2.5 hover:bg-muted transition-colors disabled:opacity-40"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartState === 'loading'}
                className={`hidden sm:flex w-full items-center justify-center gap-2 h-12 rounded-xl font-semibold text-base transition-all duration-200 shadow-sm disabled:cursor-not-allowed ${
                  cartState === 'done'
                    ? 'bg-emerald-500 text-white scale-[1.02]'
                    : cartState === 'loading'
                    ? 'bg-primary/80 text-primary-foreground'
                    : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-50'
                }`}
              >
                {cartState === 'loading' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Agregando...</>
                ) : cartState === 'done' ? (
                  <><Check className="w-5 h-5" /> Agregado al carrito</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> {t('product.addToCart')}</>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock || cartState === 'loading'}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Zap className="w-5 h-5" />
                {t('product.buyNow')}
              </button>
              {user && (
                <button
                  onClick={() => onToggleWishlist(product)}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  {isInWishlist ? 'En favoritos' : 'Agregar a favoritos'}
                </button>
              )}
            </div>

            {/* Notify when available */}
            {!inStock && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Avísame cuando esté disponible</span>
                </div>
                {notifyState === 'done' ? (
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Te avisaremos cuando vuelva a estar en stock
                  </p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!notifyEmail.trim()) return;
                      setNotifyState('loading');
                      setTimeout(() => setNotifyState('done'), 1000);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={notifyState === 'loading'}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {notifyState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notificar'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Contextual shipping & trust info */}
            <div className="space-y-2 pt-2">
              {/* Dynamic shipping highlight */}
              {product.price >= 50 ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Envío gratis en este producto</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Envío gratis a partir de 50€ — te faltan {formatPrice(50 - product.price)}
                  </span>
                </div>
              )}
              {/* Low stock warning */}
              {lowStock && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/30">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">¡Solo quedan {stock} unidades!</span>
                </div>
              )}
              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
                <div className="flex flex-col items-center gap-1 text-center p-3 rounded-lg bg-muted/40">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs leading-tight text-muted-foreground">Entrega 2-4 días</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center p-3 rounded-lg bg-muted/40">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs leading-tight text-muted-foreground">Garantía 1 año</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center p-3 rounded-lg bg-muted/40">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs leading-tight text-muted-foreground">Devolución 14 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="border-t border-border bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Tab navigation */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
            <div className="flex gap-6 border-b border-border min-w-max sm:min-w-0">
              {(['description', 'specs', 'reviews'] as const).map((tab) => {
                const labels = {
                  description: t('product.description'),
                  specs: t('product.specifications'),
                  reviews: `${t('product.reviews')} (${product.reviews})`,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                      selectedTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          {selectedTab === 'description' && (
            <div className="max-w-none">
              <p className="text-foreground leading-relaxed">{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{t('product.keyFeatures')}</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-semibold mb-3">{t('product.generalSpecs')}</h3>
                <dl className="space-y-2 text-sm">
                  {product.brand && (
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <dt className="text-muted-foreground">{t('product.brand')}</dt>
                      <dd className="font-medium">{product.brand}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <dt className="text-muted-foreground">{t('product.category')}</dt>
                    <dd className="font-medium">{product.category}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-base font-semibold mb-3">{t('product.availability')}</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <dt className="text-muted-foreground">Stock</dt>
                    <dd className={`font-medium ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>{inStock ? `${stock} ${language === 'es' ? 'uds.' : 'units'}` : t('product.outOfStock')}</dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <dt className="text-muted-foreground">{t('product.shipping')}</dt>
                    <dd className="font-medium">{t('product.freeShipping')}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {selectedTab === 'reviews' && (
            <ProductReviews product={product} user={user} />
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-xl font-bold mb-6">{t('product.relatedProducts')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onProductClick={onNavigateToProduct}
                  isInWishlist={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  user={user}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Others also viewed */}
      {alsoViewedProducts.length > 0 && (
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-xl font-bold mb-6">Otros clientes también vieron</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {alsoViewedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onProductClick={onNavigateToProduct}
                  isInWishlist={wishlist.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  user={user}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently viewed */}
      <RecentlyViewed
        allProducts={allProducts}
        onProductClick={onNavigateToProduct}
        currentProductId={product.id}
      />

      {/* Sticky CTA en móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border p-3 sm:hidden">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || cartState === 'loading'}
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold min-h-[48px] transition-colors disabled:cursor-not-allowed ${
            cartState === 'done'
              ? 'bg-emerald-500 text-white'
              : cartState === 'loading'
              ? 'bg-primary/80 text-primary-foreground'
              : inStock
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50'
              : 'bg-muted text-muted-foreground opacity-50'
          }`}
        >
          {cartState === 'loading' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Agregando...</>
          ) : cartState === 'done' ? (
            <><Check className="w-5 h-5" /> Agregado al carrito</>
          ) : inStock ? (
            `Añadir al carrito — ${formatPrice(product.price)}`
          ) : (
            'Sin stock'
          )}
        </button>
      </div>
      {/* Espaciado para que el sticky no tape el contenido */}
      <div className="h-20 sm:hidden" />

      {/* Image lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
          onChangeIndex={setSelectedImageIndex}
          alt={product.name}
        />
      )}
    </div>
  );
}
