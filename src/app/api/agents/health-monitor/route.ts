/**
 * Business Health Monitor Agent API Endpoint
 *
 * Triggers health checks and anomaly detection for founder businesses.
 *
 * @route POST /api/agents/health-monitor
 * @body checkType - Type of check: full, quick, anomaly
 * @body businessId - Optional specific business to check
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { authenticateRequest } from "@/lib/auth";
import { executeHealthMonitor } from "@/lib/agents/business-health-monitor";
import { aiAgentRateLimit } from "@/lib/rate-limit";

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await aiAgentRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return errorResponse("Unauthorized", 401);
  }
  const { user } = authResult;

  const body = await req.json();
  const { checkType = "quick", businessId } = body;

  if (!["full", "quick", "anomaly"].includes(checkType)) {
    return errorResponse("Invalid checkType. Use: full, quick, or anomaly", 400);
  }

  console.log(`[HealthMonitor API] Running ${checkType} check for user ${user.id}`);

  try {
    const result = await executeHealthMonitor({
      userId: user.id,
      businessId,
      checkType,
    });

    return successResponse(result);
  } catch (error) {
    console.error("[HealthMonitor API] Check failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Health check failed",
      500
    );
  }
});

export const runtime = "nodejs";
