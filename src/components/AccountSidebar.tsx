import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePoints } from '../hooks/usePoints';
import { useOrders } from '../hooks/useOrders';
import { User, ShoppingBag, MapPin, Heart, Star, Settings, ShieldCheck, LogOut, Coins } from 'lucide-react';

interface AccountSidebarProps {
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
}

export function AccountSidebar({
  user,
  currentPage,
  wishlist = [],
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick,
  onLogout
}: AccountSidebarProps) {
  const { t } = useLanguage();
  const { userPoints, isEnabled: pointsEnabled } = usePoints(user);
  const { pendingOrders, recentOrders } = useOrders(user);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [notifications, setNotifications] = useState({
    orders: 0,
    wishlist: 0,
    rewards: 0
  });

  // Update notifications with real data
  useEffect(() => {
    setNotifications({
      orders: pendingOrders, // Real pending orders count
      wishlist: wishlist.length, // Real wishlist count
      rewards: userPoints && userPoints.currentPoints >= 100 ? 1 : 0 // Available rewards
    });
  }, [pendingOrders, wishlist.length, userPoints]);

  const handleItemClick = (onClick: () => void, itemKey: string) => {
    // Add a subtle animation delay for better UX
    setTimeout(() => {
      onClick();
    }, 150);
  };

  // Check if user is admin
  const isAdmin = user?.email === 'admin@genstore.com' || user?.email === 'adriarroyo2002@gmail.com';

  const menuItems: { key: string; label: string; description: string; lucideIcon: React.ReactNode; onClick: () => void; badge: number | string | null }[] = [
    {
      key: 'account',
      label: t('account.profile'),
      description: t('account.profileDescription'),
      lucideIcon: <User className="w-5 h-5" />,
      onClick: () => handleItemClick(onProfileClick, 'account'),
      badge: null
    },
    {
      key: 'orders',
      label: t('account.orders'),
      description: t('account.ordersDescription'),
      lucideIcon: <ShoppingBag className="w-5 h-5" />,
      onClick: () => handleItemClick(onOrdersClick, 'orders'),
      badge: notifications.orders > 0 ? notifications.orders : null
    },
    {
      key: 'addresses',
      label: t('account.addresses'),
      description: t('account.addressesDescription'),
      lucideIcon: <MapPin className="w-5 h-5" />,
      onClick: () => handleItemClick(onAddressesClick, 'addresses'),
      badge: null
    },
    {
      key: 'wishlist',
      label: t('account.wishlist'),
      description: t('account.wishlistDescription'),
      lucideIcon: <Heart className="w-5 h-5" />,
      onClick: () => handleItemClick(onWishlistClick, 'wishlist'),
      badge: notifications.wishlist > 0 ? notifications.wishlist : null
    },
    {
      key: 'rewards',
      label: t('account.rewards'),
      description: t('account.rewardsDescription'),
      lucideIcon: <Star className="w-5 h-5" />,
      onClick: () => handleItemClick(onRewardsClick, 'rewards'),
      badge: notifications.rewards > 0 ? '🎁' : null
    },
    {
      key: 'settings',
      label: t('account.settings'),
      description: t('account.settingsDescription'),
      lucideIcon: <Settings className="w-5 h-5" />,
      onClick: () => handleItemClick(onSettingsClick, 'settings'),
      badge: null
    }
  ];

  // Remove rewards item if points system is disabled
  if (!pointsEnabled) {
    const rewardsIdx = menuItems.findIndex(item => item.key === 'rewards');
    if (rewardsIdx !== -1) menuItems.splice(rewardsIdx, 1);
  }

  // Add admin menu item conditionally
  if (isAdmin && onAdminClick) {
    menuItems.push({
      key: 'admin',
      label: t('admin.dashboard'),
      description: t('admin.manageProducts'),
      lucideIcon: <ShieldCheck className="w-5 h-5" />,
      onClick: () => handleItemClick(onAdminClick, 'admin'),
      badge: '⚡'
    });
  }

  // Focus management for accessibility
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle Enter and Space key presses for better accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement as HTMLButtonElement;
        if (activeElement && activeElement.getAttribute('data-sidebar-item')) {
          event.preventDefault();
          activeElement.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [menuItems]);

  return (
    <div>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 border-b border-border mb-4" aria-label="Navegación de cuenta">
        <div className="flex min-w-max">
          {menuItems.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-3 min-h-[44px] whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span className="w-4 h-4 flex-shrink-0">
                  {item.lucideIcon}
                </span>
                {item.label}
                {item.badge && typeof item.badge === 'number' && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-3 min-h-[44px] whitespace-nowrap text-sm font-medium border-b-2 border-transparent text-destructive hover:border-destructive transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {t('account.logout')}
          </button>
        </div>
      </nav>

      {/* Desktop: vertical card sidebar */}
    <div className="hidden lg:block bg-card border border-border rounded-xl shadow-sm p-6 h-fit transition-all duration-300 hover:shadow-md">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <button 
          className={`${isAdmin ? 'bg-orange-500' : 'bg-blue-500'} w-20 h-20 rounded-full flex items-center justify-center mb-4 cursor-pointer transition-all duration-300 hover:scale-105 focus:scale-105 hover:shadow-lg focus:shadow-lg relative group focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2`}
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          aria-label={`${isProfileExpanded ? 'Contraer' : 'Expandir'} información del perfil`}
          aria-expanded={isProfileExpanded}
        >
          <span className="text-white text-2xl font-bold transition-transform duration-300 group-hover:scale-110 group-focus:scale-110">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </span>
          
          {/* Profile status indicator */}
          <div 
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card flex items-center justify-center"
            aria-label="Usuario conectado"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </button>
        
        <h2 className="text-xl font-bold text-foreground transition-colors duration-200">
          {user?.name || 'User'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {user?.email || ''}
        </p>
        
        {/* Expandable profile info */}
        {isProfileExpanded && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg w-full animate-fadeIn">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>{t('account.memberSince')}:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('account.accountType')}:</span>
                <span className={`font-medium ${isAdmin ? 'text-orange-500' : 'text-blue-500'}`}>
                  {isAdmin ? t('admin.administrator') : t('account.premium')}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Points Display (only if enabled) */}
        {pointsEnabled && userPoints && (
          <button 
            className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg w-full transition-all duration-300 hover:bg-primary/15 focus:bg-primary/15 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={onRewardsClick}
            aria-label={`Ver recompensas: ${userPoints.currentPoints.toLocaleString()} puntos disponibles`}
          >
            <div className="flex items-center justify-center mb-1">
              <Coins className="w-4 h-4 text-blue-500 mr-1 transition-transform duration-300 group-hover:scale-110 group-focus:scale-110" aria-hidden="true" />
              <span className="text-primary font-medium">
                {userPoints.currentPoints.toLocaleString()} {t('rewardPoints')}
              </span>
              {notifications.rewards > 0 && (
                <span className="ml-2 text-xs" aria-label="Recompensas disponibles">🎁</span>
              )}
            </div>
            <p className="text-xs text-primary">
              {t(`tier${userPoints.tier.charAt(0).toUpperCase() + userPoints.tier.slice(1)}`)} {t('account.tier')}
            </p>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2" aria-label="Navegación de cuenta">
        {menuItems.map((item) => {
          const isActive = currentPage === item.key;
          const isHovered = hoveredItem === item.key;
          
          return (
            <div key={item.key} className="relative group">
              <button
                onClick={item.onClick}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
                onFocus={() => setHoveredItem(item.key)}
                onBlur={() => setHoveredItem(null)}
                data-sidebar-item={item.key}
                aria-label={`${item.label}: ${item.description}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary'
                }`}
              >
                <div className={`transition-all duration-300 ${
                  isActive ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-500 group-focus:text-blue-500'
                }`}>
                  {item.lucideIcon}
                </div>
                
                <div className="flex-1">
                  <span className={`font-medium transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </div>
                
                {/* Badge/Notification */}
                {item.badge && (
                  <div className={`transition-all duration-300 ${
                    typeof item.badge === 'number' 
                      ? 'bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse' 
                      : 'text-lg animate-bounce'
                  }`}>
                    {item.badge}
                  </div>
                )}

              </button>
            </div>
          );
        })}

        {/* Logout Button with enhanced styling */}
        <div className="pt-4 mt-4 border-t border-border">
          <button 
            onClick={onLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            onFocus={() => setHoveredItem('logout')}
            onBlur={() => setHoveredItem(null)}
            data-sidebar-item="logout"
            aria-label={`${t('account.logout')}: Cerrar sesión de tu cuenta`}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-all duration-300 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          >
            <LogOut className="w-5 h-5 transition-all duration-300" />
            
            <span className="font-medium transition-all duration-300">
              {t('account.logout')}
            </span>

          </button>
        </div>
      </nav>
    </div>
    </div>
  );
}