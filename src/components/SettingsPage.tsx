import React, { useState, useEffect } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { CurrencySelector } from './CurrencySelector';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';
import { TwoFactorDisableModal } from './TwoFactorDisableModal';
import { SessionsManagementModal } from './SessionsManagementModal';
import { NotificationHistoryModal } from './NotificationHistoryModal';
import { AccountLayout } from './AccountLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Product, CartItem } from '../App';
import { apiClient } from '../lib/apiClient';

interface SettingsPageProps {
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
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
  onCartClick: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
}

interface UserSettings {
  profileVisibility: 'public' | 'private' | 'friends';
  dataCollection: boolean;
  personalizedAds: boolean;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
  backupCodesCount: number;
  setupInProgress: boolean;
}

export function SettingsPage(props: SettingsPageProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { preferences, updatePreferences, isPushSupported, isPushEnabled, requestPushPermission } = useNotifications();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    hasBackupCodes: false,
    backupCodesCount: 0,
    setupInProgress: false
  });
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    profileVisibility: 'private',
    dataCollection: true,
    personalizedAds: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch { /* ignore */ }
    }

    if (props.user) {
      fetch2FAStatus();
    }
  }, [props.user]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetch2FAStatus = async () => {
    try {
      const data = await apiClient.get<TwoFactorStatus>('/auth/2fa/status');
      setTwoFactorStatus(data);
    } catch {
      // 2FA endpoint may not exist yet
    }
  };

  const handle2FAToggle = () => {
    if (twoFactorStatus.enabled) {
      setShowDisable2FA(true);
    } else {
      setShowSetup2FA(true);
    }
  };

  const handle2FASuccess = () => {
    fetch2FAStatus();
    showMessage('success', twoFactorStatus.enabled ? t('settings.2FADisabled', '2FA desactivado') : t('settings.2FAEnabled', '2FA activado'));
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    showMessage('success', t('settings.settingSaved', 'Configuración guardada'));
  };

  const handleNotificationPreferenceChange = async (key: string, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      showMessage('success', t('settings.notificationPreferenceUpdated', 'Preferencia actualizada'));
    } catch {
      showMessage('error', t('settings.notificationPreferenceError', 'Error al actualizar'));
    }
  };

  const handlePushNotificationToggle = async () => {
    if (!isPushSupported) {
      showMessage('error', t('settings.pushNotSupported', 'Notificaciones push no soportadas en este navegador'));
      return;
    }

    try {
      if (!preferences.pushNotifications) {
        const granted = await requestPushPermission();
        if (granted) {
          await updatePreferences({ pushNotifications: true });
          showMessage('success', t('settings.pushNotificationsEnabled', 'Notificaciones push activadas'));
        } else {
          showMessage('error', t('settings.pushNotificationsDenied', 'Permiso de notificaciones denegado'));
        }
      } else {
        await updatePreferences({ pushNotifications: false });
        showMessage('success', t('settings.pushNotificationsDisabled', 'Notificaciones push desactivadas'));
      }
    } catch {
      showMessage('error', t('settings.notificationPreferenceError', 'Error al actualizar'));
    }
  };

  const handleDownloadData = () => {
    showMessage('success', t('settings.downloadDataRequested', 'Solicitud de descarga de datos enviada'));
  };

  const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label?: string }) => (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
      <div className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );

  const SettingRow = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <>
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      <AccountLayout
        user={props.user}
        currentPage="settings"
        onProfileClick={props.onProfileClick}
        onOrdersClick={props.onOrdersClick}
        onAddressesClick={props.onAddressesClick}
        onPaymentMethodsClick={props.onPaymentMethodsClick}
        onWishlistClick={props.onWishlistClick}
        onRewardsClick={props.onRewardsClick}
        onSettingsClick={props.onSettingsClick}
        onAdminClick={props.onAdminClick}
        onLogout={props.onLogout}
        pageTitle={t('settings.accountSettings', 'Configuración de la Cuenta')}
        pageDescription={t('settings.manageAccountPreferences', 'Gestiona tus preferencias y ajustes de cuenta')}
      >
        <div className="space-y-6">

          {/* General Settings */}
          <section className="rounded-lg border border-border p-5">
            <SectionHeader
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title={t('settings.generalSettings', 'Ajustes Generales')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.language', 'Idioma')}
                </label>
                <LanguageSelector />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.currency', 'Moneda')}
                </label>
                <CurrencySelector />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.theme', 'Tema')}
                </label>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors"
                >
                  {isDarkMode ? (
                    <>
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {t('settings.lightMode', 'Modo Claro')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      {t('settings.darkMode', 'Modo Oscuro')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="rounded-lg border border-border p-5">
            <SectionHeader
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title={t('settings.privacySecurity', 'Privacidad y Seguridad')}
            />

            <div className="divide-y divide-border">
              <SettingRow
                title={t('settings.twoFactorAuth', 'Autenticación de Dos Factores')}
                description={t('settings.twoFactorAuthDesc', 'Añade una capa extra de seguridad a tu cuenta')}
              >
                <ToggleSwitch
                  enabled={twoFactorStatus.enabled}
                  onChange={handle2FAToggle}
                  label={t('settings.twoFactorAuth', 'Autenticación de Dos Factores')}
                />
              </SettingRow>

              <SettingRow
                title={t('sessions.activeSessions', 'Sesiones Activas')}
                description={t('sessions.activeSessionsDesc', 'Gestiona los dispositivos con sesión iniciada')}
              >
                <button
                  onClick={() => setShowSessionsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('sessions.manage', 'Gestionar')}
                </button>
              </SettingRow>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('settings.notifications', 'Notificaciones')}
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationHistory(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                {t('notifications.viewHistory', 'Ver historial')}
              </button>
            </div>

            <div className="divide-y divide-border">
              <SettingRow
                title={t('settings.emailNotifications', 'Notificaciones por Email')}
                description={t('settings.emailNotificationsDesc', 'Recibe actualizaciones y contenido por email')}
              >
                <ToggleSwitch
                  enabled={preferences.emailNotifications}
                  onChange={() => handleNotificationPreferenceChange('emailNotifications', !preferences.emailNotifications)}
                  label={t('settings.emailNotifications', 'Notificaciones por Email')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.smsNotifications', 'Notificaciones SMS')}
                description={t('settings.smsNotificationsDesc', 'Recibe mensajes de texto para actualizaciones importantes')}
              >
                <ToggleSwitch
                  enabled={preferences.smsNotifications}
                  onChange={() => handleNotificationPreferenceChange('smsNotifications', !preferences.smsNotifications)}
                  label={t('settings.smsNotifications', 'Notificaciones SMS')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.pushNotifications', 'Notificaciones Push')}
                description={t('settings.pushNotificationsDesc', 'Recibe notificaciones instantáneas en tu dispositivo')}
              >
                <div className="flex items-center gap-2">
                  {!isPushSupported && (
                    <span className="text-xs text-red-500">{t('settings.pushNotSupported', 'No soportado')}</span>
                  )}
                  {isPushSupported && preferences.pushNotifications && isPushEnabled && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {t('settings.pushNotificationsActive', 'Activas')}
                    </span>
                  )}
                  <ToggleSwitch
                    enabled={preferences.pushNotifications && isPushSupported}
                    onChange={handlePushNotificationToggle}
                    label={t('settings.pushNotifications', 'Notificaciones Push')}
                  />
                </div>
              </SettingRow>

              <SettingRow
                title={t('settings.promotionalEmails', 'Emails Promocionales')}
                description={t('settings.promotionalEmailsDesc', 'Recibe ofertas especiales y contenido promocional')}
              >
                <ToggleSwitch
                  enabled={preferences.marketingEmails}
                  onChange={() => handleNotificationPreferenceChange('marketingEmails', !preferences.marketingEmails)}
                  label={t('settings.promotionalEmails', 'Emails Promocionales')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.orderUpdates', 'Actualizaciones de Pedidos')}
                description={t('settings.orderUpdatesDesc', 'Recibe notificaciones sobre el estado de tus pedidos')}
              >
                <ToggleSwitch
                  enabled={preferences.orderUpdates}
                  onChange={() => handleNotificationPreferenceChange('orderUpdates', !preferences.orderUpdates)}
                  label={t('settings.orderUpdates', 'Actualizaciones de Pedidos')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.productRecommendations', 'Recomendaciones de Productos')}
                description={t('settings.productRecommendationsDesc', 'Recibe sugerencias de productos personalizadas')}
              >
                <ToggleSwitch
                  enabled={preferences.productRecommendations}
                  onChange={() => handleNotificationPreferenceChange('productRecommendations', !preferences.productRecommendations)}
                  label={t('settings.productRecommendations', 'Recomendaciones de Productos')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.priceAlerts', 'Alertas de Precios')}
                description={t('settings.priceAlertsDesc', 'Recibe avisos cuando bajen los precios de tu lista de deseos')}
              >
                <ToggleSwitch
                  enabled={preferences.priceAlerts}
                  onChange={() => handleNotificationPreferenceChange('priceAlerts', !preferences.priceAlerts)}
                  label={t('settings.priceAlerts', 'Alertas de Precios')}
                />
              </SettingRow>
            </div>
          </section>

          {/* Privacy & Data */}
          <section className="rounded-lg border border-border p-5">
            <SectionHeader
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title={t('settings.privacyData', 'Privacidad y Datos')}
            />

            <div className="divide-y divide-border">
              <SettingRow
                title={t('settings.profileVisibility', 'Visibilidad del Perfil')}
                description={t('settings.profileVisibilityDesc', 'Controla quién puede ver tu información de perfil')}
              >
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="text-sm px-3 py-1.5 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="public">{t('settings.public', 'Público')}</option>
                  <option value="private">{t('settings.private', 'Privado')}</option>
                  <option value="friends">{t('settings.friends', 'Solo Amigos')}</option>
                </select>
              </SettingRow>

              <SettingRow
                title={t('settings.dataCollection', 'Recopilación de Datos')}
                description={t('settings.dataCollectionDesc', 'Controla cómo recopilamos y utilizamos tus datos')}
              >
                <ToggleSwitch
                  enabled={settings.dataCollection}
                  onChange={() => handleSettingChange('dataCollection', !settings.dataCollection)}
                  label={t('settings.dataCollection', 'Recopilación de Datos')}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.personalizedAds', 'Anuncios Personalizados')}
                description={t('settings.personalizedAdsDesc', 'Muestra anuncios adaptados a tus intereses')}
              >
                <ToggleSwitch
                  enabled={settings.personalizedAds}
                  onChange={() => handleSettingChange('personalizedAds', !settings.personalizedAds)}
                />
              </SettingRow>

              <SettingRow
                title={t('settings.downloadData', 'Descargar tus Datos')}
                description={t('settings.downloadDataDesc', 'Solicita una copia de todos los datos de tu cuenta')}
              >
                <button
                  onClick={handleDownloadData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('settings.download', 'Descargar')}
                </button>
              </SettingRow>
            </div>
          </section>

        </div>
      </AccountLayout>

      {/* Modals */}
      {showSetup2FA && (
        <TwoFactorSetupModal
          isOpen={showSetup2FA}
          onClose={() => setShowSetup2FA(false)}
          user={props.user}
          onSuccess={handle2FASuccess}
        />
      )}

      {showDisable2FA && (
        <TwoFactorDisableModal
          isOpen={showDisable2FA}
          onClose={() => setShowDisable2FA(false)}
          user={props.user}
          onSuccess={handle2FASuccess}
        />
      )}

      {showSessionsModal && (
        <SessionsManagementModal
          isOpen={showSessionsModal}
          onClose={() => setShowSessionsModal(false)}
          user={props.user}
          onSuccess={() => showMessage('success', t('sessions.sessionsUpdated', 'Sesiones actualizadas'))}
        />
      )}

      {showNotificationHistory && (
        <NotificationHistoryModal
          isOpen={showNotificationHistory}
          onClose={() => setShowNotificationHistory(false)}
          user={props.user}
        />
      )}
    </>
  );
}
