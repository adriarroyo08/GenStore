import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { stripePromise } from '../../lib/stripe';
import { apiClient } from '../../lib/apiClient';

interface RetryPaymentInnerProps {
  total: number;
  onSuccess: () => void;
}

function RetryPaymentForm({ total, onSuccess }: RetryPaymentInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || (language === 'es' ? 'Error al procesar el pago' : 'Payment processing error'));
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-foreground">{formatPrice(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'es' ? 'Total a pagar' : 'Total to pay'}
        </p>
      </div>
      <PaymentElement options={{ layout: 'accordion' }} />
      {error && (
        <p className="text-sm text-red-500 mt-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isProcessing
          ? (language === 'es' ? 'Procesando...' : 'Processing...')
          : (language === 'es' ? 'Completar pago' : 'Complete payment')
        }
      </button>
    </form>
  );
}

interface RetryPaymentProps {
  orderId: string;
  total: number;
  onSuccess: () => void;
}

export function RetryPayment({ orderId, total, onSuccess }: RetryPaymentProps) {
  const { language } = useLanguage();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getPaymentIntent() {
      try {
        setIsLoading(true);
        const data = await apiClient.post<any>(`/orders/${orderId}/retry-payment`);
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(language === 'es' ? 'No se pudo preparar el pago' : 'Could not prepare payment');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    getPaymentIntent();
  }, [orderId, language]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-amber-200 dark:border-amber-800 p-5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
        </div>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="bg-card rounded-xl border border-red-200 dark:border-red-800 p-5">
        <p className="text-sm text-red-500 text-center">{error || 'Error'}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-2 border-amber-200 dark:border-amber-800 p-5">
      <h3 className="text-base font-bold text-foreground mb-4">
        {language === 'es' ? 'Completar pago' : 'Complete payment'}
      </h3>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <RetryPaymentForm total={total} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}
