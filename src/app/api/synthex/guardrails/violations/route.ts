/**
 * Synthex Guardrail Violations API
 *
 * Phase: D49 - Global Guardrails & Kill Switch
 *
 * GET - List violations or get summary
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listViolations,
  getViolationSummary,
} from "@/lib/synthex/guardrailService";

/**
 * GET /api/synthex/guardrails/violations
 * List violations with filters or get summary
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
      const summary = await getViolationSummary(tenantId, days ? parseInt(days, 10) : 7);
      return NextResponse.json({ success: true, summary });
    }

    // List violations
    const policyId = searchParams.get("policy_id") || undefined;
    const severity = searchParams.get("severity") as any;
    const blocked = searchParams.get("blocked");
    const limit = searchParams.get("limit");

    const violations = await listViolations(tenantId, {
      policyId,
      severity,
      blocked: blocked === "true" ? true : blocked === "false" ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, violations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Guardrail Violations GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
