/**
 * Synthex Global Experiment Events API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * POST - Track experiment event
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  trackEvent,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/experiments/global/[id]/events
 * Track an experiment event
 *
 * Body:
 * - event_type (required): "impression" | "conversion" | "custom"
 * - variant_assigned (optional): variant the user was assigned
 * - profileId (optional): user profile ID
 * - anonymousId (optional): anonymous visitor ID
 * - sessionId (optional): session ID
 * - context (optional): additional event context
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    if (!body.event_type) {
      return NextResponse.json(
        { error: "event_type is required" },
        { status: 400 }
      );
    }

    const event = await trackEvent(existing.tenant_id, {
      experiment_id: id,
      event_type: body.event_type,
      variant_assigned: body.variant_assigned,
      profile_id: body.profileId,
      anonymous_id: body.anonymousId,
      session_id: body.sessionId,
      context: body.context || {},
    });

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error tracking event:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
