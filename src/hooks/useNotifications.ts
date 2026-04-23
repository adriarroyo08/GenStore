import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const POLL_INTERVAL = 60_000;

export function useNotifications(user: any) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await apiClient.get<any>('/notifications?limit=10');
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.get<any>('/notifications/unread-count');
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await apiClient.put(`/notifications/${id}/read`, {});
    } catch {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiClient.put('/notifications/read-all', {});
    } catch {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();

    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  return { notifications, unreadCount, isLoading, markRead, markAllRead, refetch: fetchNotifications };
}
