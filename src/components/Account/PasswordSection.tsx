import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordSectionProps {
  passwordData: PasswordData;
  setPasswordData: (data: PasswordData) => void;
  passwordErrors: Record<string, string>;
  passwordRequirements: PasswordRequirements;
  isChangingPassword: boolean;
  onPasswordChange: () => void;
  onClearPasswordFields: () => void;
}

export function PasswordSection({
  passwordData,
  setPasswordData,
  passwordErrors,
  passwordRequirements,
  isChangingPassword,
  onPasswordChange,
  onClearPasswordFields
}: PasswordSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-8 mt-8">
      <h3 className="text-xl font-bold text-foreground mb-6">
        {t('account.changePassword')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('account.currentPassword')} *
          </label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              passwordErrors.currentPassword ? 'border-destructive' : 'border-border'
            } bg-card text-foreground`}
          />
          {passwordErrors.currentPassword && (
            <p className="text-destructive text-sm mt-1">{passwordErrors.currentPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('account.newPassword')} *
          </label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              passwordErrors.newPassword ? 'border-destructive' : 'border-border'
            } bg-card text-foreground`}
          />
          {passwordErrors.newPassword && (
            <p className="text-destructive text-sm mt-1">{passwordErrors.newPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('account.confirmNewPassword')} *
          </label>
          <input
            type="password"
            value={passwordData.confirmNewPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              passwordErrors.confirmNewPassword ? 'border-destructive' : 'border-border'
            } bg-card text-foreground`}
          />
          {passwordErrors.confirmNewPassword && (
            <p className="text-destructive text-sm mt-1">{passwordErrors.confirmNewPassword}</p>
          )}
        </div>
      </div>

      {/* Password Requirements */}
      {passwordData.newPassword && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-foreground mb-3">
            {t('account.passwordRequirements')}:
          </p>
          <div className="space-y-2">
            {[
              { met: passwordRequirements.minLength, label: t('account.pwReqMinLength') },
              { met: passwordRequirements.hasUppercase, label: t('account.pwReqUppercase') },
              { met: passwordRequirements.hasLowercase, label: t('account.pwReqLowercase') },
              { met: passwordRequirements.hasNumber, label: t('account.pwReqNumber') },
              { met: passwordRequirements.hasSpecialChar, label: t('account.pwReqSpecialChar') },
            ].map((req, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${
                req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {req.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={onClearPasswordFields}
          className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
        >
          {t('general.clear')}
        </button>
        <button
          onClick={onPasswordChange}
          disabled={isChangingPassword}
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isChangingPassword && (
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
          )}
          {t('account.changePassword')}
        </button>
      </div>
    </div>
  );
}