import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AccountSidebar } from './AccountSidebar';
import { motion } from 'motion/react';

interface AccountLayoutProps {
  user: any;
  currentPage: 'account' | 'orders' | 'addresses' | 'payment-methods' | 'wishlist' | 'rewards' | 'settings' | 'admin';
  wishlist?: string[];
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
  onLogout: () => void;
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  showHeader?: boolean;
}

export function AccountLayout({
  user,
  currentPage,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick,
  onLogout,
  children,
  pageTitle,
  pageDescription,
  showHeader = true
}: AccountLayoutProps) {
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="text-6xl mb-6"
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          >
            🔒
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t('auth.loginRequired')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('account.loginToAccess')}
          </p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
          >
            {t('auth.login')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">

          {/* Account Sidebar */}
          <motion.div
            className="lg:col-span-1 mb-4 lg:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <AccountSidebar
              user={user}
              currentPage={currentPage}
              onProfileClick={onProfileClick}
              onOrdersClick={onOrdersClick}
              onAddressesClick={onAddressesClick}
              onPaymentMethodsClick={onPaymentMethodsClick}
              onWishlistClick={onWishlistClick}
              onRewardsClick={onRewardsClick}
              onSettingsClick={onSettingsClick}
              onAdminClick={onAdminClick}
              onLogout={onLogout}
            />
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden">

              {/* Header Section */}
              {showHeader && (pageTitle || pageDescription) && (
                <motion.div
                  className="p-6 border-b border-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div>
                    {pageTitle && (
                      <h1 className="text-2xl font-bold text-foreground">
                        {pageTitle}
                      </h1>
                    )}
                    {pageDescription && (
                      <p className="text-sm text-muted-foreground">
                        {pageDescription}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <motion.div
                className={`${showHeader && (pageTitle || pageDescription) ? 'p-6' : 'p-0'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}