import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationManagerProps {
  user?: any;
}

export function NotificationManager({ user }: NotificationManagerProps) {
  const { preferences, sendNotification } = useNotifications();

  // Register service worker for push notifications
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
      }

      try {
        // Try multiple possible locations for the service worker
        const swPaths = ['/sw.js', './sw.js', '/public/sw.js'];
        let registration = null;
        
        for (const path of swPaths) {
          try {
            registration = await navigator.serviceWorker.register(path);
            console.log('Service Worker registered successfully:', registration);
            break;
          } catch (error) {
            console.log(`Failed to register SW at ${path}:`, error.message);
          }
        }
        
        if (!registration) {
          console.log('Service Worker registration failed for all paths. Push notifications will not be available.');
          return;
        }

        // Wait for the service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker ready:', readyRegistration);
        
      } catch (error) {
        console.error('Service Worker registration error:', error);
        // Don't throw - app should work without push notifications
      }
    };

    registerServiceWorker();
  }, []);

  // Listen for app events that should trigger notifications
  useEffect(() => {
    if (!user) return;

    const handleAppEvents = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      // Send notification based on app event
      sendNotification(type, data);
      
      // Also try to show a browser notification if user has enabled push notifications
      // and the notification is important (like security alerts)
      if (preferences.pushNotifications && shouldShowBrowserNotification(type)) {
        showBrowserNotification(data);
      }
    };

    // Listen for custom app events
    window.addEventListener('app:notification' as any, handleAppEvents);
    
    return () => {
      window.removeEventListener('app:notification' as any, handleAppEvents);
    };
  }, [user, sendNotification, preferences]);

  // Helper function to determine if we should show browser notification
  const shouldShowBrowserNotification = (type: string): boolean => {
    const importantTypes = ['security_alert', 'order_confirmation', 'payment_failed'];
    return importantTypes.includes(type);
  };

  // Show browser notification using Notification API directly
  const showBrowserNotification = (data: any) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      try {
        new Notification(data.title || 'GenStore Notification', {
          body: data.message || 'You have a new notification',
          icon: '/favicon.ico',
          tag: 'techstore-direct-notification'
        });
      } catch (error) {
        console.log('Failed to show browser notification:', error);
      }
    }
  };

  // Simulate various notification events for demo purposes
  useEffect(() => {
    if (!user) return;

    // Simulate welcome notification after login
    const welcomeTimer = setTimeout(() => {
      const welcomeEvent = new CustomEvent('app:notification', {
        detail: {
          type: 'general_info',
          data: {
            title: 'Welcome to GenStore!',
            message: 'Thanks for logging in. Check out our latest products and deals.',
            actionUrl: '/catalog'
          }
        }
      });
      window.dispatchEvent(welcomeEvent);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, [user]);

  return null; // This component doesn't render anything
}

// Utility functions to trigger notifications from other components
export const triggerNotification = (type: string, data: any) => {
  const event = new CustomEvent('app:notification', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
};

// Predefined notification triggers for common events
export const NotificationTriggers = {
  orderPlaced: (orderId: string, total: number) => {
    triggerNotification('order_confirmation', {
      title: 'Order Confirmed!',
      message: `Your order #${orderId} for $${total.toFixed(2)} has been placed successfully.`,
      actionUrl: `/orders/${orderId}`,
      data: { orderId, total }
    });
  },

  orderShipped: (orderId: string, trackingNumber: string) => {
    triggerNotification('order_shipped', {
      title: 'Order Shipped!',
      message: `Your order #${orderId} has been shipped. Tracking: ${trackingNumber}`,
      actionUrl: `/orders/${orderId}`,
      data: { orderId, trackingNumber }
    });
  },

  paymentSuccess: (amount: number, method: string) => {
    triggerNotification('payment_success', {
      title: 'Payment Successful',
      message: `Payment of $${amount.toFixed(2)} via ${method} was processed successfully.`,
      data: { amount, method }
    });
  },

  securityAlert: (message: string) => {
    triggerNotification('security_alert', {
      title: 'Security Alert',
      message: message,
      actionUrl: '/settings',
      data: { timestamp: new Date().toISOString() }
    });
  },

  priceAlert: (productName: string, oldPrice: number, newPrice: number) => {
    triggerNotification('price_alert', {
      title: 'Price Alert!',
      message: `${productName} is now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)})`,
      actionUrl: '/catalog',
      data: { productName, oldPrice, newPrice }
    });
  },

  marketingPromotion: (title: string, message: string, discountCode?: string) => {
    triggerNotification('marketing_promotion', {
      title: title,
      message: message,
      actionUrl: '/catalog',
      data: { discountCode }
    });
  },

  wishlistSale: (productName: string, discount: number) => {
    triggerNotification('wishlist_sale', {
      title: 'Wishlist Item on Sale!',
      message: `${productName} from your wishlist is now ${discount}% off!`,
      actionUrl: '/wishlist',
      data: { productName, discount }
    });
  }
};