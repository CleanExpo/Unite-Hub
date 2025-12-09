/**
 * /api/founder/incidents
 *
 * Incident Response API (Phase E21)
 * GET: List incidents, updates, actions, statistics
 * POST: Create incident, add update, create action, update status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createIncident,
  listIncidents,
  getIncident,
  updateIncidentStatus,
  addIncidentUpdate,
  listIncidentUpdates,
  createIncidentAction,
  listIncidentActions,
  updateIncidentActionStatus,
  getIncidentStatistics,
  updateIncident,
  type IncidentType,
  type IncidentStatus,
  type IncidentSeverity,
  type IncidentActionStatus,
} from "@/lib/core/incidentService";
import { hasPermission } from "@/lib/core/permissionService";
import { recordAuditEvent, extractRequestMetadata } from "@/lib/core/auditService";

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
    const incidentId = searchParams.get("incidentId");
    const status = searchParams.get("status") as IncidentStatus | null;
    const severity = searchParams.get("severity") as IncidentSeverity | null;
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-incident") {
      if (!incidentId) {
        return NextResponse.json({ error: "incidentId required" }, { status: 400 });
      }
      const incident = await getIncident(incidentId, workspaceId);
      if (!incident) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      }
      return NextResponse.json({ incident });
    }

    if (action === "updates") {
      if (!incidentId) {
        return NextResponse.json({ error: "incidentId required" }, { status: 400 });
      }
      const updates = await listIncidentUpdates(incidentId, workspaceId);
      return NextResponse.json({ updates, total: updates.length });
    }

    if (action === "actions") {
      if (!incidentId) {
        return NextResponse.json({ error: "incidentId required" }, { status: 400 });
      }
      const actions = await listIncidentActions(incidentId, workspaceId);
      return NextResponse.json({ actions, total: actions.length });
    }

    if (action === "statistics") {
      const stats = await getIncidentStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    // Default: list incidents
    const incidents = await listIncidents(workspaceId, status || undefined, severity || undefined, limit);
    return NextResponse.json({ incidents, total: incidents.length });
  } catch (error: any) {
    console.error("[API] /founder/incidents GET error:", error);
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

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "create-incident") {
      const { title, description, type, severity, assignedTo, affectedResource, affectedResourceId, impactDescription, metadata } = body;

      if (!title || !type || !severity) {
        return NextResponse.json({ error: "Missing required fields: title, type, severity" }, { status: 400 });
      }

      const incidentId = await createIncident({
        tenantId: workspaceId,
        title,
        description,
        type,
        severity,
        assignedTo,
        affectedResource,
        affectedResourceId,
        impactDescription,
        metadata,
      });

      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "incident.created",
        resource: "incident",
        resourceId: incidentId,
        action: `Created incident: ${title}`,
        metadata: { type, severity },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ success: true, incidentId, message: "Incident created" });
    }

    if (action === "update-incident-status") {
      const { incidentId, status } = body;

      if (!incidentId || !status) {
        return NextResponse.json({ error: "Missing required fields: incidentId, status" }, { status: 400 });
      }

      await updateIncidentStatus(incidentId, workspaceId, status);

      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "incident.updated",
        resource: "incident",
        resourceId: incidentId,
        action: `Updated incident status to: ${status}`,
        metadata: { status },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ success: true, message: "Incident status updated" });
    }

    if (action === "add-update") {
      const { incidentId, updateText, statusChange, metadata } = body;

      if (!incidentId || !updateText) {
        return NextResponse.json({ error: "Missing required fields: incidentId, updateText" }, { status: 400 });
      }

      const updateId = await addIncidentUpdate({
        incidentId,
        tenantId: workspaceId,
        authorId: user.id,
        updateText,
        statusChange,
        metadata,
      });

      return NextResponse.json({ success: true, updateId, message: "Update added" });
    }

    if (action === "create-action") {
      const { incidentId, title, description, assignee, dueAt } = body;

      if (!incidentId || !title) {
        return NextResponse.json({ error: "Missing required fields: incidentId, title" }, { status: 400 });
      }

      const actionId = await createIncidentAction({
        incidentId,
        tenantId: workspaceId,
        title,
        description,
        assignee,
        dueAt: dueAt ? new Date(dueAt) : undefined,
      });

      return NextResponse.json({ success: true, actionId, message: "Action created" });
    }

    if (action === "update-action-status") {
      const { actionId, status } = body;

      if (!actionId || !status) {
        return NextResponse.json({ error: "Missing required fields: actionId, status" }, { status: 400 });
      }

      await updateIncidentActionStatus(actionId, workspaceId, status);

      return NextResponse.json({ success: true, message: "Action status updated" });
    }

    if (action === "update-incident") {
      const { incidentId, title, description, severity, assignedTo, rootCause, resolutionNotes, impactDescription } = body;

      if (!incidentId) {
        return NextResponse.json({ error: "Missing required field: incidentId" }, { status: 400 });
      }

      await updateIncident(incidentId, workspaceId, {
        title,
        description,
        severity,
        assignedTo,
        rootCause,
        resolutionNotes,
        impactDescription,
      });

      return NextResponse.json({ success: true, message: "Incident updated" });
    }

    return NextResponse.json({ error: "Invalid action. Use: create-incident, update-incident-status, add-update, create-action, update-action-status, update-incident" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/incidents POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
