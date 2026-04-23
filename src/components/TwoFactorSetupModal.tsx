import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({ isOpen, onClose, user, onSuccess }: TwoFactorSetupModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup-codes'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && step === 'setup') {
      initializeSetup();
    }
  }, [isOpen, step]);

  const initializeSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.post<any>('/auth/2fa/setup', {});

      setQrCodeUrl(data.qrCodeUrl);
      setManualKey(data.manualEntryKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiClient.post<any>('/auth/2fa/verify', { token: verificationCode });

      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setStep('setup');
    setVerificationCode('');
    setError('');
  };

  const generateQRCodeDataUrl = (url: string) => {
    // Simple QR code placeholder - in a real app you'd use a QR code library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code Placeholder', 100, 90);
      ctx.fillText('Use manual key below', 100, 110);
    }
    
    return canvas.toDataURL();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 'setup' && t('settings.setup2FA')}
            {step === 'verify' && t('settings.verify2FA')}
            {step === 'backup-codes' && t('settings.backupCodes')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('settings.setup2FADesc')}
              </p>
              
              <div className="text-center">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg inline-block">
                  {qrCodeUrl ? (
                    <img 
                      src={generateQRCodeDataUrl(qrCodeUrl)} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {manualKey && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.manualEntryKey')}:
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <code className="text-sm break-all">{manualKey}</code>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('verify')}
                disabled={loading || !qrCodeUrl}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('general.loading') : t('general.continue')}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {t('settings.verify2FADesc')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.verificationCode')}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('general.back')}
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t('general.loading') : t('general.verify')}
                </button>
              </div>
            </div>
          )}

          {step === 'backup-codes' && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('settings.backupCodesDesc')}
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t('settings.backupCodesWarning')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('settings.2FAEnabled')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}