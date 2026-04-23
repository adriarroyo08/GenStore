import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FileText, MessageCircle, RotateCcw, RefreshCw, XCircle } from 'lucide-react';
import type { OrderDetail } from '../../hooks/useOrderDetail';

interface OrderActionsProps {
  order: OrderDetail;
  onCancel: () => void;
  onRequestReturn: () => void;
  onReorder: () => void;
  onContact: () => void;
  onDownloadInvoice: () => void;
}

export function OrderActions({ order, onCancel, onRequestReturn, onReorder, onContact, onDownloadInvoice }: OrderActionsProps) {
  const { language } = useLanguage();
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered';
  const canReorder = ['delivered', 'cancelled'].includes(order.status);
  const canDownloadInvoice = ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">
        {language === 'es' ? 'Acciones' : 'Actions'}
      </h3>
      <div className="flex flex-col gap-2">
        {canDownloadInvoice && (
          <button onClick={onDownloadInvoice} className="flex items-center gap-2 w-full bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <FileText className="w-4 h-4" />
            {language === 'es' ? 'Descargar factura' : 'Download invoice'}
          </button>
        )}
        {canReorder && (
          <button onClick={onReorder} className="flex items-center gap-2 w-full bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            {language === 'es' ? 'Volver a pedir' : 'Reorder'}
          </button>
        )}
        {canReturn && (
          <button onClick={onRequestReturn} className="flex items-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" />
            {language === 'es' ? 'Solicitar devolución' : 'Request return'}
          </button>
        )}
        {canCancel && (
          <button onClick={onCancel} className="flex items-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <XCircle className="w-4 h-4" />
            {language === 'es' ? 'Cancelar pedido' : 'Cancel order'}
          </button>
        )}
        <button onClick={onContact} className="flex items-center gap-2 w-full bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <MessageCircle className="w-4 h-4" />
          {language === 'es' ? 'Contactar soporte' : 'Contact support'}
        </button>
      </div>
    </div>
  );
}
