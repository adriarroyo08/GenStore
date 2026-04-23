import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AccountLayout } from '../AccountLayout';
import { OrderCard } from './OrderCard';
import { CancelOrderModal } from './CancelOrderModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { useOrders, FILTERS } from '../../hooks/useOrders';
import { Package, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface OrdersPageProps {
  user: any;
  onLoginClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
  onCatalogClick: () => void;
  onViewOrderDetail: (orderId: string) => void;
}

const FILTER_LABELS_ES: Record<string, string> = {
  all: 'Todos', pending: 'Pendientes', confirmed: 'Confirmados', processing: 'En proceso',
  shipped: 'Enviados', delivered: 'Entregados', cancelled: 'Cancelados',
};
const FILTER_LABELS_EN: Record<string, string> = {
  all: 'All', pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

export function OrdersPage(props: OrdersPageProps) {
  const { language } = useLanguage();
  const { orders, allOrders, isLoading, filter, setFilter, filterCounts, cancelOrder } = useOrders(props.user);
  const [cancelModal, setCancelModal] = useState<{ orderId: string; orderNumber: string; total: number } | null>(null);
  const [returnModal, setReturnModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const labels = language === 'es' ? FILTER_LABELS_ES : FILTER_LABELS_EN;

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(o =>
      (o.numeroPedido && o.numeroPedido.toLowerCase().includes(q)) ||
      o.id.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  if (!props.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {language === 'es' ? 'Inicia sesión' : 'Log in'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === 'es' ? 'Inicia sesión para ver tus pedidos' : 'Log in to view your orders'}
          </p>
          <button onClick={props.onLoginClick} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors">
            {language === 'es' ? 'Iniciar sesión' : 'Log in'}
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = language === 'es' ? 'Mis Pedidos' : 'My Orders';
  const pageDescription = `${allOrders.length} ${allOrders.length === 1 ? (language === 'es' ? 'pedido' : 'order') : (language === 'es' ? 'pedidos' : 'orders')}`;

  return (
    <AccountLayout
      user={props.user}
      currentPage="orders"
      onProfileClick={props.onProfileClick}
      onOrdersClick={props.onOrdersClick}
      onAddressesClick={props.onAddressesClick}
      onPaymentMethodsClick={props.onPaymentMethodsClick}
      onWishlistClick={props.onWishlistClick}
      onRewardsClick={props.onRewardsClick}
      onSettingsClick={props.onSettingsClick}
      onAdminClick={props.onAdminClick}
      onLogout={props.onLogout}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    >
      {/* Search + Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'es' ? 'Buscar por número de pedido...' : 'Search by order number...'}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {labels[f]}
              {f !== 'all' && filterCounts[f] ? (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  filter === f ? 'bg-primary-foreground/20' : 'bg-background'
                }`}>
                  {filterCounts[f]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-border p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {searchQuery.trim()
              ? (language === 'es' ? 'Sin resultados' : 'No results')
              : (language === 'es' ? 'No hay pedidos' : 'No orders')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery.trim()
              ? (language === 'es' ? `No se encontraron pedidos para "${searchQuery}"` : `No orders found for "${searchQuery}"`)
              : filter === 'all'
                ? (language === 'es' ? 'Aún no has realizado ningún pedido' : 'You haven\'t placed any orders yet')
                : (language === 'es' ? `No tienes pedidos con estado "${labels[filter]}"` : `No orders with status "${labels[filter]}"`)
            }
          </p>
          {!searchQuery.trim() && (
            <button onClick={props.onCatalogClick} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {language === 'es' ? 'Ir a la tienda' : 'Go to shop'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
            <OrderCard
              key={order.id}
              order={order}
              onViewDetail={props.onViewOrderDetail}
              onRetryPayment={props.onViewOrderDetail}
              onCancel={(id) => {
                const o = allOrders.find(x => x.id === id);
                if (o) setCancelModal({ orderId: id, orderNumber: o.numeroPedido || id.substring(0, 8), total: o.total });
              }}
              onReorder={props.onViewOrderDetail}
              onRequestReturn={(id) => {
                const o = allOrders.find(x => x.id === id);
                if (o) setReturnModal({ orderId: id, orderNumber: o.numeroPedido || id.substring(0, 8) });
              }}
            />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      {cancelModal && (
        <CancelOrderModal
          orderId={cancelModal.orderId}
          orderNumber={cancelModal.orderNumber}
          total={cancelModal.total}
          onConfirm={async () => { await cancelOrder(cancelModal.orderId); setCancelModal(null); }}
          onClose={() => setCancelModal(null)}
        />
      )}
      {returnModal && (
        <ReturnRequestModal
          orderId={returnModal.orderId}
          orderNumber={returnModal.orderNumber}
          onSuccess={() => {}}
          onClose={() => setReturnModal(null)}
        />
      )}
    </AccountLayout>
  );
}
