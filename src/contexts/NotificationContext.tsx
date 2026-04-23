import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  securityAlerts: boolean;
  productRecommendations: boolean;
  priceAlerts: boolean;
}

export interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendNotification: (type: NotificationType, data: NotificationData) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  loading: boolean;
}

export interface NotificationData {
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
  data?: any;
}

export type NotificationType = 
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_success'
  | 'payment_failed'
  | 'security_alert'
  | 'password_changed'
  | 'login_detected'
  | 'marketing_promotion'
  | 'product_recommendation'
  | 'price_alert'
  | 'wishlist_sale'
  | 'general_info';

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: false,
  marketingEmails: false,
  orderUpdates: true,
  securityAlerts: true,
  productRecommendations: false,
  priceAlerts: false,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  user?: any;
}

export function NotificationProvider({ children, user }: NotificationProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkPushSupport = async () => {
      try {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsPushSupported(supported);
        
        if (supported) {
          try {
            const permission = Notification.permission;
            setIsPushEnabled(permission === 'granted');
          } catch (error) {
            console.log('Push notifications not available:', error.message);
            setIsPushSupported(false);
            setIsPushEnabled(false);
          }
        }
      } catch (error) {
        console.log('Error checking push support:', error);
        setIsPushSupported(false);
        setIsPushEnabled(false);
      }
    };

    checkPushSupport();
  }, []);

  // Load user preferences from localStorage
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const storageKey = user ? `notificationPreferences_${user.id}` : 'notificationPreferences_guest';
        const savedPreferences = localStorage.getItem(storageKey);
        
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...defaultPreferences, ...parsed });
        } else {
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.log('Error loading notification preferences:', error);
        setPreferences(defaultPreferences);
      }
    };

    loadPreferences();
  }, [user]);

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    setLoading(true);
    
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      // Save to localStorage
      const storageKey = user ? `notificationPreferences_${user.id}` : 'notificationPreferences_guest';
      localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));

      // Handle push notification permission
      if (newPreferences.pushNotifications && !isPushEnabled) {
        await requestPushPermission();
      } else if (newPreferences.pushNotifications === false && isPushEnabled) {
        await unsubscribePushNotifications();
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert on error
      setPreferences(preferences);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Check if Notification API is available
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setIsPushEnabled(true);
        
        // Show a test notification to confirm it's working
        setTimeout(() => {
          try {
            new Notification('GenStore Notifications Enabled', {
              body: 'You will now receive notifications for important updates.',
              icon: '/favicon.ico',
              tag: 'genstore-permission-granted'
            });
          } catch (error) {
            console.log('Failed to show test notification:', error);
          }
        }, 1000);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  const unsubscribePushNotifications = async () => {
    try {
      setIsPushEnabled(false);
      
      // Show notification about disabling
      if (Notification.permission === 'granted') {
        try {
          new Notification('GenStore Notifications Disabled', {
            body: 'Push notifications have been disabled for your account.',
            icon: '/favicon.ico',
            tag: 'genstore-permission-revoked'
          });
        } catch (error) {
          console.log('Failed to show disable notification:', error);
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      // Still set as disabled even if unsubscribe failed
      setIsPushEnabled(false);
    }
  };

  const sendNotification = async (type: NotificationType, data: NotificationData) => {
    try {
      // Store notification in localStorage for history
      const notifications = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
      const newNotification = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: new Date().toISOString(),
        read: false,
        userId: user?.id || 'guest'
      };
      
      notifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      localStorage.setItem('notificationHistory', JSON.stringify(notifications));

      // Show browser notification if enabled and permission granted
      if (preferences.pushNotifications && Notification.permission === 'granted') {
        // Check if this type of notification should be shown based on preferences
        const shouldShow = shouldShowNotificationType(type);
        
        if (shouldShow) {
          try {
            new Notification(data.title, {
              body: data.message,
              icon: data.imageUrl || '/favicon.ico',
              tag: `genstore-${type}-${newNotification.id}`,
              requireInteraction: ['security_alert', 'payment_failed'].includes(type),
              actions: data.actionUrl ? [
                {
                  action: 'view',
                  title: 'View Details'
                }
              ] : undefined
            });
          } catch (error) {
            console.log('Failed to show browser notification:', error);
          }
        }
      }

      // Trigger custom event for notification listeners
      const event = new CustomEvent('notification:received', {
        detail: { type, data, notification: newNotification }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const shouldShowNotificationType = (type: NotificationType): boolean => {
    switch (type) {
      case 'order_confirmation':
      case 'order_shipped':
      case 'order_delivered':
        return preferences.orderUpdates;
      case 'security_alert':
      case 'password_changed':
      case 'login_detected':
        return preferences.securityAlerts;
      case 'marketing_promotion':
        return preferences.marketingEmails;
      case 'product_recommendation':
        return preferences.productRecommendations;
      case 'price_alert':
      case 'wishlist_sale':
        return preferences.priceAlerts;
      case 'payment_success':
      case 'payment_failed':
        return preferences.orderUpdates; // Payment notifications follow order update preference
      default:
        return true; // Show general notifications by default
    }
  };

  const value: NotificationContextType = {
    preferences,
    updatePreferences,
    sendNotification,
    requestPushPermission,
    isPushSupported,
    isPushEnabled,
    loading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}