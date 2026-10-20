import React, { useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import svgPaths from "../imports/svg-ipgddszaq9";
import { Product, CartItem } from '../App';
import { Header } from './Header';
import { Footer } from './Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { PriceDisplay } from './PriceDisplay';

interface User {
  id: string;
  email: string;
  name?: string;
  access_token: string;
  profile?: any;
}

interface ShoppingCartPageProps {
  cart: CartItem[];
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
}

export function ShoppingCartPage({
  cart,
  user,
  searchQuery,
  setSearchQuery,
  cartItemsCount,
  updateQuantity,
  removeFromCart,
  cartTotal,
  onLoginClick,
  onLogout,
  onBackToHome,
  onContinueShopping,
  onProceedToCheckout,
  products,
  onProductSelect,
  onSearch
}: ShoppingCartPageProps) {
  const { t, language } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleRemoveWithAnimation = useCallback((itemId: string, selectedColor?: string) => {
    const key = `${itemId}-${selectedColor || 'default'}`;
    setRemovingItems(prev => new Set(prev).add(key));
    setTimeout(() => {
      removeFromCart(itemId, selectedColor);
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 400);
  }, [removeFromCart]);

  const convertedCartTotal = cart.reduce((total, item) => total + (convertPrice(item.price) * item.quantity), 0);

  const handleQuantityDecrease = (productId: string, currentQuantity: number, selectedColor?: string) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1, selectedColor);
    }
  };

  const handleQuantityIncrease = (productId: string, currentQuantity: number, stock: number, selectedColor?: string) => {
    if (currentQuantity >= stock) return;
    updateQuantity(productId, currentQuantity + 1, selectedColor);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="relative shrink-0 size-4">
        <svg className="block size-full" fill="none" viewBox="0 0 16 16">
          <path
            d={svgPaths.pf0c8b00}
            stroke={i < Math.floor(rating) ? "#FCD34D" : "var(--color-muted-foreground)"}
            fill={i < Math.floor(rating) ? "#FCD34D" : "none"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.33333"
          />
        </svg>
      </div>
    ));
  };

  const getProductIcon = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return svgPaths.p10c81e80;
      case 'Headphones':
        return svgPaths.p14526700;
      default:
        return svgPaths.p10c81e80;
    }
  };

  const getProductIconColor = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return '#3B82F6';
      case 'Headphones':
        return '#8B5CF6';
      case 'Laptops':
        return '#10B981';
      case 'Gaming':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className="bg-muted min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="text-xl font-semibold tracking-tight mb-2">Tu carrito esta vacio</h2>
            <p className="text-muted-foreground mb-8">Anade productos para empezar</p>
            <button
              onClick={onContinueShopping}
              className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-medium"
            >
              Explorar productos
            </button>
          </div>
        </div>
        <Footer onContactClick={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Cart Content */}
      <section aria-labelledby="cart-heading" className="bg-muted relative shrink-0 w-full">
        <div className="relative size-full">
          <div className="box-border content-stretch flex flex-col gap-10 items-start justify-start px-4 sm:px-6 lg:px-20 py-10 relative w-full">
            
            {/* Cart Header */}
            <div className="box-border content-stretch flex flex-col gap-4 items-start justify-start p-0 relative shrink-0 w-full">
              <h1 id="cart-heading" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground relative shrink-0 w-full">
                {t('cart.title')}
              </h1>
              <div className="font-normal text-lg text-muted-foreground relative shrink-0 w-full">
                {cartItemsCount} {cartItemsCount === 1 ? t('cart.item') : t('cart.itemsInCart')}
              </div>
            </div>

            {/* Cart Main */}
            <div className="grid lg:grid-cols-3 gap-8 w-full">

              {/* Cart Items */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <ul className="flex flex-col gap-6 w-full list-none p-0 m-0">
                {cart.map((item) => {
                  const itemKey = `${item.id}-${item.selectedColor || 'default'}`;
                  const isRemoving = removingItems.has(itemKey);
                  return (
                  <li
                    key={itemKey}
                    className={`bg-card border border-border/50 relative rounded-2xl shrink-0 w-full transition-all duration-300 ease-out ${
                      isRemoving ? 'opacity-0 -translate-x-8 scale-95 max-h-0 overflow-hidden border-transparent mb-0 p-0' : 'opacity-100 translate-x-0 scale-100'
                    }`}
                    style={{ transitionProperty: 'opacity, transform, max-height, margin, padding, border-color' }}
                  >
                    <div className="relative size-full">
                      {/* Removing overlay */}
                      {isRemoving && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 rounded-xl backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-red-500 font-medium">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('cart.removed', 'Eliminado')}
                          </div>
                        </div>
                      )}
                      <div className="box-border content-stretch flex flex-col gap-5 items-start justify-start p-4 relative w-full">
                        <div className="box-border content-stretch flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-start p-0 relative shrink-0 w-full">

                          {/* Item Image */}
                          <div className="bg-muted box-border content-stretch flex flex-row items-center justify-center p-0 relative rounded-xl shrink-0 w-20 h-24 overflow-hidden flex-shrink-0">
                            <div className="relative shrink-0 size-[60px]">
                              <svg className="block size-full" fill="none" viewBox="0 0 60 60" stroke={getProductIconColor(item.category)}>
                                <path
                                  d={getProductIcon(item.category)}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="5"
                                />
                                {item.category === 'Smartphones' && (
                                  <path
                                    d="M30 45H30.025"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="5"
                                  />
                                )}
                              </svg>
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="basis-0 box-border content-stretch flex flex-col gap-3 grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
                            
                            {/* Item Info */}
                            <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full">
                              <div className="text-sm font-medium text-foreground relative shrink-0 w-full">
                                {item.name}
                              </div>
                              {(item as any).variantAttributes && (
                                <p className="text-xs text-muted-foreground">
                                  {Object.entries((item as any).variantAttributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                                </p>
                              )}
                              <div className="font-medium text-sm text-muted-foreground relative shrink-0 w-full">
                                {item.brand} • {item.category}
                                {item.selectedColorName && (
                                  <span> • Color: {item.selectedColorName}</span>
                                )}
                              </div>
                              <div className="box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 relative shrink-0">
                                {renderStars(item.rating)}
                                <div className="font-normal text-sm text-muted-foreground text-nowrap ml-1">
                                  {item.rating}
                                </div>
                              </div>
                            </div>

                            {/* Item Actions */}
                            <div className="box-border content-stretch flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-0 relative shrink-0 w-full">
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-border rounded-full px-1">
                                <button
                                  onClick={() => handleQuantityDecrease(item.id, item.quantity, item.selectedColor)}
                                  aria-label="Reducir cantidad"
                                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-sm"
                                >
                                  <div className="relative shrink-0 size-3.5">
                                    <svg
                                      className="block size-full text-muted-foreground"
                                      fill="none"
                                      viewBox="0 0 14 14"
                                      stroke="currentColor"
                                    >
                                      <path
                                        d="M2.91667 7H11.0833"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.16667"
                                      />
                                    </svg>
                                  </div>
                                </button>
                                <div className="flex items-center justify-center w-8">
                                  <div className="font-semibold text-sm text-foreground text-nowrap">
                                    {item.quantity}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleQuantityIncrease(item.id, item.quantity, item.stock, item.selectedColor)}
                                  disabled={item.quantity >= item.stock}
                                  aria-label="Aumentar cantidad"
                                  className={`w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-sm ${item.quantity >= item.stock ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <div className="relative shrink-0 size-3.5">
                                    <svg
                                      className="block size-full text-muted-foreground"
                                      fill="none"
                                      viewBox="0 0 14 14"
                                      stroke="currentColor"
                                    >
                                      <path
                                        d="M2.91667 7H11.0833"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.16667"
                                      />
                                      <path
                                        d="M7 2.91667V11.0833"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.16667"
                                      />
                                    </svg>
                                  </div>
                                </button>
                              </div>

                              {/* Price Info */}
                              <div className="box-border content-stretch flex flex-col gap-2 items-end justify-start p-0 relative shrink-0">
                                <div className="font-bold text-lg sm:text-xl text-foreground text-nowrap">
                                  <PriceDisplay 
                                    product={{
                                      ...item,
                                      price: item.price * item.quantity,
                                      originalPrice: item.originalPrice ? item.originalPrice * item.quantity : undefined
                                    }} 
                                    size="base"
                                    className="text-right"
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveWithAnimation(item.id, item.selectedColor)}
                                  disabled={isRemoving}
                                  aria-label={`Eliminar ${item.name} del carrito`}
                                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center relative shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 16 16"
                                    stroke="currentColor"
                                  >
                                    <path
                                      d="M4 4L12 12M12 4L4 12"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.5"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  );
                })}
                </ul>

                {/* Continue Shopping */}
                <button
                  onClick={onContinueShopping}
                  className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="relative shrink-0 size-5">
                    <svg className="block size-full text-blue-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                      <path
                        d={svgPaths.p33f6b680}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M15.8333 10H4.16667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                    </svg>
                  </div>
                  <div className="font-semibold text-base text-blue-500 text-nowrap">
                    {t('cart.continueShopping')}
                  </div>
                </button>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1 rounded-2xl border border-border/50 bg-card p-6 lg:sticky lg:top-24 flex flex-col gap-4 sm:gap-6 items-start justify-start h-fit">
                <div className="font-bold text-xl sm:text-2xl text-foreground relative shrink-0 w-full">
                  {t('cart.orderSummary')}
                </div>

                {/* Toggle button visible only on mobile */}
                <button
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  className="sm:hidden w-full flex items-center justify-between p-4 bg-muted rounded-xl mb-3 min-h-[44px]"
                >
                  <span className="font-semibold text-sm">Resumen del pedido</span>
                  <svg className={`w-5 h-5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`sm:block w-full ${summaryOpen ? 'block' : 'hidden'}`}>
                {/* Summary Details */}
                <div className="box-border content-stretch flex flex-col gap-4 items-start justify-start p-0 relative shrink-0 w-full">
                  <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 text-base w-full">
                    <div className="font-medium text-muted-foreground">
                      {cartItemsCount === 1 ? t('cart.subtotalItem').replace('{count}', cartItemsCount.toString()) : t('cart.subtotalItems').replace('{count}', cartItemsCount.toString())}
                    </div>
                    <div className="font-semibold text-foreground text-nowrap">
                      {formatPrice(convertedCartTotal)}
                    </div>
                  </div>

                  <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 text-base w-full">
                    <div className="font-medium text-muted-foreground">
                      {t('cart.shipping')}
                    </div>
                    <div className="font-semibold text-blue-600 text-nowrap">
                      {t('cart.free')}
                    </div>
                  </div>

                  <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 text-sm w-full">
                    <div className="font-medium text-muted-foreground italic">
                      {language === 'es' ? 'IVA calculado al finalizar la compra' : 'Tax calculated at checkout'}
                    </div>
                  </div>

                  <div className="bg-border h-px shrink-0 w-full" />

                  <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 text-foreground w-full" aria-live="polite">
                    <div className="text-lg font-bold">
                      {t('cart.total')}
                    </div>
                    <div className="text-lg font-bold text-nowrap">
                      {formatPrice(convertedCartTotal)}
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={onProceedToCheckout}
                  className="rounded-full bg-primary text-primary-foreground py-4 w-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {t('cart.proceedToCheckout')}
                </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer onContactClick={() => {}} />
    </div>
  );
}