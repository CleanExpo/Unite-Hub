/**
 * Notification Service (Phase E25)
 *
 * System notifications for alerts and escalations
 * Server-side only - never expose to client
 *
 * @module notificationService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "alert"
  | "security"
  | "compliance"
  | "incident"
  | "policy"
  | "rate_limit"
  | "system"
  | "other";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link: string | null;
  link_text: string | null;
  read: boolean;
  read_at: string | null;
  dismissed: boolean;
  dismissed_at: string | null;
  source: string | null;
  source_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationStatistics {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

/**
 * Create notification
 */
export async function createNotification(args: {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  source?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_notification", {
      p_tenant_id: args.tenantId,
      p_user_id: args.userId || null,
      p_type: args.type,
      p_priority: args.priority || "medium",
      p_title: args.title,
      p_message: args.message,
      p_link: args.link || null,
      p_link_text: args.linkText || null,
      p_source: args.source || null,
      p_source_id: args.sourceId || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List notifications
 */
export async function listNotifications(
  tenantId: string,
  userId?: string,
  type?: NotificationType,
  priority?: NotificationPriority,
  read?: boolean,
  dismissed?: boolean,
  limit: number = 100
): Promise<Notification[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by tenant_id OR user_id
    if (userId) {
      query = query.or(`tenant_id.eq.${tenantId},user_id.eq.${userId}`);
    } else {
      query = query.eq("tenant_id", tenantId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (read !== undefined) {
      query = query.eq("read", read);
    }

    if (dismissed !== undefined) {
      query = query.eq("dismissed", dismissed);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Notifications] Error listing notifications:", error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (err) {
    console.error("[Notifications] Exception in listNotifications:", err);
    return [];
  }
}

/**
 * Get single notification
 */
export async function getNotification(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .or(`tenant_id.eq.${userId},user_id.eq.${userId}`)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Notifications] Error fetching notification:", error);
      return null;
    }

    return data as Notification;
  } catch (err) {
    console.error("[Notifications] Exception in getNotification:", err);
    return null;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("mark_notification_read", {
      p_notification_id: notificationId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Mark notification as dismissed
 */
export async function markNotificationDismissed(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("mark_notification_dismissed", {
      p_notification_id: notificationId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to mark notification as dismissed: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  tenantId: string,
  userId: string
): Promise<number> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("mark_all_read", {
      p_tenant_id: tenantId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return data as number;
  } catch (err) {
    throw err;
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatistics(
  tenantId: string,
  userId?: string
): Promise<NotificationStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_notification_statistics", {
      p_tenant_id: tenantId,
      p_user_id: userId || tenantId,
    });

    if (error) {
      console.error("[Notifications] Error getting statistics:", error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        dismissed: 0,
        by_type: {},
        by_priority: {},
      };
    }

    return data as NotificationStatistics;
  } catch (err) {
    console.error("[Notifications] Exception in getNotificationStatistics:", err);
    return {
      total: 0,
      unread: 0,
      read: 0,
      dismissed: 0,
      by_type: {},
      by_priority: {},
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .or(`tenant_id.eq.${userId},user_id.eq.${userId}`);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(
  tenantId: string,
  userId?: string
): Promise<number> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("notificationService must only run on server");
    }

    let query = supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .eq("dismissed", false);

    if (userId) {
      query = query.or(`tenant_id.eq.${tenantId},user_id.eq.${userId}`);
    } else {
      query = query.eq("tenant_id", tenantId);
    }

    const { count, error } = await query;

    if (error) {
      console.error("[Notifications] Error getting unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("[Notifications] Exception in getUnreadCount:", err);
    return 0;
  }
}
