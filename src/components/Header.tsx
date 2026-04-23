import React, { useState, useRef, useEffect, useCallback } from "react";
import svgPaths from "../imports/svg-vnih5l184e";
import { Product, CartItem } from "../App";
import { SearchDropdown } from "./SearchDropdown";
import { LanguageSelector } from "./LanguageSelector";
import { CurrencySelector } from "./CurrencySelector";
import { ThemeSelector } from "./ThemeSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { NotificationBell } from "./Notifications/NotificationBell";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cartRef.current &&
        !cartRef.current.contains(event.target as Node)
      ) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const handleLogoClick = () => {
    onHomeClick();
  };

  // Helper function to determine if we're on a profile-related page
  const isProfilePage = () => {
    const profilePages = ['account', 'orders', 'addresses', 'settings', 'rewards', 'wishlist'];
    return currentPage ? profilePages.includes(currentPage) : false;
  };

  // Check if user is admin based on email (temporarily for the demo)
  const isAdmin = user?.email === 'admin@genstore.com' || user?.email === 'adriarroyo2002@gmail.com' || user?.profile?.isAdmin === true || user?.profile?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border shadow-sm py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between relative">
          {/* Logo Section */}
          <div className="flex items-center gap-1 xxs:gap-2 sm:gap-3 flex-shrink-0 z-10">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-1 xxs:gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
            <div className="bg-emerald-500 dark:bg-emerald-600 p-1.5 xxs:p-2 sm:p-3 rounded-lg xxs:rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 xxs:w-5 xxs:h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="GenStore logo"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div className="header-logo-responsive flex flex-col">
              <h1 className="font-bold text-foreground text-xs xxs:text-sm xs:text-base sm:text-xl lg:text-2xl leading-tight">
                GenStore
              </h1>
              <span className="text-xs xxs:text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium hidden sm:block">
                Tu tienda online
              </span>
            </div>
            </button>
          </div>

          {/* Search Bar - Centered with maximum available space */}
          <div className="xxs:absolute xxs:left-1/2 xxs:transform xxs:-translate-x-1/2 xxs:w-32 xs:static xs:transform-none xs:w-auto header-search-responsive flex-1 max-w-sm sm:max-w-xl lg:max-w-2xl mx-2 sm:mx-6 lg:mx-10 z-5">
            <SearchDropdown
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              products={products}
              onProductSelect={onProductSelect}
              onSearch={onSearch}
            />
          </div>

          {/* Right Side Actions */}
          <nav aria-label="Navegación principal" className="header-nav-responsive flex items-center flex-shrink-0 z-10">
            {/* Language Selector - Hidden on mobile */}
            <div className="hidden lg:block">
              <LanguageSelector />
            </div>

            {/* Currency Selector - Hidden on mobile */}
            <div className="hidden lg:block">
              <CurrencySelector />
            </div>

            {/* Theme Selector - Hidden on small screens */}
            <div className="hidden md:block">
              <ThemeSelector />
            </div>

            {/* Notifications */}
            {user && (
              <NotificationBell
                user={user}
                onNotificationClick={(n) => {
                  const orderId = n.data?.orderId as string;
                  if (orderId && onTrackOrder) onTrackOrder(orderId);
                }}
              />
            )}

            {/* Wishlist - Only show when user is logged in */}
            {user && onWishlistClick && (
              <button
                onClick={onWishlistClick}
                aria-label="Lista de deseos"
                className="header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5 xxs:w-6 xxs:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 xxs:-top-2 -right-1 xxs:-right-2 bg-emerald-500 dark:bg-emerald-600 text-white text-xs rounded-full w-4 h-4 xxs:w-5 xxs:h-5 flex items-center justify-center text-xs">
                      {wishlist.length > 99 ? '99+' : wishlist.length}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline font-medium text-sm">
                  {t("wishlist.title")}
                </span>
              </button>
            )}

            {/* Cart */}
            <div className="relative" ref={cartRef}>
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                aria-label={cartItemsCount > 0 ? `Carrito de compras (${cartItemsCount} artículos)` : "Carrito de compras"}
                aria-expanded={isCartOpen}
                aria-controls="cart-dropdown"
                aria-haspopup="true"
                className={`header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-all duration-300 ${
                  cartBounce ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <div className={`relative transition-transform duration-300 ${cartBounce ? 'scale-125' : ''}`}>
                  <svg
                    className={`w-5 h-5 xxs:w-6 xxs:h-6 transition-transform duration-300 ${cartBounce ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={svgPaths.p33c1b680}
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={svgPaths.pd438b00}
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={svgPaths.p2fb16300}
                    />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className={`absolute -top-1 xxs:-top-2 -right-1 xxs:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 xxs:w-5 xxs:h-5 flex items-center justify-center transition-all duration-300 ${
                      cartBounce ? 'scale-150 bg-emerald-500 shadow-lg shadow-emerald-500/50' : ''
                    }`}>
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline font-medium text-sm">
                  {t("header.cart")}
                </span>
              </button>

              {/* Cart Dropdown */}
              {isCartOpen && (
                <div id="cart-dropdown" className="absolute right-0 mt-2 w-64 xxs:w-72 sm:w-80 lg:w-96 bg-card rounded-lg shadow-lg border border-border z-50 modal-responsive">
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-4 text-foreground">
                      {t("header.cart")}
                    </h3>
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <svg
                            className="w-16 h-16 mx-auto text-muted-foreground/50 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m0 0h9M9 19v.01M20 19v.01"
                            />
                          </svg>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {t("cart.empty")}
                        </p>
                        <button
                          onClick={() => {
                            setIsCartOpen(false);
                            if (onCatalogClick) {
                              onCatalogClick();
                            }
                          }}
                          className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          {t("cart.goToCatalog")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cart.map((item) => (
                            <div
                              key={`${item.id}-${item.selectedColor || "default"}`}
                              className="flex items-center gap-3 p-2 border border-border rounded-lg"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {formatPrice(item.price)}
                                </p>
                                {item.selectedColorName && (
                                  <p className="text-muted-foreground text-xs">
                                    Color:{" "}
                                    {item.selectedColorName}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity - 1,
                                      item.selectedColor,
                                    )
                                  }
                                  aria-label={`Reducir cantidad de ${item.name}`}
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <span className="w-8 text-center text-sm text-foreground">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity + 1,
                                      item.selectedColor,
                                    )
                                  }
                                  aria-label={`Aumentar cantidad de ${item.name}`}
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4L5 9m0 0h9"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.id,
                                    item.selectedColor,
                                  )
                                }
                                aria-label={`Eliminar ${item.name} del carrito`}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border pt-4 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-foreground">
                              {t("cart.total")}:
                            </span>
                            <span className="font-bold text-lg text-foreground">
                              {formatPrice(
                                cart.reduce(
                                  (total, item) =>
                                    total +
                                    convertPrice(item.price) *
                                      item.quantity,
                                  0,
                                ),
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setIsCartOpen(false);
                              if (onCheckoutClick) {
                                onCheckoutClick();
                              }
                            }}
                            className="w-full bg-emerald-500 dark:bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                          >
                            {t("cart.proceedToCheckout")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account - Direct link to profile */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => onAccountClick?.()}
                  aria-label="Mi cuenta"
                  className={`header-nav-item-responsive flex items-center gap-1 xxs:gap-2 rounded-lg transition-colors ${
                    isProfilePage()
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent'
                  }`}
                >
                  <div className={`w-6 h-6 xxs:w-8 xxs:h-8 ${isAdmin ? 'bg-orange-500 dark:bg-orange-600' : 'bg-emerald-500 dark:bg-emerald-600'} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105`}>
                    <span className="text-white text-xs xxs:text-sm font-medium">
                      {((user as any).username || user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline font-medium text-sm truncate max-w-24">
                    {(user as any).username || user.name || user.email}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onLoginClick}
                  aria-label="Mi cuenta"
                  className="header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 xxs:w-6 xxs:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium hidden sm:inline text-sm">
                    {t("auth.login")}
                  </span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}