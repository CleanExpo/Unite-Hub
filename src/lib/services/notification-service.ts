import { getSupabaseServer } from '@/lib/supabase';

export type NotificationType = 'contribution_published' | 'tier_unlocked' | 'leaderboard_rank' | 'milestone';

export interface ClientNotification {
  id: string;
  workspace_id: string;
  client_user_id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  action_url?: string;
  sent_at: string;
  read_at?: string;
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(config: {
  enabled: boolean;
  start: number;
  end: number;
  timezone: string;
}): boolean {
  if (!config.enabled) return false;

  // TODO: Implement proper timezone conversion
  // For now, use UTC
  const now = new Date();
  const hour = now.getUTCHours();

  if (config.start < config.end) {
    // Normal range (e.g., 9-17)
    return hour >= config.start && hour < config.end;
  } else {
    // Wrap-around range (e.g., 22-8, which means 10pm-8am)
    return hour >= config.start || hour < config.end;
  }
}

/**
 * Send notification to client, respecting quiet hours
 * Returns true if sent immediately, false if queued
 */
export async function sendNotification(
  workspaceId: string,
  clientUserId: string,
  notification: {
    type: NotificationType;
    title: string;
    body: string;
    actionUrl?: string;
  }
): Promise<{
  sent: boolean;
  notificationId: string;
  queuedForLater?: boolean;
}> {
  const supabase = getSupabaseServer();

  // Get client's quiet hours preference
  const { data: gam, error: gamError } = await supabase
    .from('client_gamification')
    .select('quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .single();

  if (gamError) {
    console.error('Failed to fetch gamification data:', gamError);
  }

  // Check if in quiet hours
  const inQuietHours = gam
    ? isInQuietHours({
        enabled: gam.quiet_hours_enabled,
        start: gam.quiet_hours_start,
        end: gam.quiet_hours_end,
        timezone: gam.quiet_hours_timezone,
      })
    : false;

  // Log notification to database
  const { data: notif, error: insertError } = await supabase
    .from('client_notifications')
    .insert({
      workspace_id: workspaceId,
      client_user_id: clientUserId,
      notification_type: notification.type,
      title: notification.title,
      body: notification.body,
      action_url: notification.actionUrl,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to log notification:', insertError);
    throw insertError;
  }

  if (inQuietHours) {
    console.log(`Notification queued for ${clientUserId} (quiet hours active)`);
    return {
      sent: false,
      notificationId: notif.id,
      queuedForLater: true,
    };
  }

  // Send notification (integrate with push service, email, etc.)
  // TODO: Implement actual push notification sending via Firebase FCM, OneSignal, etc.
  console.log('Notification sent:', {
    notificationId: notif.id,
    type: notification.type,
    recipient: clientUserId,
  });

  return {
    sent: true,
    notificationId: notif.id,
  };
}

/**
 * Send "contribution published" notification
 */
export async function notifyContributionPublished(
  workspaceId: string,
  clientUserId: string,
  contributionType: string
): Promise<{ sent: boolean; notificationId: string; queuedForLater?: boolean }> {
  const pluralMap: Record<string, string> = {
    video: 'videos',
    photo: 'photos',
    voice: 'voice notes',
    text: 'stories',
    review: 'reviews',
    faq: 'Q&A answers',
  };

  const typeLabel = pluralMap[contributionType] || 'contributions';

  return sendNotification(workspaceId, clientUserId, {
    type: 'contribution_published',
    title: '✨ Your content is live!',
    body: `Your ${contributionType} is now published and earning impressions.`,
    actionUrl: `/client/dashboard/rewards?tab=contributions`,
  });
}

/**
 * Send "tier unlocked" notification
 */
export async function notifyTierUnlocked(
  workspaceId: string,
  clientUserId: string,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
): Promise<{ sent: boolean; notificationId: string; queuedForLater?: boolean }> {
  const tierEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '👑',
  };

  const tierLabel = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  };

  return sendNotification(workspaceId, clientUserId, {
    type: 'tier_unlocked',
    title: `${tierEmoji[tier]} ${tierLabel[tier]} Tier Unlocked!`,
    body: 'Congratulations! You have reached a new tier. Unlock exclusive benefits.',
    actionUrl: `/client/dashboard/rewards`,
  });
}

/**
 * Send "leaderboard rank" notification (top 10 only)
 */
export async function notifyLeaderboardRank(
  workspaceId: string,
  clientUserId: string,
  rank: number
): Promise<{ sent: boolean; notificationId: string; queuedForLater?: boolean } | null> {
  // Only notify for top 10
  if (rank > 10) return null;

  const medalMap = {
    1: '🥇 1st',
    2: '🥈 2nd',
    3: '🥉 3rd',
  };

  const medal = medalMap[rank as keyof typeof medalMap] || `#${rank}`;

  return sendNotification(workspaceId, clientUserId, {
    type: 'leaderboard_rank',
    title: `🏆 You're ${medal} on the leaderboard!`,
    body: 'Keep contributing to climb the ranks.',
    actionUrl: `/client/dashboard/rewards`,
  });
}

/**
 * Get unread notifications for a client
 */
export async function getUnreadNotifications(
  workspaceId: string,
  clientUserId: string
): Promise<ClientNotification[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_notifications')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .is('read_at', null)
    .order('sent_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch unread notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  workspaceId: string,
  notificationId: string
): Promise<ClientNotification> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  workspaceId: string,
  clientUserId: string
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('client_notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .is('read_at', null);

  if (error) throw error;
}

/**
 * Get notification count (unread only)
 */
export async function getNotificationCount(
  workspaceId: string,
  clientUserId: string
): Promise<number> {
  const supabase = getSupabaseServer();

  const { count, error } = await supabase
    .from('client_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}
