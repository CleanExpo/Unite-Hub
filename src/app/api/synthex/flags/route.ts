/**
 * Synthex Feature Flags API
 *
 * Phase: D46 - Feature Flags & Rollout Control
 *
 * GET - List feature flags
 * POST - Create flag, evaluate flag, get history, or generate AI rollout plan
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createFeatureFlag,
  listFeatureFlags,
  evaluateFeatureFlag,
  evaluateFeatureFlags,
  getRolloutHistory,
  getFeatureFlag,
  listOverrides,
  aiGenerateRolloutPlan,
} from "@/lib/synthex/featureFlagService";

/**
 * GET /api/synthex/flags
 * List all feature flags for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get("enabled");
    const limit = searchParams.get("limit");

    const flags = await listFeatureFlags(tenantId, {
      enabled: enabled === "true" ? true : enabled === "false" ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, flags });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Flags GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/flags
 * Actions: create, evaluate, evaluate_bulk, history, ai_rollout_plan
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
        const { key, name, description, default_state, segment_rules, metadata } = body;

        if (!key || !name) {
          return NextResponse.json(
            { success: false, error: "key and name are required" },
            { status: 400 }
          );
        }

        const flag = await createFeatureFlag(
          tenantId,
          { key, name, description, default_state, segment_rules, metadata },
          user.id
        );

        return NextResponse.json({ success: true, flag });
      }

      case "evaluate": {
        const { flag_key, user_id, business_id } = body;

        if (!flag_key) {
          return NextResponse.json(
            { success: false, error: "flag_key is required" },
            { status: 400 }
          );
        }

        const enabled = await evaluateFeatureFlag(tenantId, flag_key, {
          userId: user_id,
          businessId: business_id,
        });

        return NextResponse.json({ success: true, flag_key, enabled });
      }

      case "evaluate_bulk": {
        const { flag_keys, user_id, business_id } = body;

        if (!flag_keys || !Array.isArray(flag_keys)) {
          return NextResponse.json(
            { success: false, error: "flag_keys array is required" },
            { status: 400 }
          );
        }

        const results = await evaluateFeatureFlags(tenantId, flag_keys, {
          userId: user_id,
          businessId: business_id,
        });

        return NextResponse.json({ success: true, results });
      }

      case "history": {
        const { flag_id, limit } = body;

        if (!flag_id) {
          return NextResponse.json(
            { success: false, error: "flag_id is required" },
            { status: 400 }
          );
        }

        const events = await getRolloutHistory(tenantId, flag_id, limit);

        return NextResponse.json({ success: true, events });
      }

      case "ai_rollout_plan": {
        const { flag_id } = body;

        if (!flag_id) {
          return NextResponse.json(
            { success: false, error: "flag_id is required" },
            { status: 400 }
          );
        }

        const flag = await getFeatureFlag(flag_id);
        if (!flag) {
          return NextResponse.json(
            { success: false, error: "Feature flag not found" },
            { status: 404 }
          );
        }

        const overrides = await listOverrides(tenantId, flag_id);
        const plan = await aiGenerateRolloutPlan(flag, overrides);

        return NextResponse.json({ success: true, plan });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: create, evaluate, evaluate_bulk, history, ai_rollout_plan" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Flags POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
