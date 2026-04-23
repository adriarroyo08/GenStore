import { Product } from '../types';
import { NotificationTriggers } from '../components/NotificationManager';
import { NOTIFICATION_TRIGGERS } from '../constants';

interface UseAppHandlersProps {
  user: any;
  setUser: (user: any) => void;
  setWishlist: (wishlist: string[]) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  t: (key: string) => string;
  addToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void | Promise<void>;
  clearCart: () => void;
  setCurrentPage: (page: string) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  handleLoginSuccess: (userData: any, showNotification: any, t: any) => void;
  handleLogout: (setUser: any, setWishlist: any, showNotification: any, t: any) => void;
  handleHomeClick: (setSelectedCategory: any, setSearchQuery: any) => void;
  handleProductSelect: (product: Product, setSearchQuery: any) => void;
  handleSearch: (query: string, setCurrentPage: any) => void;
  handleCategoryClick: (category: string, setCurrentPage: any) => void;
  handleSignupSuccess: any;
  handleVerificationRequired: any;
  handleLoginClick: any;
  handleNavigateToProduct: any;
  handleTrackOrder: any;
  signOut?: () => Promise<void>;
}

export function useAppHandlers({
  user,
  setUser,
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
}: UseAppHandlersProps) {

  const handleAddToCart = async (product: Product, selectedColor?: string, selectedColorName?: string) => {
    try {
      await addToCart(product, selectedColor, selectedColorName);
      showNotification('success', t('product.addedToCart'));
    } catch (error: any) {
      console.error('[handleAddToCart] Error:', error);
      showNotification('error', error?.message || 'Error al agregar al carrito');
    }
  };

  const handleLoginSuccessWithNotification = (userData: any) => {
    handleLoginSuccess(userData, showNotification, t);

    try {
      NotificationTriggers.securityAlert(`New login detected from your current device at ${new Date().toLocaleString()}`);
    } catch (error) {
      console.log('Security notification failed:', error);
    }
  };

  const handleLogoutWithNotification = async () => {
    try {
      if (signOut) {
        setWishlist([]);

        // Clear cart (non-blocking — don't let it prevent logout)
        try { await clearCart(); } catch { /* intentionally ignored */ }

        await signOut();

        setCurrentPage('home');
        setSelectedCategory('');
        setSearchQuery('');
        showNotification('info', t('auth.loggedOut'));
      } else {
        handleLogout(setUser, setWishlist, showNotification, t);
      }
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('error', t('auth.logoutError') || 'Error al cerrar sesión');
    }
  };

  const handleHomeClickWithFilters = () => {
    handleHomeClick(setSelectedCategory, setSearchQuery);
  };

  const handleProductSelectWithSearch = (product: Product) => {
    handleProductSelect(product, setSearchQuery);
  };

  const handleSearchWithNavigation = (query: string) => {
    handleSearch(query, setCurrentPage);
  };

  const handleCategoryClickWithNavigation = (category: string) => {
    handleCategoryClick(category, setCurrentPage);
  };

  const handleOrderComplete = (orderId: string) => {
    // Clear cart after successful order
    clearCart();
    // Navigate to orders page after a delay
    setTimeout(() => {
      setCurrentPage('orders');
    }, 3000);
  };

  return {
    handleAddToCart,
    handleLoginSuccessWithNotification,
    handleLogoutWithNotification,
    handleHomeClickWithFilters,
    handleProductSelectWithSearch,
    handleSearchWithNavigation,
    handleCategoryClickWithNavigation,
    handleOrderComplete,
    // Pass through other handlers
    handleSignupSuccess,
    handleVerificationRequired,
    handleLoginClick,
    handleNavigateToProduct,
    handleTrackOrder
  };
}