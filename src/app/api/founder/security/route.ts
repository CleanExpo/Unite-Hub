/**
 * /api/founder/security
 *
 * Admin Security Center API (Phase E20)
 * GET: List sessions, events, summary
 * POST: Create session, invalidate session, record event
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createUserSession,
  listUserSessions,
  getActiveSessions,
  getUserSession,
  invalidateSession,
  recordSecurityEvent,
  listSecurityEvents,
  getSecurityEventSummary,
  getUserSessionsByUser,
  getFailedLoginAttempts,
  type SecurityEventType,
  type SecurityEventSeverity,
  type SessionStatus,
} from "@/lib/core/securityCenterService";
import { hasPermission } from "@/lib/core/permissionService";
import { recordAuditEvent, extractRequestMetadata } from "@/lib/core/auditService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action"); // 'sessions', 'active-sessions', 'events', 'summary', 'get-session', 'user-sessions', 'failed-logins'
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") as SessionStatus | null;
    const eventType = searchParams.get("eventType") as SecurityEventType | null;
    const severity = searchParams.get("severity") as SecurityEventSeverity | null;
    const limit = parseInt(searchParams.get("limit") || "100");
    const days = parseInt(searchParams.get("days") || "30");
    const hours = parseInt(searchParams.get("hours") || "24");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.read or owner role)
    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle different actions
    if (action === "get-session") {
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId required for get-session action" },
          { status: 400 }
        );
      }

      const session = await getUserSession(sessionId, workspaceId);
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ session });
    }

    if (action === "active-sessions") {
      const sessions = await getActiveSessions(workspaceId);
      return NextResponse.json({ sessions, total: sessions.length });
    }

    if (action === "user-sessions") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId required for user-sessions action" },
          { status: 400 }
        );
      }

      const sessions = await getUserSessionsByUser(userId, workspaceId, limit);
      return NextResponse.json({ sessions, total: sessions.length });
    }

    if (action === "events") {
      const events = await listSecurityEvents(
        workspaceId,
        eventType || undefined,
        severity || undefined,
        limit
      );
      return NextResponse.json({ events, total: events.length });
    }

    if (action === "summary") {
      const summary = await getSecurityEventSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    if (action === "failed-logins") {
      const events = await getFailedLoginAttempts(workspaceId, hours);
      return NextResponse.json({ events, total: events.length });
    }

    // Default: list sessions
    const sessions = await listUserSessions(
      workspaceId,
      status || undefined,
      limit
    );

    return NextResponse.json({
      sessions,
      total: sessions.length,
    });
  } catch (error: any) {
    console.error("[API] /founder/security GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
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
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.write or owner role)
    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle create session
    if (action === "create-session") {
      const {
        userId,
        sessionToken,
        deviceInfo,
        browserInfo,
        ipAddress,
        country,
        city,
        expiresAt,
        metadata,
      } = body;

      if (!userId || !sessionToken) {
        return NextResponse.json(
          { error: "Missing required fields: userId, sessionToken" },
          { status: 400 }
        );
      }

      const sessionId = await createUserSession({
        tenantId: workspaceId,
        userId,
        sessionToken,
        deviceInfo,
        browserInfo,
        ipAddress,
        country,
        city,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata,
      });

      // Record audit event
      const { ipAddress: reqIp, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "session.created",
        resource: "user_session",
        resourceId: sessionId,
        action: `Created session for user ${userId}`,
        metadata: { userId, deviceInfo, browserInfo },
        ipAddress: reqIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        sessionId,
        message: "Session created successfully",
      });
    }

    // Handle invalidate session
    if (action === "invalidate-session") {
      const { sessionId } = body;

      if (!sessionId) {
        return NextResponse.json(
          { error: "Missing required field: sessionId" },
          { status: 400 }
        );
      }

      await invalidateSession(sessionId, workspaceId);

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "session.invalidated",
        resource: "user_session",
        resourceId: sessionId,
        action: `Invalidated session ${sessionId}`,
        metadata: { sessionId },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Session invalidated successfully",
      });
    }

    // Handle record security event
    if (action === "record-event") {
      const {
        userId,
        eventType,
        severity,
        description,
        ipAddress,
        userAgent,
        sessionId,
        resource,
        resourceId,
        success,
        failureReason,
        metadata,
      } = body;

      if (!eventType) {
        return NextResponse.json(
          { error: "Missing required field: eventType" },
          { status: 400 }
        );
      }

      const { ipAddress: reqIp, userAgent: reqUserAgent } = extractRequestMetadata(req);

      const eventId = await recordSecurityEvent({
        tenantId: workspaceId,
        userId,
        eventType,
        severity,
        description,
        ipAddress: ipAddress || reqIp,
        userAgent: userAgent || reqUserAgent,
        sessionId,
        resource,
        resourceId,
        success,
        failureReason,
        metadata,
      });

      return NextResponse.json({
        success: true,
        eventId,
        message: "Security event recorded successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-session, invalidate-session, record-event" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/security POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
