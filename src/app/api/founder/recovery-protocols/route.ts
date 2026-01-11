/**
 * @fileoverview F12 Founder Recovery Protocols API
 * GET: List recovery states/actions, get summary, auto-recommend
 * POST: Record recovery state, recommend action
 * PATCH: Mark recovery action as taken
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordRecoveryState,
  recommendRecoveryAction,
  markRecoveryActionTaken,
  listRecoveryStates,
  listRecoveryActions,
  getRecoverySummary,
  autoRecommendRecovery,
} from "@/lib/founder/recoveryProtocolsService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Summary action
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getRecoverySummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Auto-recommend action
    if (action === "auto-recommend") {
      const recommendations = await autoRecommendRecovery(workspaceId);
      return NextResponse.json({ recommendations });
    }

    // List actions
    if (action === "list-actions") {
      const actionType = searchParams.get("actionType") as any;
      const urgency = searchParams.get("urgency") as any;
      const taken = searchParams.get("taken");
      const limit = parseInt(searchParams.get("limit") || "200");

      const actions = await listRecoveryActions(workspaceId, {
        actionType,
        urgency,
        taken: taken ? taken === "true" : undefined,
        limit,
      });

      return NextResponse.json({ actions });
    }

    // Default: List states
    const state = searchParams.get("state") as any;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "200");

    const states = await listRecoveryStates(workspaceId, {
      state,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ states });
  } catch (error: any) {
    console.error("[recovery-protocols] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    // Recommend action
    if (action === "recommend-action") {
      const actionId = await recommendRecoveryAction({
        tenantId: workspaceId,
        actionType: body.actionType,
        urgency: body.urgency,
        description: body.description,
        durationMinutes: body.durationMinutes,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
        metadata: body.metadata,
      });

      return NextResponse.json({ actionId });
    }

    // Default: Record state
    const stateId = await recordRecoveryState({
      tenantId: workspaceId,
      recoveryScore: body.recoveryScore,
      fatigueLevel: body.fatigueLevel,
      stressLevel: body.stressLevel,
      sleepQuality: body.sleepQuality,
      state: body.state,
      contributingFactors: body.contributingFactors,
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ stateId });
  } catch (error: any) {
    console.error("[recovery-protocols] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    await markRecoveryActionTaken({
      actionId: body.actionId,
      effectivenessRating: body.effectivenessRating,
      notes: body.notes,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[recovery-protocols] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
