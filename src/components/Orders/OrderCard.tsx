import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Clock, CheckCircle, Truck, Package, XCircle, RotateCcw, RefreshCw } from 'lucide-react';
import type { Order } from '../../hooks/useOrders';

interface OrderCardProps {
  order: Order;
  onViewDetail: (orderId: string) => void;
  onRetryPayment: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onReorder: (orderId: string) => void;
  onRequestReturn: (orderId: string) => void;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  labelEn: string;
  icon: React.ElementType;
  dotColor: string;
  badgeClass: string;
  barClass: string;
}> = {
  pending: {
    label: 'Pago pendiente', labelEn: 'Payment pending',
    icon: Clock,
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    barClass: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  },
  confirmed: {
    label: 'Confirmado', labelEn: 'Confirmed',
    icon: CheckCircle,
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    barClass: 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900',
  },
  processing: {
    label: 'Procesando', labelEn: 'Processing',
    icon: RefreshCw,
    dotColor: 'bg-purple-500',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    barClass: 'bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900',
  },
  shipped: {
    label: 'Enviado', labelEn: 'Shipped',
    icon: Truck,
    dotColor: 'bg-indigo-500',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    barClass: 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900',
  },
  delivered: {
    label: 'Entregado', labelEn: 'Delivered',
    icon: Package,
    dotColor: 'bg-green-500',
    badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    barClass: 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900',
  },
  cancelled: {
    label: 'Cancelado', labelEn: 'Cancelled',
    icon: XCircle,
    dotColor: 'bg-red-500',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    barClass: 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900',
  },
};

const PROGRESS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

export function OrderCard({ order, onViewDetail, onRetryPayment, onCancel, onReorder, onRequestReturn }: OrderCardProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const displayId = order.numeroPedido || order.id.substring(0, 8).toUpperCase();
  const items = order.items ?? [];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // Progress for shipped orders
  const progressIndex = PROGRESS_STEPS.indexOf(order.status);
  const showProgress = order.status === 'shipped' || order.status === 'delivered';

  return (
    <div className="border border-border rounded-xl overflow-hidden hover:border-border/80 transition-all hover:shadow-sm bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${config.dotColor} ${order.status === 'pending' ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-bold text-foreground">#{displayId}</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
            <StatusIcon className="w-3 h-3" />
            {language === 'es' ? config.label : config.labelEn}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</span>
      </div>

      {/* Items preview */}
      <div className="px-5 py-4">
        {items.length > 0 ? (
          <div className="space-y-2.5">
            {items.slice(0, 2).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            {items.length > 2 && (
              <p className="text-xs text-muted-foreground">+ {items.length - 2} más</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{order.itemCount} {order.itemCount === 1 ? 'artículo' : 'artículos'}</p>
        )}
      </div>

      {/* Mini progress bar for shipped */}
      {showProgress && (
        <div className="px-5 pb-3">
          <div className="flex gap-1">
            {PROGRESS_STEPS.map((step, i) => (
              <div key={step} className={`flex-1 h-1.5 rounded-full ${i <= progressIndex ? 'bg-indigo-500' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t ${config.barClass}`}>
        <span className="text-base font-bold text-foreground">{formatPrice(order.total)}</span>
        <div className="flex items-center gap-3">
          {/* Status-specific actions */}
          {order.status === 'pending' && (
            <>
              <button onClick={() => onCancel(order.id)} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={() => onRetryPayment(order.id)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                {language === 'es' ? 'Pagar ahora →' : 'Pay now →'}
              </button>
            </>
          )}
          {(order.status === 'confirmed' || order.status === 'processing') && (
            <>
              <button onClick={() => onCancel(order.id)} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={() => onViewDetail(order.id)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                {language === 'es' ? 'Ver detalle →' : 'View detail →'}
              </button>
            </>
          )}
          {order.status === 'shipped' && (
            <button onClick={() => onViewDetail(order.id)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
              {language === 'es' ? 'Rastrear pedido →' : 'Track order →'}
            </button>
          )}
          {order.status === 'delivered' && (
            <>
              <button onClick={() => onRequestReturn(order.id)} className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> {language === 'es' ? 'Devolver' : 'Return'}
              </button>
              <button onClick={() => onReorder(order.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {language === 'es' ? 'Re-pedir' : 'Reorder'}
              </button>
              <button onClick={() => onViewDetail(order.id)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                {language === 'es' ? 'Ver detalle →' : 'View detail →'}
              </button>
            </>
          )}
          {order.status === 'cancelled' && (
            <button onClick={() => onReorder(order.id)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              {language === 'es' ? 'Volver a pedir →' : 'Reorder →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
