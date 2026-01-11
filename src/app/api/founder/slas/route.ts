/**
 * /api/founder/slas
 *
 * SLA & Uptime Reporting API (Phase E31)
 * GET: List SLAs, uptime checks, incidents, or get summary/overview
 * POST: Create SLA, record uptime check, create incident, update incident status
 * PUT: Update SLA definition
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { hasPermission } from "@/lib/core/permissionService";
import * as slaService from "@/lib/founder/slaService";

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

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // List SLA definitions (default)
    if (!action || action === "list") {
      const isActive = searchParams.get("isActive");
      const slas = await slaService.listSLADefinitions(
        workspaceId,
        isActive !== null ? isActive === "true" : undefined
      );
      return NextResponse.json({ slas });
    }

    // Get uptime overview
    if (action === "uptime-overview") {
      const days = parseInt(searchParams.get("days") || "7");
      const overview = await slaService.getUptimeOverview(workspaceId, days);
      return NextResponse.json({ overview });
    }

    // Get SLA summary
    if (action === "sla-summary") {
      const slaId = searchParams.get("slaId");
      const days = parseInt(searchParams.get("days") || "30");
      if (!slaId) {
        return NextResponse.json({ error: "slaId required" }, { status: 400 });
      }
      const summary = await slaService.getSLASummary(workspaceId, slaId, days);
      return NextResponse.json({ summary });
    }

    // List uptime checks
    if (action === "list-checks") {
      const slaId = searchParams.get("slaId");
      const limit = parseInt(searchParams.get("limit") || "100");
      const checks = await slaService.listUptimeChecks(
        workspaceId,
        slaId || undefined,
        limit
      );
      return NextResponse.json({ checks });
    }

    // List incidents
    if (action === "list-incidents") {
      const slaId = searchParams.get("slaId");
      const status = searchParams.get("status") as slaService.SLAIncidentStatus | null;
      const severity = searchParams.get("severity") as slaService.SLAIncidentSeverity | null;
      const incidents = await slaService.listSLAIncidents(
        workspaceId,
        slaId || undefined,
        status || undefined,
        severity || undefined
      );
      return NextResponse.json({ incidents });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/slas GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
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
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Create SLA definition
    if (action === "create-sla") {
      const { name, description, targetType, targetValue, targetUnit, measurementPeriodDays, isActive } = body;
      if (!name || !targetType || targetValue === undefined) {
        return NextResponse.json(
          { error: "name, targetType, and targetValue required" },
          { status: 400 }
        );
      }
      const slaId = await slaService.createSLADefinition({
        tenantId: workspaceId,
        name,
        description,
        targetType,
        targetValue,
        targetUnit,
        measurementPeriodDays,
        isActive,
      });
      return NextResponse.json({ slaId });
    }

    // Record uptime check
    if (action === "record-check") {
      const { slaId, serviceName, status, responseTimeMs, metadata } = body;
      if (!serviceName || !status) {
        return NextResponse.json(
          { error: "serviceName and status required" },
          { status: 400 }
        );
      }
      const checkId = await slaService.recordUptimeCheck({
        tenantId: workspaceId,
        slaId,
        serviceName,
        status,
        responseTimeMs,
        metadata,
      });
      return NextResponse.json({ checkId });
    }

    // Create SLA incident
    if (action === "create-incident") {
      const { slaId, severity, title, description, impactDescription } = body;
      if (!slaId || !severity || !title) {
        return NextResponse.json(
          { error: "slaId, severity, and title required" },
          { status: 400 }
        );
      }
      const incidentId = await slaService.createSLAIncident({
        tenantId: workspaceId,
        slaId,
        severity,
        title,
        description,
        impactDescription,
      });
      return NextResponse.json({ incidentId });
    }

    // Update incident status
    if (action === "update-incident-status") {
      const { incidentId, status, rootCause, resolutionNotes } = body;
      if (!incidentId || !status) {
        return NextResponse.json(
          { error: "incidentId and status required" },
          { status: 400 }
        );
      }
      await slaService.updateSLAIncidentStatus(incidentId, status, rootCause, resolutionNotes);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/slas POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Update SLA definition
    if (action === "update-sla") {
      const { slaId, updates } = body;
      if (!slaId || !updates) {
        return NextResponse.json(
          { error: "slaId and updates required" },
          { status: 400 }
        );
      }
      await slaService.updateSLADefinition(slaId, updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/slas PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
