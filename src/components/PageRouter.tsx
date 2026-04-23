import React from 'react';
import { HeroSection } from './HeroSection';
import { OffersCarousel } from './OffersCarousel';
import { CategoriesSection } from './CategoriesSection';
import { FeaturedProducts } from './FeaturedProducts';
import { GoogleReviews } from './GoogleReviews';
import { Footer } from './Footer';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { EmailVerificationPage } from './EmailVerificationPage';
import { ProductCatalogPage } from './ProductCatalogPage';
import { ProductDetailPage } from './ProductDetailPage';
import { ShoppingCartPage } from './ShoppingCartPage';
import { CheckoutPage } from './CheckoutPage';
import { AccountPage } from './AccountPage';
import { ContactPage } from './ContactPage';
import { WishlistPage } from './WishlistPage';
import { OrdersPage } from './Orders/OrdersPage';
import { OrderDetailPage } from './Orders/OrderDetailPage';
import { AddressesPage } from './AddressesPage';
import { SettingsPage } from './SettingsPage';
import { AboutPage } from './AboutPage';
import { SupportPage } from './SupportPage';
import { FAQPage } from './FAQPage';
import { ShippingInfoPage } from './ShippingInfoPage';
import { ReturnsPage } from './ReturnsPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsOfServicePage } from './TermsOfServicePage';
import { RewardsPage } from './RewardsPage';
import { LearnMorePage } from './LearnMorePage';
import { AdminLayout } from './Admin/AdminLayout';
import { TrustBadgesBar } from './TrustBadgesBar';
import { NewsletterSection } from './NewsletterSection';
import { ProductDatabaseViewer } from './ProductDatabaseViewer';
import { Product, CartItem } from '../types';

interface PageRouterProps {
  currentPage: string;
  user: any;
  cart: CartItem[];
  cartTotal: number;
  selectedProduct: Product | null;
  selectedOrderId: string;
  verificationEmail: string;
  translatedProducts: Product[];
  filteredProducts: Product[];
  selectedCategory: string;
  searchQuery: string;
  wishlist: string[];
  clearWishlist: () => void;
  clearFilters: () => void;
  setSelectedCategory: (category: string) => void;
  setCurrentPage: (page: string) => void;
  commonProps: any;
  accountNavigationProps: any;
  handlers: any;
}

