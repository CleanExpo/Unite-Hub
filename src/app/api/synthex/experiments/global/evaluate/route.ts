/**
 * Synthex Global Experiment Evaluation API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * POST - Evaluate experiment and assign variant
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  evaluateExperiment,
  trackEvent,
} from "@/lib/synthex/globalExperimentService";

/**
 * POST /api/synthex/experiments/global/evaluate
 * Evaluate an experiment for a user/session
 *
 * Body:
 * - tenantId (required)
 * - experimentKey (required)
 * - context (optional): additional context for evaluation
 * - profileId (optional): user profile ID
 * - anonymousId (optional): anonymous visitor ID
 * - sessionId (optional): session ID
 * - trackEvent (optional): whether to track enrollment event
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const body = await request.json();
    const {
      tenantId,
      experimentKey,
      context,
      profileId,
      anonymousId,
      sessionId,
      trackEvent: shouldTrack = true,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!experimentKey) {
      return NextResponse.json(
        { error: "experimentKey is required" },
        { status: 400 }
      );
    }

    // Evaluate the experiment
    const result = await evaluateExperiment(tenantId, experimentKey, context);

    // Track enrollment event if requested and enrolled
    if (shouldTrack && result.enrolled && result.experiment_id) {
      await trackEvent(tenantId, {
        experiment_id: result.experiment_id,
        event_type: "enrollment",
        variant_assigned: result.variant,
        profile_id: profileId,
        anonymous_id: anonymousId,
        session_id: sessionId,
        context: context || {},
      });
    }

    return NextResponse.json({
      success: true,
      evaluation: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error evaluating experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
