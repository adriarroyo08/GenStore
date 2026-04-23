import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { AlertTriangle, X } from 'lucide-react';

interface CancelOrderModalProps {
  orderId: string;
  orderNumber: string;
  total: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function CancelOrderModal({ orderId, orderNumber, total, onConfirm, onClose }: CancelOrderModalProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          {language === 'es' ? '¿Cancelar pedido?' : 'Cancel order?'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'es'
            ? `¿Estás seguro de que deseas cancelar el pedido #${orderNumber} por ${formatPrice(total)}? Si ya se realizó el pago, se procesará un reembolso.`
            : `Are you sure you want to cancel order #${orderNumber} for ${formatPrice(total)}? If payment was made, a refund will be processed.`}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-2.5 rounded-lg transition-colors text-sm">
            {language === 'es' ? 'No, mantener' : 'No, keep it'}
          </button>
          <button onClick={handleConfirm} disabled={isLoading} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
            {isLoading ? (language === 'es' ? 'Cancelando...' : 'Cancelling...') : (language === 'es' ? 'Sí, cancelar' : 'Yes, cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
