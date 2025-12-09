/**
 * Synthex Incidents API
 *
 * Phase: D47 - Risk & Incident Center
 *
 * GET - List incidents
 * POST - Create incident, update status, add action, AI analysis, or get summary
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createIncident,
  getIncident,
  listIncidents,
  updateIncidentStatus,
  updateIncidentAnalysis,
  createAction,
  listActions,
  updateActionStatus,
  aiAnalyzeIncident,
  getIncidentSummary,
  listRiskEvents,
} from "@/lib/synthex/riskMonitorService";

/**
 * GET /api/synthex/incidents
 * List incidents with filters or get summary
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "summary") {
      const days = searchParams.get("days");
      const summary = await getIncidentSummary(tenantId, days ? parseInt(days, 10) : 7);
      return NextResponse.json({ success: true, summary });
    }

    // List incidents
    const businessId = searchParams.get("business_id") || undefined;
    const status = searchParams.get("status") as any;
    const severity = searchParams.get("severity") as any;
    const limit = searchParams.get("limit");

    const incidents = await listIncidents(tenantId, {
      businessId,
      status,
      severity,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Incidents GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/incidents
 * Actions: create, update_status, add_action, update_action, ai_analyze
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { title, severity, impact_summary, business_id } = body;

        if (!title || !severity) {
          return NextResponse.json(
            { success: false, error: "title and severity are required" },
            { status: 400 }
          );
        }

        const incident = await createIncident(tenantId, {
          title,
          severity,
          impact_summary,
          business_id,
        });

        return NextResponse.json({ success: true, incident });
      }

      case "update_status": {
        const { incident_id, status } = body;

        if (!incident_id || !status) {
          return NextResponse.json(
            { success: false, error: "incident_id and status are required" },
            { status: 400 }
          );
        }

        const incident = await updateIncidentStatus(incident_id, status);

        return NextResponse.json({ success: true, incident });
      }

      case "add_action": {
        const { incident_id, action_type, description, owner_user_id, due_at, metadata } = body;

        if (!incident_id || !action_type || !description) {
          return NextResponse.json(
            { success: false, error: "incident_id, action_type, and description are required" },
            { status: 400 }
          );
        }

        const incidentAction = await createAction(tenantId, {
          incident_id,
          action_type,
          description,
          owner_user_id,
          due_at,
          metadata,
        });

        return NextResponse.json({ success: true, action: incidentAction });
      }

      case "update_action": {
        const { action_id, status } = body;

        if (!action_id || !status) {
          return NextResponse.json(
            { success: false, error: "action_id and status are required" },
            { status: 400 }
          );
        }

        const incidentAction = await updateActionStatus(action_id, status);

        return NextResponse.json({ success: true, action: incidentAction });
      }

      case "get_actions": {
        const { incident_id } = body;

        if (!incident_id) {
          return NextResponse.json(
            { success: false, error: "incident_id is required" },
            { status: 400 }
          );
        }

        const actions = await listActions(tenantId, incident_id);

        return NextResponse.json({ success: true, actions });
      }

      case "ai_analyze": {
        const { incident_id } = body;

        if (!incident_id) {
          return NextResponse.json(
            { success: false, error: "incident_id is required" },
            { status: 400 }
          );
        }

        const incident = await getIncident(incident_id);
        if (!incident) {
          return NextResponse.json(
            { success: false, error: "Incident not found" },
            { status: 404 }
          );
        }

        // Get related risk events (last 24 hours)
        const relatedEvents = await listRiskEvents(tenantId, {
          severity: incident.severity,
          limit: 10,
        });

        const analysis = await aiAnalyzeIncident(incident, relatedEvents);

        // Update incident with analysis
        await updateIncidentAnalysis(incident_id, analysis.root_cause, {
          recommended_actions: analysis.recommended_actions,
          risk_mitigation: analysis.risk_mitigation,
        });

        return NextResponse.json({ success: true, analysis });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: create, update_status, add_action, update_action, get_actions, ai_analyze",
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Incidents POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
