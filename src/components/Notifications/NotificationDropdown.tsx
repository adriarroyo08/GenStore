import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Truck, CheckCircle, AlertTriangle, Package, CreditCard, RotateCcw } from 'lucide-react';
import type { AppNotification } from '../../hooks/useNotifications';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: AppNotification) => void;
}

const ICON_MAP: Record<string, { icon: React.ElementType; bg: string }> = {
  order_shipped: { icon: Truck, bg: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600' },
  order_delivered: { icon: Package, bg: 'bg-green-100 dark:bg-green-900/20 text-green-600' },
  payment_confirmed: { icon: CreditCard, bg: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' },
  payment_pending: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' },
  order_cancelled: { icon: AlertTriangle, bg: 'bg-red-100 dark:bg-red-900/20 text-red-600' },
  return_requested: { icon: RotateCcw, bg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' },
  return_approved: { icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/20 text-green-600' },
};

function getRelativeTime(dateString: string, lang: string): string {
  const now = Date.now();
  const diff = now - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return lang === 'es' ? 'Ahora' : 'Just now';
  if (minutes < 60) return lang === 'es' ? `Hace ${minutes}m` : `${minutes}m ago`;
  if (hours < 24) return lang === 'es' ? `Hace ${hours}h` : `${hours}h ago`;
  if (days < 7) return lang === 'es' ? `Hace ${days}d` : `${days}d ago`;
  return new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
}

export function NotificationDropdown({ notifications, onMarkRead, onMarkAllRead, onNotificationClick }: NotificationDropdownProps) {
  const { language } = useLanguage();
  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          {language === 'es' ? 'Notificaciones' : 'Notifications'}
        </span>
        {hasUnread && (
          <button onClick={onMarkAllRead} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
            {language === 'es' ? 'Marcar todo leído' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Sin notificaciones' : 'No notifications'}
            </p>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = ICON_MAP[n.type] || { icon: Package, bg: 'bg-muted text-muted-foreground' };
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) onMarkRead(n.id);
                  onNotificationClick(n);
                }}
                className={`w-full text-left px-4 py-3 border-b border-border/50 flex gap-3 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{getRelativeTime(n.created_at, language)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
