import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface NotificationRecord {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    actionUrl?: string;
  };
  notifications: Array<{
    type: string;
    success: boolean;
    message: string;
  }>;
  created_at: string;
}

export function NotificationHistoryModal({ isOpen, onClose, user }: NotificationHistoryModalProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchNotificationHistory();
    }
  }, [isOpen, user]);

  const fetchNotificationHistory = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real implementation, you would fetch from your backend
      // For now, we'll simulate some notification history
      const simulatedHistory: NotificationRecord[] = [
        {
          id: '1',
          type: 'order_confirmation',
          data: {
            title: 'Order Confirmed!',
            message: 'Your order #12345 has been confirmed.',
            actionUrl: '/orders/12345'
          },
          notifications: [
            { type: 'email', success: true, message: 'Email sent successfully' },
            { type: 'push', success: true, message: 'Push notification sent' }
          ],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'security_alert',
          data: {
            title: 'Security Alert',
            message: 'New login detected from your current device.',
            actionUrl: '/settings'
          },
          notifications: [
            { type: 'email', success: true, message: 'Email sent successfully' }
          ],
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'price_alert',
          data: {
            title: 'Price Alert!',
            message: 'iPhone 15 Pro Max is now $999.99 (was $1199.99)',
            actionUrl: '/catalog'
          },
          notifications: [
            { type: 'push', success: true, message: 'Push notification sent' }
          ],
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      setNotifications(simulatedHistory);
    } catch (err) {
      setError('Failed to fetch notification history');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmation':
      case 'order_shipped':
      case 'order_delivered':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'security_alert':
      case 'password_changed':
      case 'login_detected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'price_alert':
      case 'wishlist_sale':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'marketing_promotion':
      case 'product_recommendation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a2 2 0 002 2h6a2 2 0 002-2V7M9 7h6M9 11h6m-3 4h3" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718l5.657-5.657M13 13h5l-5 5v-5zM6 6h.01M6 18h.01m12.01-12H18M18 18h.01" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_confirmation':
      case 'order_shipped':
      case 'order_delivered':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'security_alert':
      case 'password_changed':
      case 'login_detected':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'price_alert':
      case 'wishlist_sale':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'marketing_promotion':
      case 'product_recommendation':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      default:
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="notification-history-title">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="notification-history-title" className="text-xl font-bold text-gray-900 dark:text-white">
            {t('notifications.history')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
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
            <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">{t('general.loading')}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718l5.657-5.657M13 13h5l-5 5v-5zM6 6h.01M6 18h.01m12.01-12H18M18 18h.01" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">{t('notifications.noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {notification.data.title}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {notification.data.message}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {notification.notifications.map((notif, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              notif.success 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {notif.success ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {notif.type.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}