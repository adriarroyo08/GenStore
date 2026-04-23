import { useState } from 'react';
import { CurrentPage, Product, User } from '../types';

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const handleLoginClick = () => setCurrentPage('login');
  
  const handleLoginSuccess = (userData: User, showNotification: (type: any, message: string) => void, t: (key: string) => string) => {
    setCurrentPage('home');
    showNotification('success', t('auth.loginSuccess'));
  };
  
  const handleLogout = (setUser: (user: User | null) => void, setWishlist: (wishlist: string[]) => void, showNotification: (type: any, message: string) => void, t: (key: string) => string) => {
    setUser(null);
    setWishlist([]);
    setCurrentPage('home');
    showNotification('info', t('auth.loggedOut'));
  };
  
  const handleHomeClick = (setSelectedCategory: (category: string | null) => void, setSearchQuery: (query: string) => void) => {
    setCurrentPage('home');
    setSelectedCategory(null);
    setSearchQuery('');
  };
  
  const handleSignupSuccess = () => setCurrentPage('login');
  
  const handleVerificationRequired = (email: string) => {
    setVerificationEmail(email);
    setCurrentPage('verify-email');
  };
  
  const handleProductSelect = (product: Product, setSearchQuery: (query: string) => void) => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleNavigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleTrackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage('order-tracking');
  };

  return {
    currentPage,
    setCurrentPage,
    selectedProduct,
    setSelectedProduct,
    selectedOrderId,
    setSelectedOrderId,
    verificationEmail,
    setVerificationEmail,
    handleLoginClick,
    handleLoginSuccess,
    handleLogout,
    handleHomeClick,
    handleSignupSuccess,
    handleVerificationRequired,
    handleProductSelect,
    handleNavigateToProduct,
    handleTrackOrder
  };
}