import { useState } from 'react';
import { Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';

interface EmailVerificationPageProps {
  email: string;
  onBackToLogin: () => void;
  onBackToSignup: () => void;
}

export function EmailVerificationPage({ email, onBackToLogin, onBackToSignup }: EmailVerificationPageProps) {
  const { t } = useLanguage();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');
    setMessage('');

    try {
      await apiClient.post('/auth/resend-verification', { email });
      setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(err.message || 'No se pudo reenviar el email. Inténtalo de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="verify-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#verify-grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">GenStore</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Ya casi<br />estás dentro
            </h2>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Solo falta un paso para acceder a tu cuenta. Revisa tu correo electrónico y confirma tu dirección.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { icon: '1️⃣', text: 'Abre tu bandeja de entrada' },
                { icon: '2️⃣', text: 'Busca el email de GenStore' },
                { icon: '3��⃣', text: 'Haz clic en el enlace de confirmación' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/60 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Verificación segura · Protegido con SSL</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm hidden sm:inline">Iniciar sesión</span>
          </button>

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

        {/* Content centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm text-center">
            {/* Email icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-5">
                <Mail className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            {/* Header */}
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Revisa tu correo
            </h1>
            <p className="text-muted-foreground mb-1">
              Hemos enviado un enlace de verificación a
            </p>
            <p className="font-semibold text-primary mb-8">
              {email}
            </p>

            {/* Instructions */}
            <div className="text-left space-y-4 mb-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Siguientes pasos:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Abre tu bandeja de entrada</li>
                  <li>Busca un email de GenStore</li>
                  <li>Haz clic en el enlace de verificación</li>
                  <li>Vuelve aquí para iniciar sesión</li>
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">¿No encuentras el email?</span> Revisa tu carpeta de spam o reenvía el email de verificación.
                </p>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl mb-4" role="status">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Reenviando...' : 'Reenviar email de verificación'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onBackToLogin}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-accent transition-colors text-sm font-medium"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={onBackToSignup}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-accent transition-colors text-sm font-medium"
                >
                  Usar otro email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
