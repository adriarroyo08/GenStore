import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X, ShoppingCart } from 'lucide-react';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface GlobalNotificationProps {
  notification: Notification | null;
  isAuthPage?: boolean;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
  },
};

export function GlobalNotification({ notification }: GlobalNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Notification | null>(null);

  useEffect(() => {
    if (notification) {
      setCurrent(notification);
      // Small delay to trigger enter animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      // Wait for exit animation before clearing content
      const timer = setTimeout(() => setCurrent(null), 300);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!current) return null;

  const style = styles[current.type];
  const Icon = current.type === 'success' && current.message.toLowerCase().includes('carrito')
    ? ShoppingCart
    : icons[current.type];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[280px] max-w-[420px] ${style.bg} ${style.border}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${style.icon}`} />
        <p className={`text-sm font-medium flex-1 ${style.text}`}>
          {current.message}
        </p>
        <button
          onClick={() => setVisible(false)}
          className={`p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0 ${style.text}`}
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
