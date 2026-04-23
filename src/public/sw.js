// Service Worker for GenStore - Production Ready
const CACHE_NAME = 'genstore-sw-v1.0.0';
const IS_PRODUCTION = true; // Set to true for production

// Safe logger for production
const safeLog = {
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors but sanitize in production
    if (IS_PRODUCTION) {
      console.error('SW Error:', '[Sanitized for production]');
    } else {
      console.error(...args);
    }
  }
};

// Install event
self.addEventListener('install', (event) => {
  safeLog.info('GenStore Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  safeLog.info('GenStore Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  safeLog.info('Push notification received');
  
  let notificationData = {
    title: 'GenStore',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'genstore-notification',
    requireInteraction: false,
    actions: []
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.data || {}
      };
    } catch (error) {
      safeLog.error('Error parsing push data');
    }
  }

  // Show the notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  safeLog.info('Notification clicked');
  
  event.notification.close();

  // Handle action clicks
  if (event.action) {
    safeLog.info('Notification action clicked');
    return;
  }

  // Default click behavior - open or focus the app
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  safeLog.info('Background sync triggered');
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Function to sync notifications when back online
async function syncNotifications() {
  try {
    safeLog.info('Syncing notifications');
    
    // Production implementation would sync:
    // 1. Send queued notification interactions to server
    // 2. Fetch missed notifications while offline
    // 3. Update notification preferences
    
  } catch (error) {
    safeLog.error('Error syncing notifications');
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  safeLog.info('Service Worker received message');
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      default:
        safeLog.info('Unknown message type received');
    }
  }
});