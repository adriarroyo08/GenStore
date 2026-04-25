import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';
import { GenStoreLogo } from './GenStoreLogo';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (user: any) => void;
  onShowSignup: () => void;
  onVerificationRequired?: (email: string) => void;
  onCreateAdmin?: () => void;
  onSimpleAdmin?: () => void;
  onAdminStatus?: () => void;
}

export function LoginPage({ onBackToHome, onLoginSuccess, onShowSignup, onVerificationRequired }: LoginPageProps) {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError(t('auth.loginRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login({ email, password });
      onLoginSuccess({ email });
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Error de conexión. Comprueba tu conexión a internet.');
      } else {
        setError(err.message || t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in duration-300">
        {/* Back button */}
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">{language === 'es' ? 'Volver' : 'Back'}</span>
        </button>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <GenStoreLogo size={48} showText className="" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            {t('auth.loginSubtitle')}
          </p>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6" role="alert">
              <span id="field-login-error">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email / username */}
            <div>
              <label htmlFor="field-login-email" className="block text-sm font-medium text-foreground mb-1.5">
                {t('auth.emailOrUsername')}
              </label>
              <input
                id="field-login-email"
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="email@ejemplo.com"
                required
                autoComplete="username"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'field-login-error' : undefined}
                className="w-full border border-input rounded-xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="field-login-password" className="block text-sm font-medium text-foreground mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="field-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'field-login-error' : undefined}
                  className="w-full border border-input rounded-xl px-4 py-3 pr-12 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setForgotSuccess(false); setForgotError(''); }}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* Forgot password inline form */}
            {showForgotPassword && (
              <div className="bg-muted rounded-xl p-4 space-y-3">
                {forgotSuccess ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm">
                      {language === 'es'
                        ? 'Si el email existe, recibirás un enlace para restablecer tu contraseña.'
                        : 'If the email exists, you will receive a password reset link.'}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es'
                        ? 'Introduce tu email para recibir un enlace de recuperación.'
                        : 'Enter your email to receive a recovery link.'}
                    </p>
                    {forgotError && (
                      <p className="text-sm text-destructive" role="alert">{forgotError}</p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                        placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'}
                        className="flex-1 border border-input rounded-xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground transition-colors"
                      />
                      <button
                        type="button"
                        disabled={forgotLoading || !forgotEmail}
                        onClick={async () => {
                          setForgotLoading(true);
                          setForgotError('');
                          try {
                            await apiClient.post('/auth/forgot-password', { email: forgotEmail });
                            setForgotSuccess(true);
                          } catch (err: any) {
                            setForgotError(err.message || (language === 'es' ? 'Error al enviar el email.' : 'Failed to send email.'));
                          } finally {
                            setForgotLoading(false);
                          }
                        }}
                        className="px-4 py-3 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {forgotLoading
                          ? (language === 'es' ? 'Enviando...' : 'Sending...')
                          : (language === 'es' ? 'Enviar' : 'Send')}
                      </button>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-foreground text-background rounded-xl py-3.5 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {language === 'es' ? 'Iniciando sesión...' : 'Signing in...'}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>

            {/* Signup link */}
            <p className="text-center text-sm text-muted-foreground pt-2">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={onShowSignup}
                className="text-blue-600 hover:underline font-semibold"
              >
                {t('auth.signupLink')}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
