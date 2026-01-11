/**
 * /api/founder/notifications
 *
 * System Notifications API (Phase E25)
 * GET: List notifications, get single notification, statistics, unread count
 * POST: Create notification, mark read, mark dismissed, mark all read
 * DELETE: Delete notification
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createNotification,
  listNotifications,
  getNotification,
  markNotificationRead,
  markNotificationDismissed,
  markAllNotificationsRead,
  getNotificationStatistics,
  deleteNotification,
  getUnreadCount,
  type NotificationType,
  type NotificationPriority,
} from "@/lib/founder/notificationService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const notificationId = searchParams.get("notificationId");
    const type = searchParams.get("type") as NotificationType | null;
    const priority = searchParams.get("priority") as NotificationPriority | null;
    const read = searchParams.get("read");
    const dismissed = searchParams.get("dismissed");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Most notification operations don't require permissions
    // (users can always view their own notifications)

    if (action === "get-notification") {
      if (!notificationId) {
        return NextResponse.json({ error: "notificationId required" }, { status: 400 });
      }
      const notification = await getNotification(notificationId, user.id);
      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ notification });
    }

    if (action === "statistics") {
      const stats = await getNotificationStatistics(workspaceId, user.id);
      return NextResponse.json({ statistics: stats });
    }

    if (action === "unread-count") {
      const count = await getUnreadCount(workspaceId, user.id);
      return NextResponse.json({ count });
    }

    // Default: list notifications
    const notifications = await listNotifications(
      workspaceId,
      user.id,
      type || undefined,
      priority || undefined,
      read !== null ? read === "true" : undefined,
      dismissed !== null ? dismissed === "true" : undefined,
      limit
    );
    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error: any) {
    console.error("[API] /founder/notifications GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "create-notification") {
      // Creating notifications requires write permission
      const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
      if (!canWrite) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const {
        userId,
        type,
        priority,
        title,
        message,
        link,
        linkText,
        source,
        sourceId,
        metadata,
      } = body;

      if (!type || !title || !message) {
        return NextResponse.json(
          { error: "Missing required fields: type, title, message" },
          { status: 400 }
        );
      }

      const notificationId = await createNotification({
        tenantId: workspaceId,
        userId,
        type,
        priority,
        title,
        message,
        link,
        linkText,
        source,
        sourceId,
        metadata,
      });

      return NextResponse.json({ success: true, notificationId, message: "Notification created" });
    }

    if (action === "mark-read") {
      const { notificationId } = body;

      if (!notificationId) {
        return NextResponse.json({ error: "notificationId required" }, { status: 400 });
      }

      await markNotificationRead(notificationId, user.id);

      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    if (action === "mark-dismissed") {
      const { notificationId } = body;

      if (!notificationId) {
        return NextResponse.json({ error: "notificationId required" }, { status: 400 });
      }

      await markNotificationDismissed(notificationId, user.id);

      return NextResponse.json({ success: true, message: "Notification dismissed" });
    }

    if (action === "mark-all-read") {
      const count = await markAllNotificationsRead(workspaceId, user.id);

      return NextResponse.json({
        success: true,
        count,
        message: `${count} notifications marked as read`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-notification, mark-read, mark-dismissed, mark-all-read" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/notifications POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const notificationId = searchParams.get("notificationId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId required" }, { status: 400 });
    }

    await deleteNotification(notificationId, user.id);

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    console.error("[API] /founder/notifications DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
