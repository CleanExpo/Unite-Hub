/**
 * Synthex Guardrails Policies API
 *
 * Phase: D49 - Global Guardrails & Kill Switch
 *
 * GET - List guardrail policies
 * POST - Create policy, update policy, delete policy, AI recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createPolicy,
  listPolicies,
  updatePolicy,
  deletePolicy,
  aiRecommendGuardrails,
  listViolations,
} from "@/lib/synthex/guardrailService";

/**
 * GET /api/synthex/guardrails
 * List guardrail policies with filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") as any;
    const enabled = searchParams.get("enabled");

    const policies = await listPolicies(tenantId, {
      scope,
      enabled: enabled === "true" ? true : enabled === "false" ? false : undefined,
    });

    return NextResponse.json({ success: true, policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Guardrails GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/guardrails
 * Actions: create, update, delete, ai_recommend
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
        const { scope, key, name, description, enabled, config, severity } = body;

        if (!scope || !key || !name) {
          return NextResponse.json(
            { success: false, error: "scope, key, and name are required" },
            { status: 400 }
          );
        }

        const policy = await createPolicy(tenantId, {
          scope,
          key,
          name,
          description,
          enabled,
          config,
          severity,
        });

        return NextResponse.json({ success: true, policy });
      }

      case "update": {
        const { policy_id, ...updates } = body;

        if (!policy_id) {
          return NextResponse.json(
            { success: false, error: "policy_id is required" },
            { status: 400 }
          );
        }

        const policy = await updatePolicy(policy_id, updates);

        return NextResponse.json({ success: true, policy });
      }

      case "delete": {
        const { policy_id } = body;

        if (!policy_id) {
          return NextResponse.json(
            { success: false, error: "policy_id is required" },
            { status: 400 }
          );
        }

        await deletePolicy(policy_id);

        return NextResponse.json({ success: true });
      }

      case "ai_recommend": {
        // Get recent violations
        const violations = await listViolations(tenantId, { limit: 50 });

        // Get AI recommendations
        const recommendations = await aiRecommendGuardrails(tenantId, violations);

        return NextResponse.json({ success: true, ...recommendations });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: create, update, delete, ai_recommend" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Guardrails POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
