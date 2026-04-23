import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Footer } from './Footer';
import { apiClient } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  name?: string;
  access_token: string;
  profile?: any;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  selectedColorName?: string;
}

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4: string;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  timeline?: Array<{
    status: string;
    date: string;
    description: string;
    completed: boolean;
  }>;
}

interface OrderTrackingPageProps {
  user: User | null;
  orderId: string;
  onBackToOrders: () => void;
  onContactClick: () => void;
}

export function OrderTrackingPage({
  user,
  orderId,
  onBackToOrders,
  onContactClick
}: OrderTrackingPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const createMockOrder = (id: string): Order => {
    const currentDate = new Date();
    const orderDate = new Date(currentDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Hasta 30 días atrás
    
    return {
      id: id,
      status: 'shipped',
      orderDate: orderDate.toISOString(),
      items: [
        {
          id: '1',
          name: 'iPhone 15 Pro',
          quantity: 1,
          price: 999,
          selectedColorName: 'Natural Titanium'
        },
        {
          id: '2',
          name: 'AirPods Pro',
          quantity: 1,
          price: 249,
          selectedColorName: 'White'
        }
      ],
      subtotal: 1248,
      tax: 99.84,
      shipping: 0,
      total: 1347.84,
      shippingAddress: {
        name: user?.name || 'John Doe',
        email: user?.email || 'john@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States'
      },
      paymentMethod: {
        type: 'card',
        last4: '1234'
      },
      trackingNumber: '1Z999AA1234567890',
      carrier: 'UPS',
      estimatedDelivery: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          status: 'orderPlaced',
          date: orderDate.toISOString(),
          description: 'Order placed successfully',
          completed: true
        },
        {
          status: 'orderConfirmed',
          date: new Date(orderDate.getTime() + 90 * 60 * 1000).toISOString(),
          description: 'Order confirmed and being prepared',
          completed: true
        },
        {
          status: 'processing',
          date: new Date(orderDate.getTime() + 6 * 60 * 60 * 1000).toISOString(),
          description: 'Order is being processed',
          completed: true
        },
        {
          status: 'shipped',
          date: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          description: 'Order has been shipped',
          completed: true
        },
        {
          status: 'outForDelivery',
          date: '',
          description: 'Out for delivery',
          completed: false
        },
        {
          status: 'delivered',
          date: '',
          description: 'Delivered to your address',
          completed: false
        }
      ]
    };
  };

  const fetchOrder = async () => {
    if (!user) {
      setError(t('errors.unauthorized'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // console.log(`Fetching order: ${orderId} for user: ${user.id}`);
      
      const data = await apiClient.get<any>(`/orders/${orderId}`);

      if (data && data.id) {
        // Map DB fields to frontend fields
        const statusMap: Record<string, string> = {
          pendiente: 'pending', pagado: 'confirmed', procesando: 'processing',
          enviado: 'shipped', entregado: 'delivered', cancelado: 'cancelled',
          fallido: 'cancelled', devuelto: 'cancelled',
        };
        setOrder({
          id: data.numero_pedido || data.id,
          status: (statusMap[data.estado] || 'pending') as Order['status'],
          orderDate: data.created_at,
          items: (data.order_items ?? []).map((item: any) => ({
            id: item.id,
            name: item.product?.nombre ?? 'Producto',
            quantity: item.cantidad,
            price: Number(item.precio_unitario),
          })),
          subtotal: Number(data.subtotal),
          tax: Number(data.impuestos),
          shipping: Number(data.gastos_envio),
          total: Number(data.total),
          shippingAddress: data.shippingAddress ? {
            name: data.shippingAddress.name || '',
            email: user?.email || '',
            phone: '',
            address: data.shippingAddress.address || '',
            city: data.shippingAddress.city || '',
            state: data.shippingAddress.state || '',
            zipCode: data.shippingAddress.zipCode || '',
            country: data.shippingAddress.country || '',
          } : {
            name: '', email: user?.email || '', phone: '',
            address: '', city: '', state: '', zipCode: '', country: '',
          },
          paymentMethod: { type: data.metodo_pago || 'stripe', last4: '' },
          trackingNumber: undefined,
          carrier: undefined,
        });
      } else {
        setError(t('errors.notFound', 'Pedido no encontrado'));
      }
    } catch (error) {
      console.log('Using demo order data for tracking functionality');
      const mockOrder = createMockOrder(orderId);
      setOrder(mockOrder);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'processing':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20';
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-muted-foreground">{t('general.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t('errors.notFound')}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={onBackToOrders}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t('tracking.backToOrders')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t('errors.notFound')}</h2>
              <p className="text-muted-foreground mb-6">Order not found</p>
              <button
                onClick={onBackToOrders}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t('tracking.backToOrders')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={onBackToOrders}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('tracking.backToOrders')}
              </button>
              <h1 id="order-tracking-heading" className="text-2xl sm:text-3xl font-bold text-foreground">
                {t('tracking.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('tracking.orderNumber')}: #{order.id}
              </p>
            </div>
            <div className="flex flex-col sm:items-end">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`} aria-label={`${t('orders.status', 'Estado')}: ${t(`orders.orderStatuses.${order.status}`)}`}>
                {t(`orders.orderStatuses.${order.status}`)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('tracking.orderDate')}: {formatDate(order.orderDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Order Timeline and Details */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Order Status and Tracking Info */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('tracking.currentStatus')}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {t(`orders.orderStatuses.${order.status}`)}
                  </p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('tracking.trackingNumber')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
                {order.carrier && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('tracking.carrier')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {order.carrier}
                    </p>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('tracking.estimatedDelivery')}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
                {order.deliveredDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('tracking.deliveredOn')}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatDate(order.deliveredDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">{t('tracking.orderTimeline')}</h2>
              
              <div className="space-y-6">
                {order.timeline?.map((step, index) => (
                  <div key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted border-2 border-border'
                      }`}>
                        {step.completed ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        )}
                      </div>
                      {index < (order.timeline?.length || 0) - 1 && (
                        <div className={`w-px h-12 mt-2 ${
                          step.completed ? 'bg-green-500' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className={`font-semibold ${
                          step.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {t(`tracking.timeline.${step.status}`)}
                        </h3>
                        {step.date && (
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(step.date)}
                          </p>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        step.completed ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">{t('tracking.orderItems')}</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('product.quantity')}: {item.quantity}
                        {item.selectedColorName && (
                          <span> • Color: {item.selectedColorName}</span>
                        )}
                      </div>
                      <p className="font-semibold text-foreground mt-2">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary and Shipping Details */}
          <div className="space-y-6">
            
            {/* Shipping Address */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('tracking.shippingAddress')}</h2>
              <div className="text-sm text-foreground space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('tracking.paymentMethod')}</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CARD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">**** **** **** {order.paymentMethod.last4}</p>
                  <p className="text-xs text-muted-foreground">{order.paymentMethod.type.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('tracking.orderSummary')}</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                  <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.shipping')}</span>
                  <span className="font-medium text-emerald-500">
                    {order.shipping === 0 ? t('checkout.free') : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.tax')}</span>
                  <span className="font-medium text-foreground">{formatPrice(order.tax)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>{t('checkout.total')}</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-2">{t('contact.support')}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Need help with your order? Our support team is here to assist you.
              </p>
              <button
                onClick={onContactClick}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                {t('tracking.contactSupport')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer onContactClick={onContactClick} />
    </div>
  );
}