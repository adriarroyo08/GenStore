import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Mail, ArrowLeft, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';

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
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">GenStore</span>
          </div>

          {/* Main message */}
          <div className="space-y-6">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Tu salud,<br />nuestra prioridad
            </h2>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Tu tienda online de confianza con los mejores productos y ofertas.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 pt-4">
              {[
                { icon: '🛍️', text: 'Amplio catálogo de productos' },
                { icon: '⭐', text: 'Calidad garantizada en cada compra' },
                { icon: '🚚', text: 'Envío gratis en pedidos +€50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Compra segura con SSL · Datos protegidos</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm hidden sm:inline">Volver</span>
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-foreground">GenStore</span>
          </div>

          <div />
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('auth.welcomeBack')}
              </h1>
              <p className="text-muted-foreground">
                Inicia sesión para acceder a tu cuenta
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                <span id="field-login-error" role="alert">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
              {/* Email or Username */}
              <div className="space-y-2">
                <label htmlFor="field-login-email" className="text-sm font-medium text-foreground">
                  {language === 'es' ? 'Email o nombre de usuario' : 'Email or username'}
                </label>
                <div className="relative">
                  {email.includes('@') ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  )}
                  <input
                    id="field-login-email"
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder={language === 'es' ? 'tu@email.com o usuario' : 'you@email.com or username'}
                    required
                    autoComplete="username"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "field-login-error" : undefined}
                    className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="field-login-password" className="text-sm font-medium text-foreground">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder={t('auth.enterPassword')}
                    required
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "field-login-error" : undefined}
                    className="w-full pl-11 pr-12 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotSuccess(false); setForgotError(''); }}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              {/* Forgot password inline form */}
              {showForgotPassword && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  {forgotSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" aria-hidden="true" />
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
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
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
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  t('auth.signIn')
                )}
              </button>

              {/* Signup link */}
              <p className="text-center text-sm text-muted-foreground pt-2">
                {t('auth.dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={onShowSignup}
                  className="text-primary hover:underline font-semibold"
                >
                  {t('auth.signup')}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
