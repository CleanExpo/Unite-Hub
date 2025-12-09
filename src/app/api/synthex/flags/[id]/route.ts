/**
 * Synthex Feature Flag by ID API
 *
 * Phase: D46 - Feature Flags & Rollout Control
 *
 * GET - Get flag details
 * PUT - Update flag
 * DELETE - Delete flag
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  listOverrides,
  getRolloutHistory,
} from "@/lib/synthex/featureFlagService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/flags/[id]
 * Get flag with optional overrides and history
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeOverrides = searchParams.get("includeOverrides") === "true";
    const includeHistory = searchParams.get("includeHistory") === "true";

    const flag = await getFeatureFlag(id);
    if (!flag) {
      return NextResponse.json(
        { success: false, error: "Feature flag not found" },
        { status: 404 }
      );
    }

    const response: {
      flag: typeof flag;
      overrides?: Awaited<ReturnType<typeof listOverrides>>;
      history?: Awaited<ReturnType<typeof getRolloutHistory>>;
    } = { flag };

    if (includeOverrides) {
      response.overrides = await listOverrides(tenantId, id);
    }

    if (includeHistory) {
      response.history = await getRolloutHistory(tenantId, id, 20);
    }

    return NextResponse.json({ success: true, ...response });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Flag GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/synthex/flags/[id]
 * Update flag
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const flag = await updateFeatureFlag(id, body, user.id);

    return NextResponse.json({ success: true, flag });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Flag PUT]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synthex/flags/[id]
 * Delete flag
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteFeatureFlag(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Flag DELETE]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
