/**
 * /api/founder/risk
 *
 * Risk Scoring & Anomaly Detection API (Phase E28)
 * GET: List scores, events, overview
 * POST: Update score, record event, resolve event
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listRiskScores,
  getRiskScore,
  updateRiskScore,
  recordRiskEvent,
  listRiskEvents,
  resolveRiskEvent,
  getRiskOverview,
  type RiskCategory,
  type RiskSeverity,
  type RiskEventType,
} from "@/lib/founder/riskEngineService";
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
    const category = searchParams.get("category") as RiskCategory | null;
    const resolved = searchParams.get("resolved");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-score") {
      if (!category) {
        return NextResponse.json({ error: "category required" }, { status: 400 });
      }
      const score = await getRiskScore(workspaceId, category);
      if (!score) {
        return NextResponse.json({ error: "Score not found" }, { status: 404 });
      }
      return NextResponse.json({ score });
    }

    if (action === "events") {
      const events = await listRiskEvents(
        workspaceId,
        category || undefined,
        resolved !== null ? resolved === "true" : undefined,
        100
      );
      return NextResponse.json({ events, total: events.length });
    }

    if (action === "overview") {
      const overview = await getRiskOverview(workspaceId);
      return NextResponse.json({ overview });
    }

    // Default: list risk scores
    const scores = await listRiskScores(workspaceId);
    return NextResponse.json({ scores, total: scores.length });
  } catch (error: any) {
    console.error("[API] /founder/risk GET error:", error);
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

    if (action === "update-score") {
      const { category, score, description, contributingFactors } = body;

      if (!category || typeof score !== "number") {
        return NextResponse.json(
          { error: "category and score are required" },
          { status: 400 }
        );
      }

      const scoreId = await updateRiskScore({
        tenantId: workspaceId,
        category,
        score,
        description,
        contributingFactors,
      });

      return NextResponse.json({ success: true, scoreId, message: "Risk score updated" });
    }

    if (action === "record-event") {
      const {
        category,
        eventType,
        severity,
        title,
        description,
        scoreImpact,
        source,
        sourceId,
      } = body;

      if (!category || !eventType || !severity || !title || !description) {
        return NextResponse.json(
          { error: "category, eventType, severity, title, and description are required" },
          { status: 400 }
        );
      }

      const eventId = await recordRiskEvent({
        tenantId: workspaceId,
        category,
        eventType,
        severity,
        title,
        description,
        scoreImpact,
        source,
        sourceId,
      });

      return NextResponse.json({ success: true, eventId, message: "Risk event recorded" });
    }

    if (action === "resolve-event") {
      const { eventId, resolutionNotes, scoreReduction } = body;

      if (!eventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
      }

      await resolveRiskEvent(eventId, workspaceId, user.id, resolutionNotes, scoreReduction);

      return NextResponse.json({ success: true, message: "Risk event resolved" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: update-score, record-event, resolve-event" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/risk POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
