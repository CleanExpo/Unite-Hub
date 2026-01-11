/**
 * /api/founder/rate-limits
 *
 * Rate Limiting API (Phase E23)
 * GET: List rate limits, check limits, statistics, list events
 * POST: Create rate limit rule, check rate limit
 * PATCH: Update rate limit rule
 * DELETE: Delete rate limit rule
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  checkRateLimit,
  recordRateEvent,
  checkAndRecordRateLimit,
  listRateLimits,
  createRateLimit,
  updateRateLimit,
  deleteRateLimit,
  getRateLimitStatistics,
  listRateLimitEvents,
  type RateLimitScope,
  type RateLimitWindow,
} from "@/lib/founder/rateLimitService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const scope = searchParams.get("scope") as RateLimitScope | null;
    const identifier = searchParams.get("identifier");
    const subject = searchParams.get("subject");
    const enabled = searchParams.get("enabled");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "check") {
      if (!scope || !identifier || !subject) {
        return NextResponse.json(
          { error: "scope, identifier, and subject required for check" },
          { status: 400 }
        );
      }

      const result = await checkRateLimit(workspaceId, scope, identifier, subject);
      return NextResponse.json(result);
    }

    if (action === "statistics") {
      const stats = await getRateLimitStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    if (action === "events") {
      const events = await listRateLimitEvents(
        workspaceId,
        identifier || undefined,
        subject || undefined,
        100
      );
      return NextResponse.json({ events, total: events.length });
    }

    // Default: list rate limits
    const limits = await listRateLimits(
      workspaceId,
      scope || undefined,
      enabled !== null ? enabled === "true" : undefined
    );
    return NextResponse.json({ limits, total: limits.length });
  } catch (error: any) {
    console.error("[API] /founder/rate-limits GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "create-limit") {
      const { scope, identifier, maxRequests, windowSize, windowType, enabled, metadata } = body;

      if (!scope || !identifier || !maxRequests || !windowSize || !windowType) {
        return NextResponse.json(
          { error: "Missing required fields: scope, identifier, maxRequests, windowSize, windowType" },
          { status: 400 }
        );
      }

      const limitId = await createRateLimit({
        tenantId: workspaceId,
        scope,
        identifier,
        maxRequests,
        windowSize,
        windowType,
        enabled,
        metadata,
      });

      return NextResponse.json({ success: true, limitId, message: "Rate limit created" });
    }

    if (action === "check-and-record") {
      const { scope, identifier, subject, metadata } = body;

      if (!scope || !identifier || !subject) {
        return NextResponse.json(
          { error: "Missing required fields: scope, identifier, subject" },
          { status: 400 }
        );
      }

      const result = await checkAndRecordRateLimit(workspaceId, scope, identifier, subject, metadata);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            ...result,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-limit, check-and-record" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/rate-limits POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, limitId, maxRequests, windowSize, windowType, enabled, metadata } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!limitId) {
      return NextResponse.json({ error: "limitId required" }, { status: 400 });
    }

    await updateRateLimit(limitId, {
      maxRequests,
      windowSize,
      windowType,
      enabled,
      metadata,
    });

    return NextResponse.json({ success: true, message: "Rate limit updated" });
  } catch (error: any) {
    console.error("[API] /founder/rate-limits PATCH error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const limitId = searchParams.get("limitId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!limitId) {
      return NextResponse.json({ error: "limitId required" }, { status: 400 });
    }

    await deleteRateLimit(limitId);

    return NextResponse.json({ success: true, message: "Rate limit deleted" });
  } catch (error: any) {
    console.error("[API] /founder/rate-limits DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
