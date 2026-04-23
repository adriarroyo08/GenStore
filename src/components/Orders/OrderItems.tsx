import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Package } from 'lucide-react';
import type { OrderDetailItem } from '../../hooks/useOrderDetail';

interface OrderItemsProps {
  items: OrderDetailItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">
        {language === 'es' ? `Artículos (${items.length})` : `Items (${items.length})`}
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-muted" />
            ) : (
              <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'es' ? 'Cantidad' : 'Qty'}: {item.quantity}
                {item.selectedColorName && ` · ${item.selectedColorName}`}
              </p>
            </div>
            <span className="text-sm font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
