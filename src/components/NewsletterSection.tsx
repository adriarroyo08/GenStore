import React, { useState, useEffect, FormEvent } from 'react';
import { Mail, Loader2, Check, Gift } from 'lucide-react';
import { motion } from 'motion/react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const STORAGE_KEY = 'newsletter_subscribed';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setAlreadySubscribed(true);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    setTimeout(() => {
      // Simulate success (no real API call)
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
        setStatus('success');
        setAlreadySubscribed(true);
      } catch {
        setStatus('error');
      }
    }, 1000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full bg-gradient-to-b from-primary/10 to-background py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Decorative Gift icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Gift className="h-10 w-10 text-primary" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Únete a nuestra newsletter
        </h2>
        <p className="mt-2 text-muted-foreground">
          Recibe ofertas exclusivas, novedades y un 10% de descuento en tu primer pedido
        </p>

        <div className="mt-8">
          {alreadySubscribed ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>Ya estás suscrito. ¡Gracias por estar con nosotros!</span>
            </div>
          ) : status === 'success' ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>¡Gracias! Revisa tu email para confirmar</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suscribiendo...
                  </>
                ) : (
                  'Suscribirme'
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-sm text-destructive">
              Ha ocurrido un error. Por favor, inténtalo de nuevo.
            </p>
          )}

          {!alreadySubscribed && status !== 'success' && (
            <p className="mt-4 text-xs text-muted-foreground">
              No spam. Puedes darte de baja en cualquier momento.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
