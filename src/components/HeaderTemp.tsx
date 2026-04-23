import React, { useState, useRef, useEffect } from "react";
import svgPaths from "../imports/svg-vnih5l184e";
import { Product, CartItem } from "../App";
import { SearchDropdown } from "./SearchDropdown";
import { LanguageSelector } from "./LanguageSelector";
import { CurrencySelector } from "./CurrencySelector";
import { ThemeSelector } from "./ThemeSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useOrders } from "../hooks/useOrders";
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
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  onDebugAuth?: () => void;
  onAdminClick?: () => void;
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
  products,
  onProductSelect,
  onSearch,
  onDebugAuth,
  onAdminClick,
}: HeaderProps) {
  const { t } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const { pendingOrders } = useOrders(user);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const logoClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cartRef.current &&
        !cartRef.current.contains(event.target as Node)
      ) {
        setIsCartOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
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
    setLogoClickCount(prev => {
      const newCount = prev + 1;
      
      // Clear previous timeout
      if (logoClickTimeoutRef.current) {
        clearTimeout(logoClickTimeoutRef.current);
      }
      
      // If 5 clicks in quick succession, open debug
      if (newCount >= 5 && onDebugAuth) {
        onDebugAuth();
        return 0;
      }
      
      // Reset counter after 2 seconds
      logoClickTimeoutRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 2000);
      
      return newCount;
    });
    
    // Always call the original home click
    onHomeClick();
  };

  return (
    <header className="header-responsive fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto responsive-container">
        <div className="flex items-center justify-between header-responsive relative">
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
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div className="header-logo-responsive hidden xs:flex flex-col">
              <h1 className="font-bold text-foreground xxs:text-sm xs:text-base sm:text-xl lg:text-2xl leading-tight">
                GenStore
              </h1>
              <span className="text-xs xxs:text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium hidden sm:block">
                Tu tienda online
              </span>
            </div>
            </button>
          </div>

          {/* Search Bar - Positioned absolutely on ultra small screens */}
          <div className="xxs:absolute xxs:left-1/2 xxs:transform xxs:-translate-x-1/2 xxs:w-32 xs:static xs:transform-none xs:w-auto header-search-responsive flex-1 max-w-xs xxs:max-w-sm sm:max-w-md lg:max-w-lg mx-2 xxs:mx-1 sm:mx-4 lg:mx-8 z-5">
            <SearchDropdown
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              products={products}
              onProductSelect={onProductSelect}
              onSearch={onSearch}
            />
          </div>

          {/* Right Side Actions */}
          <div className="header-nav-responsive flex items-center flex-shrink-0 z-10">
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

            {/* Cart */}
            <div className="relative" ref={cartRef}>
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5 xxs:w-6 xxs:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                    <span className="absolute -top-1 xxs:-top-2 -right-1 xxs:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 xxs:w-5 xxs:h-5 flex items-center justify-center text-xs">
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
                <div className="absolute right-0 mt-2 w-64 xxs:w-72 sm:w-80 lg:w-96 bg-card rounded-lg shadow-lg border border-border z-50 modal-responsive">
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
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
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

            {/* User Account */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <button
                  onClick={() =>
                    setIsUserMenuOpen(!isUserMenuOpen)
                  }
                  className="header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className={`w-6 h-6 xxs:w-8 xxs:h-8 ${user.email === 'admin@genstore.com' || user.email === 'adriarroyo2002@gmail.com' ? 'bg-orange-500 dark:bg-orange-600' : 'bg-emerald-500 dark:bg-emerald-600'} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105`}>
                    <span className="text-white text-xs xxs:text-sm font-medium">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline font-medium text-sm truncate max-w-24">
                    {user.name || user.email}
                  </span>
                  <svg
                    className="w-3 h-3 xxs:w-4 xxs:h-4 hidden sm:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="header-nav-item-responsive flex items-center gap-1 xxs:gap-2 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-accent rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 xxs:w-6 xxs:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

              {/* User Menu Dropdown */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-44 xxs:w-48 sm:w-56 bg-card rounded-lg shadow-lg border border-border z-50 modal-responsive">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-border mb-2">
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      {user.email === 'admin@genstore.com' || user.email === 'adriarroyo2002@gmail.com' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {t("admin.administrator")}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Account */}
                    {onAccountClick && (
                      <button
                        onClick={() => {
                          onAccountClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {t("header.account")}
                      </button>
                    )}

                    {/* Wishlist */}
                    {onWishlistClick && (
                      <button
                        onClick={() => {
                          onWishlistClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.317a4.5 4.5 0 000 6.364L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          {t("wishlist.title")}
                        </div>
                        {wishlist.length > 0 && (
                          <span className="bg-emerald-500 dark:bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {wishlist.length > 99 ? '99+' : wishlist.length}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Orders */}
                    {onOrdersClick && (
                      <button
                        onClick={() => {
                          onOrdersClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          {t("orders.title")}
                        </div>
                        {pendingOrders > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                            {pendingOrders > 99 ? '99+' : pendingOrders}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Addresses */}
                    {onAddressesClick && (
                      <button
                        onClick={() => {
                          onAddressesClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {t("addresses.title")}
                      </button>
                    )}

                    {/* Rewards */}
                    {onRewardsClick && (
                      <button
                        onClick={() => {
                          onRewardsClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                          />
                        </svg>
                        {t("rewards.title")}
                      </button>
                    )}

                    {/* Settings */}
                    {onSettingsClick && (
                      <button
                        onClick={() => {
                          onSettingsClick();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {t("settings.title")}
                      </button>
                    )}

                    {/* Admin Panel - Solo para administradores */}
                    {user.email === 'admin@genstore.com' || user.email === 'adriarroyo2002@gmail.com' && onAdminClick && (
                      <div className="border-t border-border mt-2 pt-2">
                        <button
                          onClick={() => {
                            onAdminClick();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          {t("admin.dashboard")}
                        </button>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {t("auth.logout")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}