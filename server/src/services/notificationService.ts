import { supabaseAdmin } from '../config/supabase.js';
import type { Notification } from '../types/index.js';

export async function create(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<Notification> {
  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert({ user_id: userId, type, title, body, data })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return notification as Notification;
}

export async function getForUser(userId: string, limit = 20): Promise<Notification[]> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw new Error(error.message);
}
