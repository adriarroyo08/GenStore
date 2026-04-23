import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { OrderDetail } from '../../hooks/useOrderDetail';

interface OrderSummaryProps {
  order: OrderDetail;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-base font-bold text-foreground mb-4">
        {language === 'es' ? 'Resumen' : 'Summary'}
      </h2>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{language === 'es' ? 'Envío' : 'Shipping'}</span>
          <span className={`font-medium ${order.shipping === 0 ? 'text-green-500' : 'text-foreground'}`}>
            {order.shipping === 0 ? (language === 'es' ? 'Gratis' : 'Free') : formatPrice(order.shipping)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{language === 'es' ? 'Impuestos' : 'Tax'}</span>
          <span className="font-medium text-foreground">{formatPrice(order.tax)}</span>
        </div>
        <div className="border-t border-border pt-2.5">
          <div className="flex justify-between font-bold text-foreground text-base">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mt-5 pt-5 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-2">
            {language === 'es' ? 'Dirección de envío' : 'Shipping address'}
          </h3>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {order.paymentMethod && (
        <div className="mt-5 pt-5 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-2">
            {language === 'es' ? 'Método de pago' : 'Payment method'}
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-indigo-500 rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">CARD</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">•••• {order.paymentMethod.last4 || '****'}</p>
              <p className="text-xs text-muted-foreground">{order.paymentMethod.type.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
