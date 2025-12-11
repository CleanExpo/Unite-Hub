import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Notification Service (G40)
 *
 * Core notification tracking for Guardian alerts, incidents, and digests.
 * Tracks delivery status across email, Slack, webhook, and in-app channels.
 *
 * Design Principles:
 * - Tenant-scoped notifications with RLS enforcement
 * - Status tracking (pending, sent, failed) for observability
 * - Error logging for debugging delivery failures
 * - Context storage for audit trails
 */

export type GuardianNotificationType = 'alert' | 'incident' | 'digest';
export type GuardianNotificationChannel = 'email' | 'slack' | 'webhook' | 'in_app';
export type GuardianNotificationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type GuardianNotificationStatus = 'pending' | 'sent' | 'failed';

export interface GuardianNotification {
  id: string;
  tenant_id: string;
  type: GuardianNotificationType;
  severity: GuardianNotificationSeverity | null;
  channel: GuardianNotificationChannel;
  status: GuardianNotificationStatus;
  target: string | null;
  context: unknown;
  created_at: string;
  sent_at: string | null;
  error: string | null;
}

/**
 * Create a new Guardian notification
 *
 * @param args - Notification parameters
 * @returns Created notification record
 */
export async function createGuardianNotification(args: {
  tenantId: string;
  type: GuardianNotificationType;
  channel: GuardianNotificationChannel;
  severity?: GuardianNotificationSeverity;
  target?: string;
  context?: unknown;
}): Promise<GuardianNotification> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_notifications')
    .insert({
      tenant_id: args.tenantId,
      type: args.type,
      channel: args.channel,
      severity: args.severity ?? null,
      target: args.target ?? null,
      context: args.context ?? {},
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Guardian G40] Failed to create notification:', error);
    throw error;
  }

  return data as GuardianNotification;
}

/**
 * Mark a notification as successfully sent
 *
 * @param id - Notification ID
 */
export async function markGuardianNotificationSent(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('guardian_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      error: null,
    })
    .eq('id', id);

  if (error) {
    console.error('[Guardian G40] Failed to mark notification as sent:', error);
  }
}

/**
 * Mark a notification as failed with error message
 *
 * @param id - Notification ID
 * @param message - Error message (truncated to 500 chars)
 */
export async function markGuardianNotificationFailed(
  id: string,
  message: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('guardian_notifications')
    .update({
      status: 'failed',
      error: message.slice(0, 500),
    })
    .eq('id', id);

  if (error) {
    console.error('[Guardian G40] Failed to mark notification as failed:', error);
  }
}

/**
 * List recent notifications for a tenant
 *
 * @param tenantId - Tenant ID
 * @param limit - Maximum number of notifications (default 50)
 * @returns List of notifications ordered by created_at DESC
 */
export async function listRecentGuardianNotifications(
  tenantId: string,
  limit = 50
): Promise<GuardianNotification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_notifications')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Guardian G40] Failed to list notifications:', error);
    throw error;
  }

  return data as GuardianNotification[];
}
