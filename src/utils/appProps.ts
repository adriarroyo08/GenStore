import { Product, CartItem } from '../types';

export function createCommonProps({
  user,
  searchQuery,
  setSearchQuery,
  cartItemsCount,
  cart,
  updateQuantity,
  removeFromCart,
  cartTotal,
  onLoginClick,
  onLogout,
  products,
  onProductSelect,
  onSearch,
  wishlist,
  onToggleWishlist
}: {
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  wishlist: string[];
  onToggleWishlist: (productOrId: string | Product) => void;
}) {
  return {
    user,
    searchQuery,
    setSearchQuery,
    cartItemsCount,
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    onLoginClick,
    onLogout,
    products,
    onProductSelect,
    onSearch,
    wishlist,
    onToggleWishlist
  };
}

export function createAccountNavigationProps(setCurrentPage: (page: string) => void) {
  return {
    onBackToAccount: () => setCurrentPage('account'),
    onProfileClick: () => setCurrentPage('account'),
    onOrdersClick: () => setCurrentPage('orders'),
    onAddressesClick: () => setCurrentPage('addresses'),
    onPaymentMethodsClick: () => setCurrentPage('payment-methods'),
    onWishlistClick: () => setCurrentPage('wishlist'),
    onRewardsClick: () => setCurrentPage('rewards'),
    onSettingsClick: () => setCurrentPage('settings'),
    onCartClick: () => setCurrentPage('cart'),
    onAdminClick: () => setCurrentPage('admin'),
    setCurrentPage: setCurrentPage
  };
}