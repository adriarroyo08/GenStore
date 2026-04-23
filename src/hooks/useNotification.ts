import { useState } from 'react';
import { NotificationState } from '../types';
import { NOTIFICATION_DURATION } from '../constants';

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), NOTIFICATION_DURATION);
  };

  return {
    notification,
    showNotification
  };
}