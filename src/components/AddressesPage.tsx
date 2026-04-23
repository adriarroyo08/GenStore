import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { AccountLayout } from './AccountLayout';
import { Product, CartItem } from '../App';
import { apiClient } from '../lib/apiClient';
import { Plus, MapPin, Truck, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface AddressesPageProps {
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  onBackToAccount: () => void;
  onCartClick: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  name: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  userId?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddressFormData {
  type: 'shipping' | 'billing';
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export function AddressesPage({
  user,
  searchQuery,
  setSearchQuery,
  cartItemsCount,
  cart,
  updateQuantity,
  removeFromCart,
  cartTotal,
  onLoginClick,
  onLogout,
  onBackToAccount,
  onCartClick,
  products,
  onProductSelect,
  onSearch,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick
}: AddressesPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isDarkMode } = useTheme();

  // Real addresses from backend
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses from backend
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!user?.access_token) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await apiClient.get<any>('/addresses');
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Error loading addresses');
    } finally {
      setLoading(false);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Address | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    type: 'shipping',
    name: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!addressForm.name.trim()) errors.name = t('addresses.nameRequired');
    if (!addressForm.address1.trim()) errors.address1 = t('addresses.addressRequired');
    if (!addressForm.city.trim()) errors.city = t('addresses.cityRequired');
    if (!addressForm.state.trim()) errors.state = t('addresses.stateRequired');
    if (!addressForm.zipCode.trim()) errors.zipCode = t('addresses.zipRequired');
    if (!addressForm.country.trim()) errors.country = t('addresses.countryRequired');
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;
    if (!user?.access_token) {
      showMessage('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const addressData = {
        type: addressForm.type,
        isDefault: addressForm.isDefault,
        name: addressForm.name,
        company: addressForm.company || null,
        address1: addressForm.address1,
        address2: addressForm.address2 || null,
        city: addressForm.city,
        state: addressForm.state,
        zipCode: addressForm.zipCode,
        country: addressForm.country,
        phone: addressForm.phone || null
      };

      const addressPayload = { address: addressData };
      const data = editingAddress
        ? await apiClient.put<any>(`/addresses/${editingAddress.id}`, addressPayload)
        : await apiClient.post<any>('/addresses', addressPayload);
      
      // Refresh addresses from backend
      await fetchAddresses();

      showMessage('success', editingAddress ? t('addresses.addressUpdated') : t('addresses.addressAdded'));
      setShowAddModal(false);
      setEditingAddress(null);
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      showMessage('error', error instanceof Error ? error.message : (editingAddress ? t('addresses.saveError') : t('addresses.saveError')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      name: address.name,
      company: address.company || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault
    });
    setShowAddModal(true);
  };

  const handleDeleteAddress = async (address: Address) => {
    if (!user?.access_token) {
      showMessage('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.delete<any>(`/addresses/${address.id}`);

      // Refresh addresses from backend
      await fetchAddresses();
      
      setShowDeleteConfirm(null);
      showMessage('success', t('addresses.addressDeleted'));
    } catch (error) {
      console.error('Error deleting address:', error);
      showMessage('error', error instanceof Error ? error.message : t('addresses.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (!user?.access_token) {
      showMessage('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.put<any>(`/addresses/${address.id}/default`, {});

      // Refresh addresses from backend
      await fetchAddresses();
      
      showMessage('success', t('addresses.defaultAddressUpdated'));
    } catch (error) {
      console.error('Error setting default address:', error);
      showMessage('error', error instanceof Error ? error.message : t('addresses.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAddressForm({
      type: 'shipping',
      name: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      phone: '',
      isDefault: false
    });
    setFormErrors({});
  };

  const handleFormChange = (field: keyof AddressFormData, value: string | boolean) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
  const billingAddresses = addresses.filter(addr => addr.type === 'billing');

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Spain',
    'France',
    'Germany',
    'Italy',
    'Netherlands',
    'Australia',
    'Japan',
    'Mexico',
    'Brazil',
    'Argentina',
    'Chile',
    'Colombia'
  ];

  // If still loading — show skeleton within layout
  if (loading) {
    return (
      <AccountLayout
        user={user}
        currentPage="addresses"
        onProfileClick={onProfileClick}
        onOrdersClick={onOrdersClick}
        onAddressesClick={onAddressesClick}
        onPaymentMethodsClick={onPaymentMethodsClick}
        onWishlistClick={onWishlistClick}
        onRewardsClick={onRewardsClick}
        onSettingsClick={onSettingsClick}
        onAdminClick={onAdminClick}
        onLogout={onLogout}
        pageTitle={t('addresses.savedAddresses')}
        pageDescription={t('addresses.manageShippingBilling')}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-12 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse p-6 rounded-xl bg-muted/50 space-y-3">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      {/* Success/Error Message */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      <AccountLayout
        user={user}
        currentPage="addresses"
        onProfileClick={onProfileClick}
        onOrdersClick={onOrdersClick}
        onAddressesClick={onAddressesClick}
        onPaymentMethodsClick={onPaymentMethodsClick}
        onWishlistClick={onWishlistClick}
        onRewardsClick={onRewardsClick}
        onSettingsClick={onSettingsClick}
        onAdminClick={onAdminClick}
        onLogout={onLogout}
        pageTitle={t('addresses.savedAddresses')}
        pageDescription={t('addresses.manageShippingBilling')}
      >
        <section aria-labelledby="addresses-heading">
        <h2 id="addresses-heading" className="sr-only">{t('addresses.savedAddresses')}</h2>
        <div className="space-y-8">
          
          {/* Add Address Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('addresses.addNewAddress')}
            </button>
          </div>

          {/* Address Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <MapPin className="w-6 h-6" />, value: addresses.length, label: t('addresses.totalAddresses'), bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
              { icon: <Truck className="w-6 h-6" />, value: shippingAddresses.length, label: t('addresses.shipping'), bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
              { icon: <CreditCard className="w-6 h-6" />, value: billingAddresses.length, label: t('addresses.billing'), bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className={`${stat.bg} p-6 rounded-xl border`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${stat.iconBg} p-2 rounded-lg`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Shipping Addresses */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              {t('addresses.shippingAddresses')}
            </h3>
            {shippingAddresses.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No shipping addresses</h4>
                <p className="text-muted-foreground mb-4">{t('addresses.noShippingAddresses')}</p>
                <button
                  onClick={() => {
                    setAddressForm(prev => ({ ...prev, type: 'shipping' }));
                    setShowAddModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {t('addresses.addNewAddress')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingAddresses.map((address) => (
                  <div key={address.id} className="bg-muted/50 p-6 rounded-xl relative hover:shadow-md transition-shadow">
                    {address.isDefault && (
                      <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                        {t('addresses.default')}
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-foreground">{address.name}</div>
                      {address.company && <div className="text-muted-foreground">{address.company}</div>}
                      <div className="text-muted-foreground">{address.address1}</div>
                      {address.address2 && <div className="text-muted-foreground">{address.address2}</div>}
                      <div className="text-muted-foreground">{address.city}, {address.state} {address.zipCode}</div>
                      <div className="text-muted-foreground">{address.country}</div>
                      {address.phone && <div className="text-muted-foreground">{address.phone}</div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditAddress(address)}
                        disabled={isLoading}
                        aria-label={`${t('addresses.edit')} ${address.name}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                      >
                        {t('addresses.edit')}
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium disabled:opacity-50"
                        >
                          {t('addresses.setDefault')}
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteConfirm(address)}
                        disabled={isLoading}
                        aria-label={`${t('addresses.delete')} ${address.name}`}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        {t('addresses.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Addresses */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              {t('addresses.billingAddresses')}
            </h3>
            {billingAddresses.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">No billing addresses</h4>
                <p className="text-muted-foreground mb-4">{t('addresses.noBillingAddresses')}</p>
                <button
                  onClick={() => {
                    setAddressForm(prev => ({ ...prev, type: 'billing' }));
                    setShowAddModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {t('addresses.addNewAddress')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {billingAddresses.map((address) => (
                  <div key={address.id} className="bg-muted/50 p-6 rounded-xl relative hover:shadow-md transition-shadow">
                    {address.isDefault && (
                      <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                        {t('addresses.default')}
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      <div className="font-semibold text-foreground">{address.name}</div>
                      {address.company && <div className="text-muted-foreground">{address.company}</div>}
                      <div className="text-muted-foreground">{address.address1}</div>
                      {address.address2 && <div className="text-muted-foreground">{address.address2}</div>}
                      <div className="text-muted-foreground">{address.city}, {address.state} {address.zipCode}</div>
                      <div className="text-muted-foreground">{address.country}</div>
                      {address.phone && <div className="text-muted-foreground">{address.phone}</div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEditAddress(address)}
                        disabled={isLoading}
                        aria-label={`${t('addresses.edit')} ${address.name}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                      >
                        {t('addresses.edit')}
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium disabled:opacity-50"
                        >
                          {t('addresses.setDefault')}
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteConfirm(address)}
                        disabled={isLoading}
                        aria-label={`${t('addresses.delete')} ${address.name}`}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        {t('addresses.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        </section>

        {/* Address Form Modal */}
        <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); setEditingAddress(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle>
              {editingAddress ? t('addresses.editAddress') : t('addresses.addNewAddress')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingAddress ? t('addresses.editAddress') : t('addresses.addNewAddress')}
            </DialogDescription>

            <div className="space-y-4">
              <div>
                <label htmlFor="field-address-type" className="block text-sm font-medium text-foreground mb-2">
                  {t('addresses.addressType')}
                </label>
                <select
                  id="field-address-type"
                  value={addressForm.type}
                  onChange={(e) => handleFormChange('type', e.target.value as 'shipping' | 'billing')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="shipping">{t('addresses.shipping')}</option>
                  <option value="billing">{t('addresses.billing')}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-address-name" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.fullName')} *
                  </label>
                  <input
                    id="field-address-name"
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.name ? 'error-address-name' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                      formErrors.name ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder={t('addresses.enterFullName')}
                  />
                  {formErrors.name && (
                    <p id="error-address-name" role="alert" className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-address-company" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.company')}
                  </label>
                  <input
                    id="field-address-company"
                    type="text"
                    value={addressForm.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                    placeholder={t('addresses.enterCompany')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-address-address1" className="block text-sm font-medium text-foreground mb-2">
                  {t('addresses.streetAddress')} *
                </label>
                <input
                  id="field-address-address1"
                  type="text"
                  value={addressForm.address1}
                  onChange={(e) => handleFormChange('address1', e.target.value)}
                  aria-required="true"
                  aria-describedby={formErrors.address1 ? 'error-address-address1' : undefined}
                  className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                    formErrors.address1 ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder={t('addresses.enterStreetAddress')}
                />
                {formErrors.address1 && (
                  <p id="error-address-address1" role="alert" className="text-red-500 text-xs mt-1">{formErrors.address1}</p>
                )}
              </div>

              <div>
                <label htmlFor="field-address-address2" className="block text-sm font-medium text-foreground mb-2">
                  {t('addresses.streetAddress2')}
                </label>
                <input
                  id="field-address-address2"
                  type="text"
                  value={addressForm.address2}
                  onChange={(e) => handleFormChange('address2', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder={t('addresses.enterStreetAddress2')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="field-address-city" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.city')} *
                  </label>
                  <input
                    id="field-address-city"
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.city ? 'error-address-city' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                      formErrors.city ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder={t('addresses.enterCity')}
                  />
                  {formErrors.city && (
                    <p id="error-address-city" role="alert" className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-address-state" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.state')} *
                  </label>
                  <input
                    id="field-address-state"
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.state ? 'error-address-state' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                      formErrors.state ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder={t('addresses.enterState')}
                  />
                  {formErrors.state && (
                    <p id="error-address-state" role="alert" className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-address-zipCode" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.zipCode')} *
                  </label>
                  <input
                    id="field-address-zipCode"
                    type="text"
                    value={addressForm.zipCode}
                    onChange={(e) => handleFormChange('zipCode', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.zipCode ? 'error-address-zipCode' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                      formErrors.zipCode ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder={t('addresses.enterZipCode')}
                  />
                  {formErrors.zipCode && (
                    <p id="error-address-zipCode" role="alert" className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-address-country" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.country')} *
                  </label>
                  <select
                    id="field-address-country"
                    value={addressForm.country}
                    onChange={(e) => handleFormChange('country', e.target.value)}
                    aria-required="true"
                    aria-describedby={formErrors.country ? 'error-address-country' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg bg-card text-foreground ${
                      formErrors.country ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {formErrors.country && (
                    <p id="error-address-country" role="alert" className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-address-phone" className="block text-sm font-medium text-foreground mb-2">
                    {t('addresses.phoneNumber')}
                  </label>
                  <input
                    id="field-address-phone"
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                    placeholder={t('addresses.enterPhoneNumber')}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm text-foreground">
                  {t('addresses.setAsDefault')}
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {t('general.cancel')}
              </button>
              <button
                onClick={handleSaveAddress}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {editingAddress ? t('addresses.updateAddress') : t('addresses.saveAddress')}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>{t('addresses.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('addresses.deleteAddressWarning')}
            </DialogDescription>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {t('general.cancel')}
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteAddress(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {t('addresses.delete')}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
}