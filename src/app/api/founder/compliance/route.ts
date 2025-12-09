/**
 * /api/founder/compliance
 *
 * Compliance Center API (Phase E19)
 * GET: List DSRs, consent logs, statistics
 * POST: Create DSR, record consent, update DSR status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createDataSubjectRequest,
  listDataSubjectRequests,
  getDataSubjectRequest,
  updateDSRStatus,
  recordConsent,
  listConsentLogs,
  getDSRStatistics,
  createComplianceTask,
  listComplianceTasks,
  type DSRType,
  type DSRStatus,
  type RequesterType,
  type ConsentChannel,
} from "@/lib/core/complianceService";
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
    const action = searchParams.get("action"); // 'dsrs', 'consent-logs', 'statistics', 'tasks', 'get-dsr'
    const dsrId = searchParams.get("dsrId");
    const status = searchParams.get("status") as DSRStatus | null;
    const subjectIdentifier = searchParams.get("subjectIdentifier");
    const limit = parseInt(searchParams.get("limit") || "100");

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
    if (action === "get-dsr") {
      if (!dsrId) {
        return NextResponse.json(
          { error: "dsrId required for get-dsr action" },
          { status: 400 }
        );
      }

      const dsr = await getDataSubjectRequest(dsrId, workspaceId);
      if (!dsr) {
        return NextResponse.json({ error: "DSR not found" }, { status: 404 });
      }

      return NextResponse.json({ dsr });
    }

    if (action === "tasks") {
      if (!dsrId) {
        return NextResponse.json(
          { error: "dsrId required for tasks action" },
          { status: 400 }
        );
      }

      const tasks = await listComplianceTasks(dsrId, workspaceId);
      return NextResponse.json({ tasks });
    }

    if (action === "consent-logs") {
      const logs = await listConsentLogs(
        workspaceId,
        subjectIdentifier || undefined,
        limit
      );
      return NextResponse.json({ logs, total: logs.length });
    }

    if (action === "statistics") {
      const stats = await getDSRStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    // Default: list DSRs
    const dsrs = await listDataSubjectRequests(
      workspaceId,
      status || undefined,
      limit
    );

    return NextResponse.json({
      dsrs,
      total: dsrs.length,
    });
  } catch (error: any) {
    console.error("[API] /founder/compliance GET error:", error);
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

    // Handle create DSR
    if (action === "create-dsr") {
      const { requesterType, requesterIdentifier, type, notes, metadata } = body;

      if (!requesterType || !requesterIdentifier || !type) {
        return NextResponse.json(
          { error: "Missing required fields: requesterType, requesterIdentifier, type" },
          { status: 400 }
        );
      }

      const dsrId = await createDataSubjectRequest({
        tenantId: workspaceId,
        requesterType: requesterType as RequesterType,
        requesterIdentifier,
        type: type as DSRType,
        notes,
        metadata,
      });

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "export.requested",
        resource: "data_subject_request",
        resourceId: dsrId,
        action: `Created DSR: ${type} for ${requesterIdentifier}`,
        metadata: { type, requesterType, requesterIdentifier },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        dsrId,
        message: "Data subject request created successfully",
      });
    }

    // Handle update DSR status
    if (action === "update-dsr-status") {
      const { dsrId, status } = body;

      if (!dsrId || !status) {
        return NextResponse.json(
          { error: "Missing required fields: dsrId, status" },
          { status: 400 }
        );
      }

      await updateDSRStatus(dsrId, workspaceId, status as DSRStatus);

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "settings.updated",
        resource: "data_subject_request",
        resourceId: dsrId,
        action: `Updated DSR status to: ${status}`,
        metadata: { status },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "DSR status updated successfully",
      });
    }

    // Handle record consent
    if (action === "record-consent") {
      const { subjectIdentifier, channel, purpose, granted, source, metadata } = body;

      if (!subjectIdentifier || !channel || !purpose || granted === undefined) {
        return NextResponse.json(
          { error: "Missing required fields: subjectIdentifier, channel, purpose, granted" },
          { status: 400 }
        );
      }

      const { ipAddress, userAgent } = extractRequestMetadata(req);

      const logId = await recordConsent({
        tenantId: workspaceId,
        subjectIdentifier,
        channel: channel as ConsentChannel,
        purpose,
        granted: granted as boolean,
        source,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        metadata,
      });

      return NextResponse.json({
        success: true,
        logId,
        message: "Consent recorded successfully",
      });
    }

    // Handle create compliance task
    if (action === "create-task") {
      const { dsrId, title, description, assignee, dueAt } = body;

      if (!dsrId || !title) {
        return NextResponse.json(
          { error: "Missing required fields: dsrId, title" },
          { status: 400 }
        );
      }

      const taskId = await createComplianceTask({
        tenantId: workspaceId,
        dsrId,
        title,
        description,
        assignee,
        dueAt: dueAt ? new Date(dueAt) : undefined,
      });

      return NextResponse.json({
        success: true,
        taskId,
        message: "Compliance task created successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-dsr, update-dsr-status, record-consent, create-task" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/compliance POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
