import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AccountLayout } from './AccountLayout';
import { PaymentMethodsSection } from './PaymentMethods/PaymentMethodsSection';
import { Product, CartItem } from '../App';

interface PaymentMethodsPageProps {
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
  onBackToAccount: () => void;
  onCartClick: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
}

export function PaymentMethodsPage({
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
  onBackToAccount,
  onCartClick,
  products,
  onProductSelect,
  onSearch,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick
}: PaymentMethodsPageProps) {
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t('auth.loginRequired')}
          </h2>
          <button
            onClick={onLoginClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout
      user={user}
      currentPage="payment-methods"
      onProfileClick={onProfileClick}
      onOrdersClick={onOrdersClick}
      onAddressesClick={onAddressesClick}
      onPaymentMethodsClick={onPaymentMethodsClick}
      onWishlistClick={onWishlistClick}
      onRewardsClick={onRewardsClick}
      onSettingsClick={onSettingsClick}
      onAdminClick={onAdminClick}
      onLogout={onLogout}
      pageTitle={t('payment.paymentMethods')}
      pageDescription={t('payment.managePaymentMethods', 'Gestiona tus métodos de pago de forma segura')}
      showHeader={false}
    >
      <PaymentMethodsSection />
    </AccountLayout>
  );
}