/**
 * H04: GET /api/guardian/ai/incidents/triage/[incidentId]/explain
 * Get AI-assisted explanation of triage score (if allowed by governance)
 * Falls back to deterministic narrative if AI disabled
 */

import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";
import {
  buildIncidentFeatures,
  validateFeaturesAreSafe,
} from "@/lib/guardian/ai/incidentFeatureBuilder";
import {
  scoreIncidentHeuristic,
  validateScoringRationale,
} from "@/lib/guardian/ai/incidentScoringModel";
import { generateIncidentTriageNarrative } from "@/lib/guardian/ai/incidentTriageAiHelper";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getSupabaseServer } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const ctxResult = await requireExecutionContext(req, undefined, {
      requireWorkspace: true,
      allowWorkspaceFromHeader: true,
    });

    if (!ctxResult.ok) {
      return ctxResult.response;
    }

    const { workspace } = ctxResult.ctx;
    const { incidentId } = await context.params;

    if (!incidentId) {
      return errorResponse("incidentId is required", 400);
    }

    // Verify incident belongs to workspace
    const supabase = getSupabaseServer();
    const { data: incident } = await supabase
      .from("incidents")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("id", incidentId)
      .single();

    if (!incident) {
      return errorResponse("Incident not found", 404);
    }

    // Build features for current incident state
    const features = await buildIncidentFeatures(workspace.id, incidentId, {
      hours: 24,
    });

    // Validate features (ensure aggregate-only)
    const featuresValidation = validateFeaturesAreSafe(features);
    if (!featuresValidation.valid) {
      console.error(
        "[API] Feature validation failed:",
        featuresValidation.errors
      );
      return errorResponse(
        "Failed to generate explanation: invalid features",
        500
      );
    }

    // Score incident
    const heuristicScore = scoreIncidentHeuristic(features);

    // Validate rationale
    const rationaleValidation = validateScoringRationale(
      heuristicScore.rationale
    );
    if (!rationaleValidation.valid) {
      console.error(
        "[API] Rationale validation failed:",
        rationaleValidation.errors
      );
      return errorResponse(
        "Failed to generate explanation: invalid rationale",
        500
      );
    }

    // Generate AI narrative (with governance gating)
    // This function handles both AI generation (if allowed) and fallback to deterministic
    const narrative = await generateIncidentTriageNarrative(
      workspace.id,
      features,
      heuristicScore
    );

    return successResponse({
      incidentId,
      score: heuristicScore.score,
      band: heuristicScore.band,
      rationale: heuristicScore.rationale,
      narrative: {
        summary: narrative.summary,
        likelyDrivers: narrative.likelyDrivers,
        nextSteps: narrative.nextSteps,
        confidence: narrative.confidence,
        source: narrative.confidence === 1.0 ? "deterministic" : "ai",
      },
      features: {
        alertCount1h: features.alert_count_1h,
        alertCount24h: features.alert_count_24h,
        uniqueRuleCount: features.unique_rule_count,
        correlationClusterCount: features.correlation_cluster_count,
        riskScoreLatest: features.risk_score_latest,
        riskDelta24h: features.risk_delta_24h,
        notificationFailureRate: features.notification_failure_rate,
        anomalyEventCount: features.anomaly_event_count,
        incidentAgeMinutes: features.incident_age_minutes,
        reopenCount: features.reopen_count,
      },
    });
  } catch (error: any) {
    console.error(
      "[API] /guardian/ai/incidents/triage/[id]/explain GET error:",
      error
    );
    return errorResponse(error.message || "Failed to generate explanation", 500);
  }
}
