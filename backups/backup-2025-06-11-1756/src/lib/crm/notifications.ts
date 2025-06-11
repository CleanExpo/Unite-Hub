import { createClient } from '@/lib/supabase/server';

export interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(notification: NotificationData) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function getUserNotifications(userId: string, limit = 50) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting unread notifications:', error);
    throw error;
  }

  return count || 0;
}
