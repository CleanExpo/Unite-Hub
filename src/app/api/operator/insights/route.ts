/**
 * Operator Insights API - Phase 10 Week 5-6
 *
 * Endpoints for reviewer scores, bias detection, feedback submission,
 * and accuracy history.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { OperatorInsightsService } from "@/lib/operator/operatorInsightsService";
import { z } from "zod";

const insightsService = new OperatorInsightsService();

// Validation schemas
const feedbackSubmitSchema = z.object({
  action: z.literal("submit_feedback"),
  record_id: z.string().uuid(),
  outcome: z.enum(["CORRECT", "OVERTURNED", "INCONCLUSIVE"]),
  reason: z.string().optional(),
});

const recordDecisionSchema = z.object({
  action: z.literal("record_decision"),
  organization_id: z.string().uuid(),
  decision: z.enum(["APPROVE", "REJECT", "DEFER"]),
  queue_item_id: z.string().uuid().optional(),
  proposal_id: z.string().uuid().optional(),
  review_time_seconds: z.number().positive().optional(),
  confidence_level: z.number().min(0).max(1).optional(),
});

const acknowledgeBiasSchema = z.object({
  action: z.literal("acknowledge_bias"),
  bias_id: z.string().uuid(),
});

const resolveBiasSchema = z.object({
  action: z.literal("resolve_bias"),
  bias_id: z.string().uuid(),
  resolution: z.string().min(1),
});

const detectBiasesSchema = z.object({
  action: z.literal("detect_biases"),
  operator_id: z.string().uuid(),
  organization_id: z.string().uuid(),
});

const generateRecommendationsSchema = z.object({
  action: z.literal("generate_recommendations"),
  organization_id: z.string().uuid(),
});

const applyRecommendationSchema = z.object({
  action: z.literal("apply_recommendation"),
  recommendation_id: z.string().uuid(),
});

/**
 * GET /api/operator/insights
 *
 * Query params:
 * - type: scores | biases | history | events | recommendations
 * - operator_id: UUID (required for operator-specific queries)
 * - organization_id: UUID
 * - limit: number
 */
export async function GET(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "scores";
    const operatorId = searchParams.get("operator_id") || userId;
    const organizationId = searchParams.get("organization_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "scores": {
        if (operatorId === "all") {
          const scores = await insightsService.getOrganizationScores(organizationId);
          return NextResponse.json({ scores });
        }
        const score = await insightsService.getReviewerScores(operatorId, organizationId);
        return NextResponse.json({ score });
      }

      case "biases": {
        if (operatorId === "all") {
          const biases = await insightsService.getOrganizationBiases(organizationId);
          return NextResponse.json({ biases });
        }
        const biases = await insightsService.getActiveBiases(operatorId, organizationId);
        return NextResponse.json({ biases });
      }

      case "history": {
        const history = await insightsService.getAccuracyHistory(
          operatorId,
          organizationId,
          limit
        );
        return NextResponse.json({ history });
      }

      case "events": {
        const events = await insightsService.getFeedbackEvents(organizationId, limit);
        return NextResponse.json({ events });
      }

      case "recommendations": {
        const recommendations = await insightsService.getPendingRecommendations(
          organizationId
        );
        return NextResponse.json({ recommendations });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Insights GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/operator/insights
 *
 * Actions: submit_feedback, record_decision, acknowledge_bias,
 *          resolve_bias, detect_biases, generate_recommendations,
 *          apply_recommendation
 */
export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "submit_feedback": {
        const parsed = feedbackSubmitSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        await insightsService.recordOutcome(
          parsed.data.record_id,
          parsed.data.outcome,
          parsed.data.reason
        );

        return NextResponse.json({
          message: "Feedback recorded",
          outcome: parsed.data.outcome,
        });
      }

      case "record_decision": {
        const parsed = recordDecisionSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const record = await insightsService.recordDecision(
          userId,
          parsed.data.organization_id,
          parsed.data.decision,
          parsed.data.queue_item_id,
          parsed.data.proposal_id,
          parsed.data.review_time_seconds,
          parsed.data.confidence_level
        );

        return NextResponse.json({
          message: "Decision recorded",
          record,
        });
      }

      case "acknowledge_bias": {
        const parsed = acknowledgeBiasSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const bias = await insightsService.acknowledgeBias(
          parsed.data.bias_id,
          userId
        );

        return NextResponse.json({
          message: "Bias acknowledged",
          bias,
        });
      }

      case "resolve_bias": {
        const parsed = resolveBiasSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const bias = await insightsService.resolveBias(
          parsed.data.bias_id,
          parsed.data.resolution
        );

        return NextResponse.json({
          message: "Bias resolved",
          bias,
        });
      }

      case "detect_biases": {
        const parsed = detectBiasesSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const biases = await insightsService.detectBiases(
          parsed.data.operator_id,
          parsed.data.organization_id
        );

        return NextResponse.json({
          message: `Detected ${biases.length} bias(es)`,
          biases,
        });
      }

      case "generate_recommendations": {
        const parsed = generateRecommendationsSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const recommendations = await insightsService.generateTuningRecommendations(
          parsed.data.organization_id
        );

        return NextResponse.json({
          message: `Generated ${recommendations.length} recommendation(s)`,
          recommendations,
        });
      }

      case "apply_recommendation": {
        const parsed = applyRecommendationSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        await insightsService.applyTuningRecommendation(
          parsed.data.recommendation_id,
          userId
        );

        return NextResponse.json({
          message: "Recommendation applied",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Insights POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
