import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePoints } from '../hooks/usePoints';
import { useOrders } from '../hooks/useOrders';
import { Product, CartItem } from '../App';
import { ProfileSection } from './Account/ProfileSection';
import { PasswordSection } from './Account/PasswordSection';
import { AccountLayout } from './AccountLayout';
import { apiClient } from '../lib/apiClient';
import { ShoppingBag, Heart, MapPin, Coins, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AccountPageProps {
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
  onBackToHome: () => void;
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
  onAddToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  onAdminClick?: () => void;
  setCurrentPage: (page: string) => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function AccountPage({
  user,
  onLoginClick,
  onLogout,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick,
  setCurrentPage
}: AccountPageProps) {
  const { t } = useLanguage();
  const { userPoints, isEnabled: pointsEnabled } = usePoints(user);
  const { allOrders, pendingOrders } = useOrders(user);

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const [originalProfileData, setOriginalProfileData] = useState(profileData);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await apiClient.get<any>('/auth/me');
      const newProfileData = {
        firstName: data.nombre || '',
        lastName: data.apellidos || '',
        email: data.email || user?.email || '',
        phone: data.telefono || '',
        dateOfBirth: data.fecha_nacimiento || ''
      };
      setProfileData(newProfileData);
      setOriginalProfileData(newProfileData);
    } catch {
      const fallbackData = {
        firstName: user?.nombre || '',
        lastName: user?.apellidos || '',
        email: user?.email || '',
        phone: '',
        dateOfBirth: ''
      };
      setProfileData(fallbackData);
      setOriginalProfileData(fallbackData);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setOriginalProfileData(profileData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData(originalProfileData);
  };

  const handleSaveProfile = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      showMessage('error', t('account.requiredFieldsEmpty'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      showMessage('error', t('account.invalidEmailFormat'));
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put('/auth/me', {
        nombre: profileData.firstName,
        apellidos: profileData.lastName,
        telefono: profileData.phone,
      });
      setIsEditing(false);
      setOriginalProfileData(profileData);
      showMessage('success', t('account.profileUpdated'));
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : t('account.profileUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (password: string) => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  });

  const handlePasswordChange = async () => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) errors.currentPassword = t('account.currentPasswordRequired');
    if (!passwordData.newPassword) errors.newPassword = t('account.newPasswordRequired');
    if (!passwordData.confirmNewPassword) errors.confirmNewPassword = t('account.confirmPasswordRequired');
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = t('account.passwordsDoNotMatch');
    }

    const reqs = validatePassword(passwordData.newPassword);
    if (passwordData.newPassword && !Object.values(reqs).every(Boolean)) {
      errors.newPassword = t('account.passwordRequirementsNotMet');
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPasswordErrors({});
      showMessage('success', t('account.passwordUpdatedSuccessfully'));
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : t('account.passwordUpdateError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const clearPasswordFields = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setPasswordErrors({});
  };

  const passwordRequirements = validatePassword(passwordData.newPassword);

  return (
    <>
      {message && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      <AccountLayout
        user={user}
        currentPage="account"
        onProfileClick={onProfileClick}
        onOrdersClick={onOrdersClick}
        onAddressesClick={onAddressesClick}
        onPaymentMethodsClick={onPaymentMethodsClick}
        onWishlistClick={onWishlistClick}
        onRewardsClick={onRewardsClick}
        onSettingsClick={onSettingsClick}
        onAdminClick={onAdminClick}
        onLogout={onLogout}
        pageTitle={t('account.title')}
        pageDescription={t('account.profileDescription')}
        showHeader={false}
      >
        <section aria-labelledby="account-heading">
          <h1 id="account-heading" className="sr-only">{t('account.title')}</h1>
          <div className="space-y-6">

            {/* Activity Summary Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  icon: <ShoppingBag className="w-5 h-5" />,
                  label: t('account.totalOrders'),
                  value: allOrders.length,
                  accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                  onClick: onOrdersClick,
                  sub: pendingOrders > 0 ? `${pendingOrders} ${t('account.pending')}` : undefined,
                },
                {
                  icon: <Heart className="w-5 h-5" />,
                  label: t('account.wishlistItems'),
                  value: 0, // placeholder — wishlist count from sidebar
                  accent: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
                  onClick: onWishlistClick,
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: t('account.addresses'),
                  value: '—',
                  accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                  onClick: onAddressesClick,
                },
                ...(pointsEnabled && userPoints ? [{
                  icon: <Coins className="w-5 h-5" />,
                  label: t('account.points'),
                  value: userPoints.currentPoints.toLocaleString(),
                  accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
                  onClick: onRewardsClick,
                  sub: userPoints.tier.charAt(0).toUpperCase() + userPoints.tier.slice(1),
                }] : []),
              ].map((card, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  onClick={card.onClick}
                  className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all text-left"
                >
                  <div className={`p-2 rounded-lg ${card.accent}`}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                    {card.sub && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</div>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </motion.button>
              ))}
            </div>

            <ProfileSection
              profileData={profileData}
              setProfileData={setProfileData}
              isEditing={isEditing}
              isLoadingProfile={isLoadingProfile}
              isSaving={isSaving}
              onEditClick={handleEditClick}
              onCancelEdit={handleCancelEdit}
              onSaveProfile={handleSaveProfile}
            />

            <PasswordSection
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              passwordErrors={passwordErrors}
              passwordRequirements={passwordRequirements}
              isChangingPassword={isChangingPassword}
              onPasswordChange={handlePasswordChange}
              onClearPasswordFields={clearPasswordFields}
            />
          </div>
        </section>
      </AccountLayout>
    </>
  );
}
