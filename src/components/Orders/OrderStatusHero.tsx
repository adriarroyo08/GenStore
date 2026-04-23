import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Clock, CheckCircle, Settings, Truck, Package, XCircle } from 'lucide-react';
import type { OrderDetail } from '../../hooks/useOrderDetail';

interface OrderStatusHeroProps {
  order: OrderDetail;
}

const HERO_CONFIG: Record<string, {
  gradient: string;
  icon: React.ElementType;
  messageEs: string;
  messageEn: string;
}> = {
  pending: {
    gradient: 'from-amber-500 to-orange-500',
    icon: Clock,
    messageEs: 'Completa el pago para procesar tu pedido',
    messageEn: 'Complete payment to process your order',
  },
  confirmed: {
    gradient: 'from-blue-500 to-indigo-500',
    icon: CheckCircle,
    messageEs: 'Estamos preparando tu pedido',
    messageEn: 'We are preparing your order',
  },
  processing: {
    gradient: 'from-purple-500 to-violet-500',
    icon: Settings,
    messageEs: 'Tu pedido está siendo procesado',
    messageEn: 'Your order is being processed',
  },
  shipped: {
    gradient: 'from-indigo-500 to-blue-600',
    icon: Truck,
    messageEs: 'Tu pedido está en camino',
    messageEn: 'Your order is on its way',
  },
  delivered: {
    gradient: 'from-green-500 to-emerald-500',
    icon: Package,
    messageEs: 'Tu pedido ha sido entregado',
    messageEn: 'Your order has been delivered',
  },
  cancelled: {
    gradient: 'from-red-500 to-rose-500',
    icon: XCircle,
    messageEs: 'Este pedido ha sido cancelado',
    messageEn: 'This order has been cancelled',
  },
};

const PROGRESS_STEPS = [
  { key: 'confirmed', labelEs: 'Confirmado', labelEn: 'Confirmed' },
  { key: 'processing', labelEs: 'Procesando', labelEn: 'Processing' },
  { key: 'shipped', labelEs: 'Enviado', labelEn: 'Shipped' },
  { key: 'delivered', labelEs: 'Entregado', labelEn: 'Delivered' },
];

export function OrderStatusHero({ order }: OrderStatusHeroProps) {
  const { language } = useLanguage();
  const config = HERO_CONFIG[order.status] || HERO_CONFIG.pending;
  const HeroIcon = config.icon;

  const progressIndex = PROGRESS_STEPS.findIndex(s => s.key === order.status);
  const showProgress = !['pending', 'cancelled'].includes(order.status);

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 sm:p-8 text-white`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <HeroIcon className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">#{order.numeroPedido}</h1>
          <p className="text-white/80 mt-1">
            {language === 'es' ? config.messageEs : config.messageEn}
          </p>
          {order.status === 'shipped' && order.shipment && (
            <div className="mt-2 text-sm text-white/70">
              {order.shipment.carrier.toUpperCase()} · {order.shipment.tracking_number}
            </div>
          )}
          {order.status === 'delivered' && (
            <div className="mt-2 text-sm text-white/70">
              {language === 'es' ? 'Entregado el' : 'Delivered on'} {formatDate(order.orderDate)}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mt-6">
          <div className="flex gap-1.5">
            {PROGRESS_STEPS.map((step, i) => (
              <div key={step.key} className={`flex-1 h-1.5 rounded-full ${i <= progressIndex ? 'bg-white/90' : 'bg-white/25'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {PROGRESS_STEPS.map((step, i) => (
              <span key={step.key} className={`text-xs ${i <= progressIndex ? 'text-white/90' : 'text-white/40'}`}>
                {language === 'es' ? step.labelEs : step.labelEn}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
