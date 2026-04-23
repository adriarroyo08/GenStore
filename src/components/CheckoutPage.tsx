import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { CartItem } from '../App';
import { CheckoutPaymentSection } from './CheckoutPaymentSection';
import { stripePromise } from '../lib/stripe';
import { apiClient } from '../lib/apiClient';
import { usePoints } from '../hooks/usePoints';
import { PHONE_PREFIXES, SPAIN_PROVINCES, flagUrl } from '../constants/locationData';

interface CheckoutPageProps {
  cart: CartItem[];
  user: any;
  cartTotal: number;
  onBackToCart: () => void;
  onContinueToPayment: () => void;
  onOrderComplete: (orderId: string) => void;
}

export function CheckoutPage({
  cart,
  user,
  cartTotal,
  onBackToCart,
  onContinueToPayment,
  onOrderComplete
}: CheckoutPageProps) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  // Always display checkout prices in EUR (the currency Stripe charges in).
  // Never apply currency conversion here — the backend always charges in EUR.
  const formatEur = (amount: number): string =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string>('');
  const [completedNumeroPedido, setCompletedNumeroPedido] = useState<string>('');

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Server-calculated order data (set after create-intent succeeds)
  const [serverOrderData, setServerOrderData] = useState<{
    subtotal: number;
    descuento: number;
    subtotalAfterDiscount: number;
    impuestos: number;
    tipoIva: number;
    gastosEnvio: number;
    total: number;
  } | null>(null);

  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    phoneCountry: 'ES',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'ES'
  });

  // Cities available for selected province (Spain only)
  const availableCities = useMemo(() => {
    if (shippingInfo.country !== 'ES' || !shippingInfo.state) return [];
    const found = SPAIN_PROVINCES.find(p => p.province === shippingInfo.state);
    return found?.cities ?? [];
  }, [shippingInfo.country, shippingInfo.state]);

  const phonePrefix = PHONE_PREFIXES.find(p => p.code === shippingInfo.phoneCountry)?.prefix ?? '+34';
  const [customCity, setCustomCity] = useState(false);
  const [phonePrefixOpen, setPhonePrefixOpen] = useState(false);
  const phonePrefixRef = useRef<HTMLDivElement>(null);

  // Close phone prefix dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (phonePrefixRef.current && !phonePrefixRef.current.contains(e.target as Node)) {
        setPhonePrefixOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [businessSettings, setBusinessSettings] = useState({
    envio_gratis_umbral: 50,
    coste_envio_estandar: 9.99,
    iva_porcentaje: 8,
    puntos_enabled: true,
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    couponId: string;
    discount: number;
    tipo: string;
    valor: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Points hook
  const { calculatePointsFromAmount } = usePoints(user);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetch('/api/v1/settings/public')
      .then((r) => r.json())
      .then((data) => setBusinessSettings({
        envio_gratis_umbral: data.envio_gratis_umbral ?? 50,
        coste_envio_estandar: data.coste_envio_estandar ?? 9.99,
        iva_porcentaje: data.iva_porcentaje ?? 8,
        puntos_enabled: data.puntos_enabled ?? true,
      }))
      .catch(() => {});
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Calculate totals — always in EUR (raw values, no currency conversion).
  // Before create-intent: client-side estimates using cartTotal (already EUR from DB).
  // After create-intent: use authoritative server-calculated values.
  const discount = serverOrderData?.descuento ?? (appliedCoupon?.discount ?? 0);
  const displaySubtotal = serverOrderData?.subtotal ?? cartTotal;
  const subtotalAfterDiscount = serverOrderData?.subtotalAfterDiscount ?? Math.max(0, cartTotal - (appliedCoupon?.discount ?? 0));
  const shipping = serverOrderData?.gastosEnvio ?? (subtotalAfterDiscount >= businessSettings.envio_gratis_umbral ? 0 : businessSettings.coste_envio_estandar);
  const tax = serverOrderData?.impuestos ?? subtotalAfterDiscount * (businessSettings.iva_porcentaje / 100);
  const totalAmount = serverOrderData?.total ?? (subtotalAfterDiscount + shipping + tax);

  // Points preview
  const pointsEarned = useMemo(
    () => calculatePointsFromAmount(subtotalAfterDiscount),
    [subtotalAfterDiscount, calculatePointsFromAmount]
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await apiClient.post<any>('/coupons/validate', {
        code: couponCode.trim(),
        subtotal: cartTotal,
      });
      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          couponId: result.couponId,
          discount: result.discount,
          tipo: result.tipo,
          valor: result.valor,
        });
        setCouponError('');
      } else {
        setCouponError(result.error || 'Cupón no válido');
        setAppliedCoupon(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setCouponError(msg && msg !== 'Error desconocido' ? msg : 'Código de descuento no válido');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Load user profile + default address
  useEffect(() => {
    if (!user) return;

    // Load profile data
    apiClient.get<any>('/auth/me').then((profile) => {
      setShippingInfo(prev => ({
        ...prev,
        firstName: profile.nombre || prev.firstName,
        lastName: profile.apellidos || prev.lastName,
        email: profile.email || user.email || prev.email,
        phone: profile.telefono || prev.phone,
      }));
    }).catch(() => {});

    // Load saved addresses and use default shipping address
    apiClient.get<any[]>('/addresses').then((addresses) => {
      const defaultAddr = addresses.find((a: any) => a.is_default && a.tipo === 'shipping')
        || addresses.find((a: any) => a.tipo === 'shipping')
        || addresses[0];
      if (defaultAddr) {
        setShippingInfo(prev => ({
          ...prev,
          address: prev.address || defaultAddr.calle || '',
          city: prev.city || defaultAddr.ciudad || '',
          state: prev.state || defaultAddr.provincia || '',
          zipCode: prev.zipCode || defaultAddr.codigo_postal || '',
          country: defaultAddr.pais || prev.country,
        }));
      }
    }).catch(() => {});
  }, [user]);

  const validateShippingInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingInfo.firstName.trim()) newErrors.firstName = t('checkout.firstNameRequired');
    if (!shippingInfo.lastName.trim()) newErrors.lastName = t('checkout.lastNameRequired');
    if (!shippingInfo.email.trim()) newErrors.email = t('checkout.emailRequired');
    if (!shippingInfo.phone.trim()) newErrors.phone = t('checkout.phoneRequired');
    if (!shippingInfo.address.trim()) newErrors.address = t('checkout.addressRequired');
    if (!shippingInfo.city.trim()) newErrors.city = t('checkout.cityRequired');
    if (!shippingInfo.state.trim()) newErrors.state = t('checkout.stateRequired');
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = t('checkout.zipCodeRequired');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (shippingInfo.email && !emailRegex.test(shippingInfo.email)) {
      newErrors.email = t('checkout.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = async () => {
    if (!validateShippingInfo()) return;

    // If we already have a PaymentIntent from a previous step-2 visit, reuse it
    if (clientSecret && orderId) {
      setCurrentStep(2);
      return;
    }

    setIsProcessing(true);
    try {
      // Create or get shipping address
      const fullPhone = shippingInfo.phone.startsWith('+') ? shippingInfo.phone : `${phonePrefix} ${shippingInfo.phone}`;
      const addressResult = await apiClient.post<{ id: string }>('/addresses', {
        tipo: 'shipping',
        nombre: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        telefono: fullPhone,
        calle: shippingInfo.address,
        ciudad: shippingInfo.city,
        codigo_postal: shippingInfo.zipCode,
        provincia: shippingInfo.state,
        pais: shippingInfo.country,
        is_default: false,
      });

      // Create Stripe payment intent
      const result = await apiClient.post<{
        clientSecret: string;
        orderId: string;
        numeroPedido: string;
        orderData: {
          subtotal: number;
          descuento: number;
          subtotalAfterDiscount: number;
          impuestos: number;
          tipoIva: number;
          gastosEnvio: number;
          total: number;
        };
      }>(
        '/payments/create-intent',
        {
          shippingAddressId: addressResult.id,
          paisImpuesto: shippingInfo.country,
          saveCard: false,
          couponCode: appliedCoupon?.code || undefined,
        }
      );

      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setCompletedNumeroPedido(result.numeroPedido);
      setServerOrderData(result.orderData);
      setCurrentStep(2);
    } catch (err) {
      console.error('[Checkout] Error al continuar al pago:', err);
      const msg = err instanceof Error ? err.message : 'Error al crear el pedido';
      showMessage('error', msg && msg !== 'Error desconocido' ? msg : 'Error al procesar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (completedId?: string) => {
    const finalOrderId = completedId || orderId || '';
    setCompletedOrderId(finalOrderId);
    setOrderCompleted(true);
    setCurrentStep(3);

    setTimeout(() => {
      onOrderComplete(finalOrderId);
    }, 5000);
  };

  if (cart.length === 0 && !orderCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('cart.empty')}
          </h2>
          <button
            onClick={onBackToCart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {t('cart.goToCatalog')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Success/Error Message */}
      {message && (
        <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={onBackToCart}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('general.back')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('checkout.title')}
              </h1>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center" aria-current={currentStep === step ? 'step' : undefined}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {currentStep > step ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  {index < 2 && (
                    <div className={`w-16 h-1 mx-4 ${
                      currentStep > step
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-20 text-sm text-gray-600 dark:text-gray-400">
                <span>{t('checkout.shipping')}</span>
                <span>{t('checkout.payment')}</span>
                <span>{t('checkout.confirmation')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Checkout Form */}
            <div className="lg:col-span-2">

              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                  <fieldset>
                  <legend className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    {t('checkout.shippingInformation')}
                  </legend>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="checkout-firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.firstName')} *
                      </label>
                      <input
                        id="checkout-firstName"
                        type="text"
                        aria-required="true"
                        aria-describedby={errors.firstName ? 'error-firstName' : undefined}
                        value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                        className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      {errors.firstName && <p id="error-firstName" role="alert" className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.lastName')} *
                      </label>
                      <input
                        id="checkout-lastName"
                        type="text"
                        aria-required="true"
                        aria-describedby={errors.lastName ? 'error-lastName' : undefined}
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                        className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      {errors.lastName && <p id="error-lastName" role="alert" className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.email')} *
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        aria-required="true"
                        aria-describedby={errors.email ? 'error-email' : undefined}
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      {errors.email && <p id="error-email" role="alert" className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.phone')} *
                      </label>
                      <div className="flex relative">
                        <div ref={phonePrefixRef} className="relative">
                          <button
                            type="button"
                            aria-label="Seleccionar prefijo telefónico"
                            aria-expanded={phonePrefixOpen}
                            onClick={() => setPhonePrefixOpen(prev => !prev)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white text-sm h-full hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                          >
                            <img src={flagUrl(shippingInfo.phoneCountry)} alt={shippingInfo.phoneCountry} className="w-5 h-3.5 object-cover rounded-sm" />
                            <span className="text-xs text-gray-500 dark:text-gray-300">{phonePrefix}</span>
                            <svg className={`w-3 h-3 text-gray-400 transition-transform ${phonePrefixOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {phonePrefixOpen && (
                            <ul className="absolute z-50 top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1">
                              {PHONE_PREFIXES.map(p => (
                                <li key={p.code}>
                                  <button
                                    type="button"
                                    onClick={() => { setShippingInfo({...shippingInfo, phoneCountry: p.code}); setPhonePrefixOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors ${
                                      shippingInfo.phoneCountry === p.code ? 'bg-blue-50 dark:bg-gray-600 font-medium' : ''
                                    }`}
                                  >
                                    <img src={flagUrl(p.code)} alt={p.code} className="w-6 h-4 object-cover rounded-sm" />
                                    <span className="text-gray-900 dark:text-white">{p.code}</span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-auto">{p.prefix}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <input
                          id="checkout-phone"
                          type="tel"
                          aria-required="true"
                          aria-describedby={errors.phone ? 'error-phone' : undefined}
                          placeholder="612 345 678"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                          className={`flex-1 h-12 px-4 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                      </div>
                      {errors.phone && <p id="error-phone" role="alert" className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="checkout-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.address')} *
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        aria-required="true"
                        aria-describedby={errors.address ? 'error-address' : undefined}
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      {errors.address && <p id="error-address" role="alert" className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.state')} *
                      </label>
                      {shippingInfo.country === 'ES' ? (
                        <select
                          id="checkout-state"
                          aria-required="true"
                          aria-describedby={errors.state ? 'error-state' : undefined}
                          value={shippingInfo.state}
                          onChange={(e) => { setShippingInfo({...shippingInfo, state: e.target.value, city: ''}); setCustomCity(false); }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        >
                          <option value="">Selecciona provincia</option>
                          {SPAIN_PROVINCES.map(p => (
                            <option key={p.province} value={p.province}>{p.province}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="checkout-state"
                          type="text"
                          aria-required="true"
                          aria-describedby={errors.state ? 'error-state' : undefined}
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                          className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                      )}
                      {errors.state && <p id="error-state" role="alert" className="text-red-500 text-sm mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.city')} *
                      </label>
                      {shippingInfo.country === 'ES' && availableCities.length > 0 && !customCity ? (
                        <select
                          id="checkout-city"
                          aria-required="true"
                          aria-describedby={errors.city ? 'error-city' : undefined}
                          value={shippingInfo.city}
                          onChange={(e) => {
                            if (e.target.value === '__other') {
                              setCustomCity(true);
                              setShippingInfo({...shippingInfo, city: ''});
                            } else {
                              setShippingInfo({...shippingInfo, city: e.target.value});
                            }
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        >
                          <option value="">Selecciona municipio</option>
                          {availableCities.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="__other">Otro municipio...</option>
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            id="checkout-city"
                            type="text"
                            aria-required="true"
                            aria-describedby={errors.city ? 'error-city' : undefined}
                            placeholder={shippingInfo.country === 'ES' && !shippingInfo.state ? 'Selecciona provincia primero' : 'Escribe tu municipio'}
                            value={shippingInfo.city}
                            onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                            className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          />
                          {customCity && availableCities.length > 0 && (
                            <button
                              type="button"
                              onClick={() => { setCustomCity(false); setShippingInfo({...shippingInfo, city: ''}); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700"
                            >
                              Ver lista
                            </button>
                          )}
                        </div>
                      )}
                      {errors.city && <p id="error-city" role="alert" className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.zipCode')} *
                      </label>
                      <input
                        id="checkout-zipCode"
                        type="text"
                        aria-required="true"
                        aria-describedby={errors.zipCode ? 'error-zipCode' : undefined}
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                        className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      {errors.zipCode && <p id="error-zipCode" role="alert" className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('checkout.country')}
                      </label>
                      <select
                        id="checkout-country"
                        value={shippingInfo.country}
                        onChange={(e) => { setShippingInfo({...shippingInfo, country: e.target.value, state: '', city: ''}); setCustomCity(false); }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="ES">Spain</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="PT">Portugal</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>
                  </fieldset>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleContinueToPayment}
                      disabled={isProcessing}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      {isProcessing ? 'Procesando...' : t('checkout.continueToPayment')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: isDarkMode ? {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#1f2937',
                        colorText: '#f3f4f6',
                        colorTextSecondary: '#9ca3af',
                        colorDanger: '#ef4444',
                        fontFamily: 'inherit',
                        borderRadius: '8px',
                        colorIconTabSelected: '#3b82f6',
                      },
                      rules: {
                        '.Tab': {
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          color: '#d1d5db',
                        },
                        '.Tab--selected': {
                          backgroundColor: '#1f2937',
                          border: '1px solid #3b82f6',
                          color: '#f3f4f6',
                        },
                        '.Tab:hover': {
                          backgroundColor: '#4b5563',
                          color: '#f3f4f6',
                        },
                        '.Input': {
                          backgroundColor: '#374151',
                          border: '1px solid #4b5563',
                          color: '#f3f4f6',
                        },
                        '.Input:focus': {
                          border: '1px solid #3b82f6',
                          boxShadow: '0 0 0 1px #3b82f6',
                        },
                        '.Label': {
                          color: '#d1d5db',
                        },
                        '.Block': {
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                        },
                        '.AccordionItem': {
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                        },
                      },
                    } : {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3b82f6',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                      },
                    },
                  }}
                >
                  <CheckoutPaymentSection
                    orderId={orderId}
                    onBack={() => setCurrentStep(1)}
                    onPaymentSuccess={() => handlePaymentSuccess()}
                  />
                </Elements>
              )}

              {/* Step 3: Order Confirmation */}
              {currentStep === 3 && orderCompleted && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center animate-fade-in">
                  {/* Success animation */}
                  <div className="mb-8">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-20" />
                      <div className="relative bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {t('checkout.orderComplete')}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {t('checkout.orderNumber')}: <span className="font-semibold text-blue-600 dark:text-blue-400">{completedNumeroPedido || completedOrderId}</span>
                    </p>
                  </div>

                  {/* Order summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">{t('checkout.orderSummary')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t('checkout.subtotal')}</span>
                        <span>{formatEur(displaySubtotal)}</span>
                      </div>
                      {(appliedCoupon?.discount ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>{t('checkout.discount')}</span>
                          <span>-{formatEur(appliedCoupon!.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t('checkout.shipping')}</span>
                        <span>{shipping === 0 ? t('checkout.freeShipping') : formatEur(shipping)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{t('checkout.tax')}</span>
                        <span>{formatEur(tax)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-semibold text-gray-900 dark:text-white">
                        <span>{t('checkout.total')}</span>
                        <span>{formatEur(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info messages */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('checkout.confirmationEmail')}
                    </div>
                  </div>

                  {/* Progress bar for redirect */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('checkout.redirecting')}</p>
                    <div className="w-48 h-1 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-progress" />
                    </div>
                  </div>

                  <button
                    onClick={() => onOrderComplete(completedOrderId)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {t('checkout.goToOrders', 'Ir a mis pedidos')}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <aside aria-label="Resumen del pedido" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {t('checkout.orderSummary')}
                </h3>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedColor || 'default'}`} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('general.quantity')}: {item.quantity}
                        </p>
                        {item.selectedColorName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('product.color')}: {item.selectedColorName}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatEur(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cupón de descuento
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                          (-{formatEur(appliedCoupon.discount)})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Código de cupón"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium"
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-xs mt-1">{couponError}</p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('checkout.subtotal')}</span>
                    <span className="text-gray-900 dark:text-white">{formatEur(displaySubtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">Descuento ({appliedCoupon.code})</span>
                      <span className="text-green-600 dark:text-green-400">-{formatEur(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('checkout.shipping')}</span>
                    <span className="text-gray-900 dark:text-white">
                      {shipping === 0 ? t('checkout.free') : formatEur(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('checkout.tax')}</span>
                    <span className="text-gray-900 dark:text-white">{formatEur(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="text-gray-900 dark:text-white">{t('checkout.total')}</span>
                    <span className="text-gray-900 dark:text-white">{formatEur(totalAmount)}</span>
                  </div>
                </div>

                {/* Points Preview (only if system is enabled) */}
                {businessSettings.puntos_enabled && pointsEarned > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          Ganarás <strong>{pointsEarned} puntos</strong> con esta compra
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          Canjéalos por descuentos en futuras compras
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Free Shipping Message */}
                {shipping > 0 && Math.max(0, businessSettings.envio_gratis_umbral - subtotalAfterDiscount) > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {formatEur(Math.max(0, businessSettings.envio_gratis_umbral - subtotalAfterDiscount))} {t('checkout.moreForFreeShipping')}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
