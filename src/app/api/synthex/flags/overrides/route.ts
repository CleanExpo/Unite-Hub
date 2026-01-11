/**
 * Synthex Feature Flag Overrides API
 *
 * Phase: D46 - Feature Flags & Rollout Control
 *
 * POST - Create override
 * DELETE - Delete override
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createOverride,
  deleteOverride,
} from "@/lib/synthex/featureFlagService";

/**
 * POST /api/synthex/flags/overrides
 * Create or update an override
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const body = await request.json();
    const { feature_flag_id, scope_type, scope_ref, state, reason, metadata } = body;

    if (!feature_flag_id || !scope_type || !scope_ref || state === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "feature_flag_id, scope_type, scope_ref, and state are required",
        },
        { status: 400 }
      );
    }

    const override = await createOverride(
      tenantId,
      { feature_flag_id, scope_type, scope_ref, state, reason, metadata },
      user.id
    );

    return NextResponse.json({ success: true, override });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Overrides POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synthex/flags/overrides
 * Delete an override (requires override_id in query params)
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const overrideId = searchParams.get("override_id");

    if (!overrideId) {
      return NextResponse.json(
        { success: false, error: "override_id query parameter is required" },
        { status: 400 }
      );
    }

    await deleteOverride(overrideId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Overrides DELETE]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
