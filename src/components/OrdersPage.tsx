import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { usePoints } from '../hooks/usePoints';
import { Product, CartItem } from '../App';
import { AccountSidebar } from './AccountSidebar';
import { apiClient } from '../lib/apiClient';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  numeroPedido?: string;
  status: string;
  orderDate: string;
  items?: OrderItem[];
  total: number;
  itemCount: number;
}

interface OrdersPageProps {
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  onBackToAccount: () => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onCartClick: () => void;
  onCatalogClick: () => void;
  onTrackOrder?: (orderId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  processing: {
    label: 'Procesando',
    color: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  shipped: {
    label: 'Enviado',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800',
    icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
    icon: 'M5 13l4 4L19 7',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
    icon: 'M6 18L18 6M6 6l12 12',
  },
};

const FILTERS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export function OrdersPage(props: OrdersPageProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { userPoints } = usePoints(props.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [props.user]);

  const fetchOrders = async () => {
    if (!props.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiClient.get<any>('/orders');

      if (data.success && data.orders) {
        setOrders(data.orders);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.status === selectedFilter;
  });

  const filterLabels: Record<string, string> = {
    all: 'Todos',
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  if (!props.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.loginRequired')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Inicia sesión para ver tus pedidos</p>
          <button
            onClick={props.onLoginClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1 mb-4 lg:mb-0">
            <AccountSidebar
              user={props.user}
              currentPage="orders"
              onProfileClick={props.onProfileClick}
              onOrdersClick={props.onOrdersClick}
              onAddressesClick={props.onAddressesClick}
              onPaymentMethodsClick={props.onPaymentMethodsClick}
              onWishlistClick={props.onWishlistClick}
              onRewardsClick={props.onRewardsClick}
              onSettingsClick={props.onSettingsClick}
              onLogout={props.onLogout}
            />
          </div>

          {/* Main */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mis Pedidos</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} en total</p>

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedFilter === f
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filterLabels[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No hay pedidos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {selectedFilter === 'all' ? 'Aún no has realizado ningún pedido' : `No tienes pedidos con estado "${filterLabels[selectedFilter]}"`}
                    </p>
                    <button onClick={props.onCatalogClick} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                      Ir a la tienda
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const sc = getStatusConfig(order.status);
                      const items = order.items ?? [];
                      const displayId = order.numeroPedido || order.id.substring(0, 8).toUpperCase();

                      return (
                        <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                          {/* Order header bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">#{displayId}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sc.icon} />
                                </svg>
                                {sc.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.orderDate)}</span>
                          </div>

                          {/* Items */}
                          <div className="px-5 py-4">
                            {items.length > 0 ? (
                              <div className="space-y-3">
                                {items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-700" />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">x{item.quantity}</p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{order.itemCount} {order.itemCount === 1 ? 'artículo' : 'artículos'}</p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-base font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                            <button
                              onClick={() => props.onTrackOrder?.(order.id)}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              Ver detalle →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
