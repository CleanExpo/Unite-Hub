/**
 * Synthex KGIM Insight by ID API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * GET - Get single insight
 * POST - Acknowledge or dismiss insight
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { getInsight, acknowledgeInsight, dismissInsight } from "@/lib/synthex/kgimService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/kgim/insights/[id]
 * Get a single insight
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;

    const insight = await getInsight(id);

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, insight });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching insight:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/kgim/insights/[id]
 * Acknowledge or dismiss an insight
 *
 * Body:
 * - action: "acknowledge" | "dismiss"
 * - userId: user performing the action
 * - reason: (for dismiss) reason for dismissal
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    const user = await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["acknowledge", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'acknowledge' or 'dismiss'" },
        { status: 400 }
      );
    }

    const existing = await getInsight(id);
    if (!existing) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const userId = user?.id || body.userId || "system";

    let insight;
    if (action === "acknowledge") {
      insight = await acknowledgeInsight(id, userId);
    } else {
      insight = await dismissInsight(id, userId, reason);
    }

    return NextResponse.json({
      success: true,
      insight,
      message: `Insight ${action}d successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating insight:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
