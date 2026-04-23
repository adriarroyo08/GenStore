import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrderDetail } from '../../hooks/useOrderDetail';
import { OrderStatusHero } from './OrderStatusHero';
import { OrderTimeline } from './OrderTimeline';
import { OrderItems } from './OrderItems';
import { OrderSummary } from './OrderSummary';
import { OrderActions } from './OrderActions';
import { RetryPayment } from './RetryPayment';
import { CancelOrderModal } from './CancelOrderModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface OrderDetailPageProps {
  user: any;
  orderId: string;
  onBackToOrders: () => void;
  onContactClick: () => void;
}

export function OrderDetailPage({ user, orderId, onBackToOrders, onContactClick }: OrderDetailPageProps) {
  const { language } = useLanguage();
  const { order, isLoading, error, refetch } = useOrderDetail(orderId, user);
  const [cancelModal, setCancelModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {language === 'es' ? 'Pedido no encontrado' : 'Order not found'}
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button onClick={onBackToOrders} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors">
              {language === 'es' ? '← Volver a pedidos' : '← Back to orders'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    await apiClient.post(`/orders/${orderId}/cancel`);
    refetch();
  };

  const handleDownloadInvoice = async () => {
    try {
      const data = await apiClient.get<any>(`/orders/${orderId}/invoice`);
      if (data.url) window.open(data.url, '_blank');
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button onClick={onBackToOrders} className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {language === 'es' ? 'Volver a pedidos' : 'Back to orders'}
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="xl:col-span-2 space-y-6">
            <OrderStatusHero order={order} />

            {/* Timeline for shipped/delivered */}
            {order.shipment && (
              <OrderTimeline events={order.shipment.events} shipmentStatus={order.shipment.estado} />
            )}

            {/* Fallback: no shipment yet for non-shipped */}
            {!order.shipment && !['pending', 'cancelled'].includes(order.status) && (
              <OrderTimeline events={[]} shipmentStatus="" />
            )}

            <OrderItems items={order.items} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Retry payment for pending orders */}
            {order.status === 'pending' && (
              <RetryPayment orderId={orderId} total={order.total} onSuccess={refetch} />
            )}

            <OrderSummary order={order} />

            <OrderActions
              order={order}
              onCancel={() => setCancelModal(true)}
              onRequestReturn={() => setReturnModal(true)}
              onReorder={() => {}}
              onContact={onContactClick}
              onDownloadInvoice={handleDownloadInvoice}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {cancelModal && (
        <CancelOrderModal
          orderId={orderId}
          orderNumber={order.numeroPedido}
          total={order.total}
          onConfirm={handleCancel}
          onClose={() => setCancelModal(false)}
        />
      )}
      {returnModal && (
        <ReturnRequestModal
          orderId={orderId}
          orderNumber={order.numeroPedido}
          onSuccess={refetch}
          onClose={() => setReturnModal(false)}
        />
      )}
    </div>
  );
}
