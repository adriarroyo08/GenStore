import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';

interface SavedMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface CheckoutPaymentSectionProps {
  orderId: string | null;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export function CheckoutPaymentSection({ orderId, onBack, onPaymentSuccess }: CheckoutPaymentSectionProps) {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMethods, setSavedMethods] = useState<SavedMethod[]>([]);
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    loadSavedMethods();
  }, []);

  const loadSavedMethods = async () => {
    try {
      const result = await apiClient.get<{ methods: SavedMethod[] }>('/payments/methods');
      setSavedMethods(result.methods || []);
    } catch {
      // No saved methods or not authenticated
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete`,
        },
      });

      if (error) {
        setErrorMessage(error.message ?? 'Error al procesar el pago');
      } else {
        // Payment succeeded — confirm on backend (fallback if webhook doesn't arrive)
        if (orderId) {
          try {
            await apiClient.post('/payments/confirm', { orderId });
          } catch (confirmErr) {
            console.warn('[Payment] Backend confirm fallback failed:', confirmErr);
          }
        }
        onPaymentSuccess();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsProcessing(false);
    }
  };

  const brandIcon = (brand: string) => {
    const icons: Record<string, string> = {
      visa: 'V',
      mastercard: 'MC',
      amex: 'AX',
    };
    return icons[brand.toLowerCase()] || brand.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {t('checkout.paymentMethod')}
      </h2>

      {/* Saved Payment Methods */}
      {savedMethods.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('payment.savedCards', 'Tarjetas guardadas')}
          </h3>
          <div className="space-y-2 mb-4">
            {savedMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="w-10 h-7 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{brandIcon(method.brand)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {method.brand} **** {method.last4}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Exp: {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('payment.orPayWithNewMethod', 'O elige otro método de pago:')}</p>
          </div>
        </div>
      )}

      {/* Stripe Payment Element — shows all enabled methods (card, PayPal, Google/Apple Pay, Klarna, etc.) */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <PaymentElement
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: 'always',
                spacedAccordionItems: true,
              },
              paymentMethodOrder: ['card', 'paypal', 'apple_pay', 'google_pay', 'klarna', 'ideal', 'bancontact', 'eps', 'giropay', 'sofort', 'sepa_debit'],
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              business: {
                name: 'GenStore',
              },
            }}
            onChange={() => setErrorMessage(null)}
          />
        </div>

        {/* Save card checkbox */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="saveCard"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="saveCard" className="text-sm text-gray-700 dark:text-gray-300">
            {t('payment.saveCardForFuture', 'Guardar tarjeta para futuras compras')}
          </label>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Security Info */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('payment.stripeSecurityNotice', 'Pago seguro procesado por Stripe. Aceptamos tarjeta, PayPal, Google Pay, Apple Pay y más.')}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('general.back')}
          </button>
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {isProcessing ? t('payment.processingPayment', 'Procesando pago...') : t('payment.payNow', 'Pagar ahora')}
          </button>
        </div>
      </form>
    </div>
  );
}
