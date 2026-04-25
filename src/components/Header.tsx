import React, { useState, useRef, useEffect, useCallback } from "react";
import { Menu, ShoppingBag, Heart, User as UserIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Product, CartItem } from "../App";
import { SearchDropdown } from "./SearchDropdown";
import { LanguageSelector } from "./LanguageSelector";
import { CurrencySelector } from "./CurrencySelector";
import { ThemeSelector } from "./ThemeSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { NotificationBell } from "./Notifications/NotificationBell";
import { GenStoreLogo } from "./GenStoreLogo";

interface User {
  id: string;
  email: string;
  name?: string;
  access_token: string;
  profile?: any;
}

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  cartTotal: number;
  user: User | null;
  wishlist?: string[];
  onLoginClick: () => void;
  onLogout: () => void;
  onHomeClick: () => void;
  onCartClick?: () => void;
  onCheckoutClick?: () => void;
  onAccountClick?: () => void;
  onCatalogClick?: () => void;
  onWishlistClick?: () => void;
  onSettingsClick?: () => void;
  onOrdersClick?: () => void;
  onPaymentMethodsClick?: () => void;
  onRewardsClick?: () => void;
  onAddressesClick?: () => void;
  onProductDatabaseClick?: () => void;
  onTrackOrder?: (orderId: string) => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  currentPage?: string;
}

export function Header({
  searchQuery,
  setSearchQuery,
  cartItemsCount,
  cart,
  updateQuantity,
  removeFromCart,
  cartTotal,
  user,
  wishlist = [],
  onLoginClick,
  onLogout,
  onHomeClick,
  onCartClick,
  onCheckoutClick,
  onAccountClick,
  onCatalogClick,
  onWishlistClick,
  onSettingsClick,
  onOrdersClick,
  onPaymentMethodsClick,
  onRewardsClick,
  onAddressesClick,
  onProductDatabaseClick,
  onTrackOrder,
  products,
  onProductSelect,
  onSearch,
  currentPage,
}: HeaderProps) {
  const { t } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevCartCount = useRef(cartItemsCount);
  const cartRef = useRef<HTMLDivElement>(null);

  // Animate cart badge when items are added
  useEffect(() => {
    if (cartItemsCount > prevCartCount.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartItemsCount;
  }, [cartItemsCount]);

  const handleLogoClick = () => {
    onHomeClick();
  };

  // Check if user is admin based on email (temporarily for the demo)
  const isAdmin = user?.email === 'admin@genstore.com' || user?.email === 'adriarroyo2002@gmail.com' || user?.profile?.isAdmin === true || user?.profile?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
          >
            <GenStoreLogo size={32} />
            <span className="hidden md:inline font-semibold text-base text-foreground">GenStore</span>
          </button>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={onHomeClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.home')}
            </button>
            <button
              onClick={onCatalogClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.catalog')}
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">

            {/* Search - hidden on very small screens */}
            <div className="hidden sm:block w-48 lg:w-64">
              <SearchDropdown
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                products={products}
                onProductSelect={onProductSelect}
                onSearch={onSearch}
              />
            </div>

            {/* Theme Selector - desktop only */}
            <div className="hidden lg:block">
              <ThemeSelector />
            </div>

            {/* Notifications - desktop, logged in only */}
            {user && (
              <NotificationBell
                user={user}
                onNotificationClick={(n) => {
                  const orderId = n.data?.orderId as string;
                  if (orderId && onTrackOrder) onTrackOrder(orderId);
                }}
              />
            )}

            {/* Wishlist - logged in only */}
            {user && onWishlistClick && (
              <button
                onClick={onWishlistClick}
                aria-label="Lista de deseos"
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {wishlist.length > 99 ? '99+' : wishlist.length}
                  </span>
                )}
              </button>
            )}

            {/* Cart */}
            <button
              onClick={onCartClick}
              aria-label={cartItemsCount > 0 ? `Carrito de compras (${cartItemsCount} artículos)` : "Carrito de compras"}
              className={`relative p-2 text-muted-foreground hover:text-foreground transition-colors`}
            >
              <ShoppingBag className={`w-5 h-5 transition-transform duration-300 ${cartBounce ? 'scale-125' : ''}`} />
              {cartItemsCount > 0 && (
                <span className={`absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none transition-all duration-300 ${
                  cartBounce ? 'scale-150 shadow-lg shadow-blue-500/50' : ''
                }`}>
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>

            {/* Account */}
            {user ? (
              <button
                onClick={() => onAccountClick?.()}
                aria-label="Mi cuenta"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {((user as any).username || user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                aria-label="Mi cuenta"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Menu (hamburger) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Abrir menú"
                  className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-8">
                <div className="flex flex-col gap-1 mt-4">

                  {/* Nav links */}
                  <button
                    onClick={() => { onHomeClick(); setIsMobileMenuOpen(false); }}
                    className="text-left text-base font-medium py-2 border-b border-border text-foreground hover:text-blue-600 transition-colors"
                  >
                    {t('nav.home')}
                  </button>
                  <button
                    onClick={() => { onCatalogClick?.(); setIsMobileMenuOpen(false); }}
                    className="text-left text-base font-medium py-2 border-b border-border text-foreground hover:text-blue-600 transition-colors"
                  >
                    {t('nav.catalog')}
                  </button>

                  {/* Search on mobile */}
                  <div className="py-3 border-b border-border sm:hidden">
                    <SearchDropdown
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      products={products}
                      onProductSelect={(p) => { onProductSelect(p); setIsMobileMenuOpen(false); }}
                      onSearch={(q) => { onSearch(q); setIsMobileMenuOpen(false); }}
                    />
                  </div>

                  {/* Settings */}
                  <div className="py-2 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-1">Ajustes</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <ThemeSelector />
                      <LanguageSelector />
                      <CurrencySelector />
                    </div>
                  </div>

                  {/* Account actions */}
                  {user ? (
                    <>
                      {onSettingsClick && (
                        <button
                          onClick={() => { onSettingsClick(); setIsMobileMenuOpen(false); }}
                          className="text-left text-base font-medium py-2 border-b border-border text-foreground hover:text-blue-600 transition-colors"
                        >
                          {t('nav.settings') || 'Configuración'}
                        </button>
                      )}
                      {onOrdersClick && (
                        <button
                          onClick={() => { onOrdersClick(); setIsMobileMenuOpen(false); }}
                          className="text-left text-base font-medium py-2 border-b border-border text-foreground hover:text-blue-600 transition-colors"
                        >
                          {t('nav.orders') || 'Pedidos'}
                        </button>
                      )}
                      {isAdmin && onProductDatabaseClick && (
                        <button
                          onClick={() => { onProductDatabaseClick(); setIsMobileMenuOpen(false); }}
                          className="text-left text-base font-medium py-2 border-b border-border text-foreground hover:text-blue-600 transition-colors"
                        >
                          Admin
                        </button>
                      )}
                      <button
                        onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                        className="text-left text-base font-medium py-2 text-red-600 hover:text-red-700 transition-colors mt-2"
                      >
                        {t('auth.logout') || 'Cerrar sesión'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                      className="text-left text-base font-medium py-2 text-blue-600 hover:text-blue-700 transition-colors mt-2"
                    >
                      {t('auth.login')}
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </div>
    </header>
  );
}
