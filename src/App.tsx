import React from 'react';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { NotificationManager } from './components/NotificationManager';
import { Header } from './components/Header';
import { ModernLoadingScreen } from './components/ModernLoadingScreen';
import { ProductComparatorProvider, CompareFloatingBar } from './components/ProductComparator';
import { GlobalNotification } from './components/GlobalNotification';
import { PageRouter } from './components/PageRouter';
import { TranslationDebugPanel } from './components/TranslationDebugPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevBanner } from './components/DevBanner';
import { motion } from 'motion/react';

// Hooks
import { useTranslatedProductsSafe } from './hooks/useTranslatedProductsSafe';
import { useNotification } from './hooks/useNotification';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useSearch } from './hooks/useSearch';
import { useNavigation } from './hooks/useNavigation';
import { useAppHandlers } from './hooks/useAppHandlers';

// Utilities
import { createCommonProps, createAccountNavigationProps } from './utils/appProps';

// Constants
import { AUTH_PAGES } from './constants';

// Types
export type { ColorOption, Product, CartItem, User, CurrentPage } from './types';

const authPages = AUTH_PAGES || ['login', 'signup', 'verify-email'];

function AppContent() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Core state
  const { notification, showNotification } = useNotification();
  const { user, isLoading: isCheckingAuth, logout: signOut } = useAuth();

  // Navigation
  const {
    currentPage,
    setCurrentPage,
    selectedProduct,
    selectedOrderId,
    verificationEmail,
    handleLoginClick,
    handleLoginSuccess,
    handleLogout,
    handleHomeClick,
    handleSignupSuccess,
    handleVerificationRequired,
    handleProductSelect,
    handleNavigateToProduct,
    handleTrackOrder
  } = useNavigation();

  // Scroll to top on page navigation
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentPage]);

  // Handle email verification token from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verification_token');
    const type = params.get('type');
    if (token) {
      window.history.replaceState({}, '', window.location.pathname);
      fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            showNotification('error', data.error);
          } else {
            showNotification('success', 'Email verificado correctamente. Ya puedes iniciar sesión.');
          }
          setCurrentPage('login');
        })
        .catch(() => {
          showNotification('error', 'Error al verificar el email');
          setCurrentPage('login');
        });
    }
  }, []);

  // All hooks called unconditionally — no staging needed
  const translatedProducts = useTranslatedProductsSafe() || [];
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartItemsCount, cartTotal } = useCart();
  const { wishlist, toggleWishlist, clearWishlist, setWishlist } = useWishlist();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, filteredProducts, clearFilters } = useSearch();

  const handleSearch = (query: string, navFn?: (page: string) => void) => {
    setSearchQuery(query);
    (navFn ?? setCurrentPage)('catalog');
  };

  const handleCategoryClick = (category: string, navFn?: (page: string) => void) => {
    setSelectedCategory(category);
    (navFn ?? setCurrentPage)('catalog');
  };

  const handlers = useAppHandlers({
    user,
    setUser: () => {},
    setWishlist,
    showNotification,
    t,
    addToCart,
    clearCart,
    setCurrentPage,
    setSelectedCategory,
    setSearchQuery,
    handleLoginSuccess,
    handleLogout,
    handleHomeClick,
    handleProductSelect,
    handleSearch,
    handleCategoryClick,
    handleSignupSuccess,
    handleVerificationRequired,
    handleLoginClick,
    handleNavigateToProduct,
    handleTrackOrder,
    signOut,
  });

  const commonProps = React.useMemo(() => createCommonProps({
    user,
    searchQuery,
    setSearchQuery,
    cartItemsCount,
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    onLoginClick: handleLoginClick,
    onLogout: handlers.handleLogoutWithNotification,
    products: translatedProducts,
    onProductSelect: handlers.handleProductSelectWithSearch,
    onSearch: handlers.handleSearchWithNavigation,
    wishlist,
    onToggleWishlist: toggleWishlist
  }), [user, searchQuery, cartItemsCount, cart, cartTotal, translatedProducts, wishlist, handlers]);

  const accountNavigationProps = createAccountNavigationProps(setCurrentPage);

  // Only show loading during auth check
  if (isCheckingAuth) {
    return <ModernLoadingScreen message="Verificando autenticación..." stage="loading" />;
  }

  const isAuthPage = authPages.includes(currentPage as any);
  const isAdminPage = currentPage === 'admin';
  const showHeader = (!isAuthPage || currentPage === 'signup') && !isAdminPage;

  return (
    <NotificationProvider user={user}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`min-h-screen w-full overflow-x-hidden relative ${theme === 'dark' ? 'dark' : ''}`}
      >
        <DevBanner />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Saltar al contenido principal
        </a>

        {showHeader && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-40"
          >
            <Header
              {...commonProps}
              onHomeClick={handlers.handleHomeClickWithFilters}
              onCartClick={() => setCurrentPage('cart')}
              onCheckoutClick={() => setCurrentPage('checkout')}
              onAccountClick={() => setCurrentPage('account')}
              onWishlistClick={() => setCurrentPage('wishlist')}
              onSettingsClick={() => setCurrentPage('settings')}
              onOrdersClick={() => setCurrentPage('orders')}
              onPaymentMethodsClick={() => setCurrentPage('payment-methods')}
              onRewardsClick={() => setCurrentPage('rewards')}
              onAddressesClick={() => setCurrentPage('addresses')}
              onProductDatabaseClick={() => setCurrentPage('product-database')}
              onCatalogClick={() => setCurrentPage('catalog')}
              onTrackOrder={handlers.handleTrackOrder}
              currentPage={currentPage}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <GlobalNotification notification={notification} isAuthPage={isAuthPage} />
        </motion.div>

        <NotificationManager user={user} />

        {process.env.NODE_ENV === 'development' && (
          <TranslationDebugPanel isDevelopment={true} />
        )}

        <main id="main-content" role="main">
          <motion.div
            className={`relative z-10 ${showHeader ? 'pt-10 xxs:pt-11 sm:pt-[3.25rem]' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              <PageRouter
                currentPage={currentPage}
                user={user}
                cart={cart}
                cartTotal={cartTotal}
                selectedProduct={selectedProduct}
                selectedOrderId={selectedOrderId}
                verificationEmail={verificationEmail}
                translatedProducts={translatedProducts}
                filteredProducts={filteredProducts}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                wishlist={wishlist}
                clearWishlist={clearWishlist}
                clearFilters={clearFilters}
                setSelectedCategory={setSelectedCategory}
                setCurrentPage={setCurrentPage}
                commonProps={commonProps}
                accountNavigationProps={accountNavigationProps}
                handlers={handlers}
              />
            </div>
          </motion.div>
        </main>

        <motion.div
          aria-hidden="true"
          className="fixed bottom-6 left-6 w-2 h-2 bg-primary/20 rounded-full blur-sm"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          aria-hidden="true"
          className="fixed top-1/3 right-8 w-1 h-1 bg-accent/30 rounded-full blur-sm"
          animate={{ scale: [1, 2, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </motion.div>
      <CompareFloatingBar onProductClick={handleNavigateToProduct} />
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <ProductComparatorProvider>
                <AppContent />
              </ProductComparatorProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
