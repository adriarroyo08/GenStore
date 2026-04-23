import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { RotateCcw, X } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface ReturnRequestModalProps {
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
  onClose: () => void;
}

const RETURN_REASONS_ES = [
  { value: 'defectuoso', label: 'Producto defectuoso' },
  { value: 'no_coincide', label: 'No coincide con la descripción' },
  { value: 'no_deseado', label: 'Ya no lo quiero' },
  { value: 'otro', label: 'Otro motivo' },
];

const RETURN_REASONS_EN = [
  { value: 'defectuoso', label: 'Defective product' },
  { value: 'no_coincide', label: 'Does not match description' },
  { value: 'no_deseado', label: 'No longer wanted' },
  { value: 'otro', label: 'Other reason' },
];

export function ReturnRequestModal({ orderId, orderNumber, onSuccess, onClose }: ReturnRequestModalProps) {
  const { language } = useLanguage();
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = language === 'es' ? RETURN_REASONS_ES : RETURN_REASONS_EN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post(`/returns?orderId=${orderId}`, {
        motivo,
        descripcion: descripcion || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {language === 'es' ? 'Solicitar devolución' : 'Request return'}
              </h2>
              <p className="text-xs text-muted-foreground">#{orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {language === 'es' ? 'Motivo de la devolución' : 'Return reason'} *
            </label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              required
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">{language === 'es' ? 'Selecciona un motivo' : 'Select a reason'}</option>
              {reasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {language === 'es' ? 'Descripción' : 'Description'}
              {motivo === 'otro' && ' *'}
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required={motivo === 'otro'}
              rows={3}
              placeholder={language === 'es' ? 'Describe el problema...' : 'Describe the issue...'}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-2.5 rounded-lg transition-colors text-sm">
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" disabled={isLoading || !motivo} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {isLoading ? (language === 'es' ? 'Enviando...' : 'Submitting...') : (language === 'es' ? 'Enviar solicitud' : 'Submit request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
