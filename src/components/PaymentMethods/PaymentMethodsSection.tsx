import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PaymentMethodIcon } from './PaymentMethodIcon';
import { apiClient } from '../../lib/apiClient';
import { stripePromise } from '../../lib/stripe';

interface SavedMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PaymentMethodsSectionProps {
  showMessage?: (type: 'success' | 'error', text: string) => void;
}

function AddCardForm({ onSuccess, onCancel, showMsg }: {
  onSuccess: () => void;
  onCancel: () => void;
  showMsg: (type: 'success' | 'error', text: string) => void;
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardholderName.trim()) {
      setError(t('payment.cardholderRequired', 'El nombre del titular es obligatorio'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create SetupIntent on server (secure)
      const { clientSecret } = await apiClient.post<{ clientSecret: string }>('/payments/setup-intent', {});

      // 2. Confirm with Stripe Elements (card data never touches our server)
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: cardholderName.trim() },
        },
      });

      if (stripeError) {
        setError(stripeError.message ?? t('payment.errorAddingCard', 'Error al añadir la tarjeta'));
        return;
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // 3. Attach payment method to customer on server
        await apiClient.post('/payments/methods', {
          paymentMethodId: setupIntent.payment_method,
        });

        showMsg('success', t('payment.cardAdded', 'Tarjeta añadida correctamente'));
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.errorAddingCard', 'Error al añadir la tarjeta'));
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#f3f4f6' : '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
      },
      invalid: { color: '#ef4444' },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder Name */}
      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium text-foreground mb-1.5">
          {t('payment.cardholderName', 'Nombre del titular')}
        </label>
        <input
          id="cardholderName"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder={t('payment.cardholderPlaceholder', 'Nombre como aparece en la tarjeta')}
          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          autoComplete="cc-name"
        />
      </div>

      {/* Stripe CardElement (secure - PCI compliant) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t('payment.cardDetails', 'Datos de la tarjeta')}
        </label>
        <div className="px-3 py-3 border border-border rounded-lg bg-card">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {t('payment.stripeSecurityNotice', 'Tus datos de tarjeta se procesan de forma segura por Stripe. Nunca se almacenan en nuestros servidores.')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors text-sm"
        >
          {t('general.cancel', 'Cancelar')}
        </button>
        <button
          type="submit"
          disabled={isLoading || !stripe}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isLoading ? t('general.saving', 'Guardando...') : t('payment.saveCard', 'Guardar tarjeta')}
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodsSection({ showMessage: externalShowMessage }: PaymentMethodsSectionProps) {
  const { t } = useLanguage();
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<SavedMethod | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    if (externalShowMessage) {
      externalShowMessage(type, text);
    } else {
      setMessage({ type, text });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ methods: SavedMethod[] }>('/payments/methods');
      setMethods(data.methods || []);
    } catch {
      // User may not have a Stripe customer yet — show empty state
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (method: SavedMethod) => {
    try {
      await apiClient.delete(`/payments/methods/${method.id}`);
      setMethods(prev => prev.filter(m => m.id !== method.id));
      showMsg('success', t('payment.cardRemoved', 'Tarjeta eliminada'));
    } catch {
      showMsg('error', t('payment.errorRemovingCard', 'Error al eliminar la tarjeta'));
    }
    setDeleteConfirm(null);
  };

  const brandLabel = (brand: string) => {
    const map: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover' };
    return map[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const brandColor = (brand: string) => {
    const map: Record<string, string> = {
      visa: 'bg-blue-600',
      mastercard: 'bg-orange-500',
      amex: 'bg-indigo-600',
    };
    return map[brand.toLowerCase()] || 'bg-gray-600';
  };

  return (
    <div className="space-y-5">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('payment.securityInfo', 'Tus datos de pago están protegidos')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('payment.pciCompliant', 'Cumplimiento PCI DSS')} &middot; {t('payment.ssl256Encryption', 'Cifrado SSL 256-bit')}
          </p>
        </div>

        {!showAddCard && (
          <button
            onClick={() => setShowAddCard(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {t('payment.addNewCard', 'Añadir tarjeta')}
          </button>
        )}
      </div>

      {/* Add Card Form (Stripe Elements - secure) */}
      {showAddCard && (
        <div className="border border-border rounded-lg p-5 bg-card">
          <h3 className="text-base font-semibold text-foreground mb-4">
            {t('payment.addNewCard', 'Añadir tarjeta')}
          </h3>
          <Elements stripe={stripePromise}>
            <AddCardForm
              onSuccess={() => { setShowAddCard(false); loadMethods(); }}
              onCancel={() => setShowAddCard(false)}
              showMsg={showMsg}
            />
          </Elements>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          <span className="ml-3 text-sm text-muted-foreground">{t('general.loading', 'Cargando...')}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && methods.length === 0 && !showAddCard && (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <svg className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="text-base font-medium text-foreground mb-1">
            {t('payment.noPaymentMethods', 'No tienes métodos de pago')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('payment.addPaymentMethodDesc', 'Añade una tarjeta para hacer tus compras más rápidas y seguras.')}
          </p>
          <button
            onClick={() => setShowAddCard(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {t('payment.addNewCard', 'Añadir tarjeta')}
          </button>
        </div>
      )}

      {/* Card List */}
      {!isLoading && methods.length > 0 && (
        <div className="space-y-3">
          {methods.map((method, i) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                i === 0
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-7 ${brandColor(method.brand)} rounded flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{brandLabel(method.brand).substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {brandLabel(method.brand)} **** {method.last4}
                    </p>
                    {i === 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                        {t('payment.primary', 'Principal')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('payment.expires', 'Expira')} {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeleteConfirm(method)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                {t('payment.remove', 'Eliminar')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl max-w-sm w-full p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t('payment.confirmRemove', '¿Eliminar tarjeta?')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {brandLabel(deleteConfirm.brand)} **** {deleteConfirm.last4}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              {t('payment.confirmRemoveDesc', 'Esta acción no se puede deshacer. La tarjeta se eliminará de tu cuenta.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors text-sm"
              >
                {t('general.cancel', 'Cancelar')}
              </button>
              <button
                onClick={() => handleRemove(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {t('payment.remove', 'Eliminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
