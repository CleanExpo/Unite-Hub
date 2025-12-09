/**
 * Synthex Kill Switch API
 *
 * Phase: D49 - Global Guardrails & Kill Switch
 *
 * GET - List kill switch states or check specific switch
 * POST - Set kill switch state
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  setKillSwitch,
  checkKillSwitch,
  listKillSwitches,
} from "@/lib/synthex/guardrailService";

/**
 * GET /api/synthex/guardrails/kill-switch
 * List kill switches or check specific switch
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "check") {
      const scope = searchParams.get("scope") as any;
      const target = searchParams.get("target") || "all";

      if (!scope) {
        return NextResponse.json(
          { success: false, error: "scope is required for check action" },
          { status: 400 }
        );
      }

      const enabled = await checkKillSwitch(tenantId, scope, target);
      return NextResponse.json({ success: true, enabled });
    }

    // List kill switches
    const scope = searchParams.get("scope") as any;
    const enabled = searchParams.get("enabled");

    const killSwitches = await listKillSwitches(tenantId, {
      scope,
      enabled: enabled === "true" ? true : enabled === "false" ? false : undefined,
    });

    return NextResponse.json({ success: true, killSwitches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Kill Switch GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/guardrails/kill-switch
 * Set kill switch state
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const body = await request.json();
    const { scope, target, enabled, reason, metadata } = body;

    if (!scope || !target || enabled === undefined) {
      return NextResponse.json(
        { success: false, error: "scope, target, and enabled are required" },
        { status: 400 }
      );
    }

    const killSwitch = await setKillSwitch(tenantId, {
      scope,
      target,
      enabled,
      reason,
      metadata,
    });

    return NextResponse.json({ success: true, killSwitch });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Kill Switch POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