export function PageRouter({
  currentPage,
  user,
  cart,
  cartTotal,
  selectedProduct,
  selectedOrderId,
  verificationEmail,
  translatedProducts,
  filteredProducts,
  selectedCategory,
  searchQuery,
  wishlist,
  clearWishlist,
  clearFilters,
  setSelectedCategory,
  setCurrentPage,
  commonProps,
  accountNavigationProps,
  handlers
}: PageRouterProps) {

  // Common Footer props to avoid repetition
  const footerProps = {
    onContactClick: () => setCurrentPage('contact'),
    onAboutClick: () => setCurrentPage('about'),
    onSupportClick: () => setCurrentPage('support'),
    onFAQClick: () => setCurrentPage('faq'),
    onCategoryClick: (category: string) => {
      setSelectedCategory(category);
      setCurrentPage('catalog');
    },
    onShippingInfoClick: () => setCurrentPage('shipping-info'),
    onReturnsClick: () => setCurrentPage('returns'),
    onPrivacyClick: () => setCurrentPage('privacy-policy'),
    onTermsClick: () => setCurrentPage('terms-of-service'),
    onHomeClick: () => handlers.handleHomeClickWithFilters()
  };

  switch (currentPage) {
    case 'login':
      return (
        <LoginPage 
          onBackToHome={() => setCurrentPage('home')} 
          onLoginSuccess={handlers.handleLoginSuccessWithNotification} 
          onShowSignup={() => setCurrentPage('signup')} 
          onVerificationRequired={handlers.handleVerificationRequired}
        />
      );

    case 'signup':
      return (
        <SignupPage 
          onBackToLogin={() => setCurrentPage('login')} 
          onSignupSuccess={handlers.handleSignupSuccess} 
          onVerificationRequired={handlers.handleVerificationRequired} 
        />
      );

    case 'verify-email':
      return (
        <EmailVerificationPage 
          email={verificationEmail} 
          onBackToLogin={() => setCurrentPage('login')} 
          onBackToSignup={() => setCurrentPage('signup')} 
        />
      );

    case 'cart':
      return (
        <ShoppingCartPage 
          {...commonProps} 
          onBackToHome={() => setCurrentPage('home')} 
          onContinueShopping={() => setCurrentPage('catalog')} 
          onProceedToCheckout={() => setCurrentPage('checkout')} 
        />
      );

    case 'checkout':
      return (
        <CheckoutPage 
          cart={cart} 
          user={user} 
          cartTotal={cartTotal} 
          onBackToCart={() => setCurrentPage('cart')} 
          onContinueToPayment={() => console.log('Continue to payment')}
          onOrderComplete={handlers.handleOrderComplete}
        />
      );

    case 'account':
      return (
        <AccountPage 
          {...commonProps} 
          onBackToHome={handlers.handleHomeClickWithFilters} 
          {...accountNavigationProps} 
          onAddToCart={handlers.handleAddToCart} 
        />
      );

    case 'orders':
      return (
        <OrdersPage
          user={user}
          onLoginClick={commonProps.onLoginClick}
          onLogout={commonProps.onLogout}
          onProfileClick={accountNavigationProps.onProfileClick}
          onOrdersClick={accountNavigationProps.onOrdersClick}
          onAddressesClick={accountNavigationProps.onAddressesClick}
          onPaymentMethodsClick={accountNavigationProps.onPaymentMethodsClick}
          onWishlistClick={accountNavigationProps.onWishlistClick}
          onRewardsClick={accountNavigationProps.onRewardsClick}
          onSettingsClick={accountNavigationProps.onSettingsClick}
          onAdminClick={accountNavigationProps.onAdminClick}
          onCatalogClick={() => setCurrentPage('catalog')}
          onViewOrderDetail={handlers.handleTrackOrder}
        />
      );

    case 'order-tracking':
      if (!selectedOrderId) return null;
      return (
        <OrderDetailPage
          user={user}
          orderId={selectedOrderId}
          onBackToOrders={() => setCurrentPage('orders')}
          onContactClick={() => setCurrentPage('contact')}
        />
      );

    case 'addresses':
      return <AddressesPage {...commonProps} {...accountNavigationProps} />;

    case 'settings':
      return <SettingsPage {...commonProps} {...accountNavigationProps} />;

    case 'rewards':
      return <RewardsPage {...commonProps} {...accountNavigationProps} onLoginClick={commonProps.onLoginClick} />;

    case 'contact':
      return (
        <>
          <ContactPage 
            {...commonProps} 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onCartClick={() => setCurrentPage('cart')}
            setCurrentPage={setCurrentPage}
          />
          <Footer {...footerProps} />
        </>
      );

    case 'about':
      return (
        <>
          <AboutPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'support':
      return (
        <>
          <SupportPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'faq':
      return (
        <>
          <FAQPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'shipping-info':
      return (
        <>
          <ShippingInfoPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'returns':
      return (
        <>
          <ReturnsPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'privacy-policy':
      return (
        <>
          <PrivacyPolicyPage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'terms-of-service':
      return (
        <>
          <TermsOfServicePage 
            onBackToHome={handlers.handleHomeClickWithFilters} 
            onContactClick={() => setCurrentPage('contact')} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'learn-more':
      return (
        <>
          <LearnMorePage
            onBack={handlers.handleHomeClickWithFilters}
            onContactClick={() => setCurrentPage('contact')}
          />
          <Footer {...footerProps} />
        </>
      );



    case 'payment-methods':
      return (
        <AccountPage
          {...commonProps}
          onBackToHome={handlers.handleHomeClickWithFilters}
          {...accountNavigationProps}
          onAddToCart={handlers.handleAddToCart}
        />
      );

    case 'admin':
      return <AdminLayout />;

    case 'product-database':
      return (
        <ProductDatabaseViewer 
          onBack={() => setCurrentPage('admin')}
        />
      );

    case 'wishlist':
      return (
        <WishlistPage 
          {...commonProps} 
          {...accountNavigationProps} 
          onAddToCart={handlers.handleAddToCart} 
          onClearWishlist={clearWishlist} 
          onCatalogClick={() => setCurrentPage('catalog')}
          onRewardsClick={() => setCurrentPage('rewards')}
        />
      );

    case 'product-detail':
      if (!selectedProduct) return null;
      return (
        <>
          <ProductDetailPage 
            product={selectedProduct} 
            allProducts={translatedProducts} 
            {...commonProps} 
            onBackToHome={() => setCurrentPage('home')} 
            onBackToCatalog={() => setCurrentPage('catalog')} 
            onCartClick={() => setCurrentPage('cart')} 
            onCheckoutClick={() => setCurrentPage('checkout')}
            onAddToCart={handlers.handleAddToCart} 
            onNavigateToProduct={handlers.handleNavigateToProduct} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'catalog':
      return (
        <>
          <ProductCatalogPage 
            products={translatedProducts} 
            {...commonProps} 
            selectedCategory={selectedCategory} 
            onAddToCart={handlers.handleAddToCart} 
            onBackToHome={() => setCurrentPage('home')} 
            onCartClick={() => setCurrentPage('cart')} 
            onClearFilters={clearFilters}
            onCategoryChange={setSelectedCategory} 
            onProductSelect={handlers.handleNavigateToProduct} 
          />
          <Footer {...footerProps} />
        </>
      );

    case 'home':
    default:
      return (
        <>
          <HeroSection 
            onShopNowClick={() => setCurrentPage('catalog')}
            onLearnMoreClick={() => setCurrentPage('learn-more')}
          />
          <TrustBadgesBar />
          <OffersCarousel
            products={translatedProducts}
            onProductClick={handlers.handleNavigateToProduct}
            onAddToCart={handlers.handleAddToCart}
            wishlist={wishlist}
            onToggleWishlist={commonProps.onToggleWishlist}
            user={user}
          />
          <CategoriesSection 
            selectedCategory={selectedCategory} 
            onCategoryClick={handlers.handleCategoryClickWithNavigation} 
          />
          <FeaturedProducts 
            products={filteredProducts} 
            onAddToCart={handlers.handleAddToCart} 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory} 
            onClearFilters={clearFilters}
            onViewAll={() => setCurrentPage('catalog')} 
            onProductClick={handlers.handleNavigateToProduct} 
            wishlist={wishlist} 
            onToggleWishlist={commonProps.onToggleWishlist}
            user={user}
          />
          <GoogleReviews />
          <NewsletterSection />
          <Footer {...footerProps} />
        </>
      );
  }
}