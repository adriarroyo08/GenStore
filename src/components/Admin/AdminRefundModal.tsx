import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface AdminRefundModalProps {
  orderId: number;
  orderTotal: number;
  previousRefunds: number;
  onClose: () => void;
  onRefunded: () => void;
}

export function AdminRefundModal({
  orderId,
  orderTotal,
  previousRefunds,
  onClose,
  onRefunded,
}: AdminRefundModalProps) {
  const maxRefund = Math.round((orderTotal - previousRefunds) * 100) / 100;
  const [amount, setAmount] = useState(maxRefund);
  const [motivo, setMotivo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!motivo.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    if (amount <= 0 || amount > maxRefund) {
      setError(`El monto debe ser entre 0.01 y ${maxRefund.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/orders/${orderId}/refund`, {
        amount: amount === maxRefund ? null : amount,
        motivo: motivo.trim(),
      });
      onRefunded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el reembolso');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-labelledby="refund-modal-title">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 id="refund-modal-title" className="text-lg font-semibold text-white">Procesar reembolso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-red-900/20 border border-red-700 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm">
              Esta accion procesara un reembolso a traves de Stripe. No se puede deshacer.
            </p>
          </div>

          <div>
            <label htmlFor="field-admin-refund-amount" className="block text-sm font-medium text-gray-300 mb-1">
              Monto ({formatCurrency(maxRefund)} disponible)
            </label>
            <input
              id="field-admin-refund-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefund}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="field-admin-refund-motivo" className="block text-sm font-medium text-gray-300 mb-1">
              Motivo <span className="text-red-400">*</span>
            </label>
            <textarea
              id="field-admin-refund-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Motivo del reembolso..."
              required
              aria-required="true"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Procesando...' : `Reembolsar ${formatCurrency(amount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
