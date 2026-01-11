/**
 * Notification Service
 * Phase: D59 - Notification & Incident Center
 */

import { supabaseAdmin } from '@/lib/supabase';

export interface Notification {
  id: string;
  tenant_id?: string;
  user_id?: string;
  channel: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  severity: string;
  read_at?: string;
  archived_at?: string;
  created_at: string;
}

export interface NotificationPrefs {
  id: string;
  tenant_id?: string;
  user_id: string;
  channels: Record<string, boolean>;
  quiet_hours?: Record<string, string>;
  digest_enabled: boolean;
  digest_frequency: string;
  ai_profile?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createNotification(
  input: Omit<Notification, 'id' | 'created_at'>
): Promise<Notification> {
  const { data, error } = await supabaseAdmin
    .from('unite_notifications')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  return data as Notification;
}

export async function listNotifications(
  tenantId: string | null,
  userId: string,
  filters?: { unread?: boolean; limit?: number }
): Promise<Notification[]> {
  let query = supabaseAdmin
    .from('unite_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.unread) query = query.is('read_at', null);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list notifications: ${error.message}`);
  return data as Notification[];
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw new Error(`Failed to mark as read: ${error.message}`);
}

export async function getPreferences(
  tenantId: string | null,
  userId: string
): Promise<NotificationPrefs | null> {
  let query = supabaseAdmin
    .from('unite_notification_prefs')
    .select('*')
    .eq('user_id', userId);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to get preferences: ${error.message}`);
  return data as NotificationPrefs | null;
}

export async function updatePreferences(
  tenantId: string | null,
  userId: string,
  prefs: Partial<NotificationPrefs>
): Promise<NotificationPrefs> {
  const { data, error } = await supabaseAdmin
    .from('unite_notification_prefs')
    .upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,user_id' }
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  return data as NotificationPrefs;
}
