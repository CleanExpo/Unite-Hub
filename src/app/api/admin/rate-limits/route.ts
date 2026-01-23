/**
 * /api/admin/rate-limits
 *
 * Rate limiting configuration (Phase E14)
 * GET: List rate limits and abuse flags
 * POST: Upsert rate limit config
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listRateLimits,
  upsertRateLimit,
  listAbuseFlags,
  resolveAbuseFlag,
  getUsageStats,
  type RateLimitWindow,
} from "@/lib/core/rateLimitService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action"); // 'limits', 'abuse-flags', 'usage-stats'
    const status = searchParams.get("status"); // for abuse flags filtering
    const route = searchParams.get("route"); // for usage stats filtering

    // CRITICAL: workspaceId is required for workspace isolation
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Check permission (settings.read or owner role)
    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle different actions
    if (action === "limits") {
      const limits = await listRateLimits(workspaceId || undefined);
      return NextResponse.json({ limits });
    }

    if (action === "abuse-flags" && workspaceId) {
      const flags = await listAbuseFlags(
        workspaceId,
        status || undefined
      );
      return NextResponse.json({ flags });
    }

    if (action === "usage-stats" && workspaceId) {
      const stats = await getUsageStats(
        workspaceId,
        route || undefined,
        24
      );
      return NextResponse.json({ stats });
    }

    // Default: return all (workspaceId is now guaranteed)
    const limits = await listRateLimits(workspaceId);
    const flags = await listAbuseFlags(workspaceId);
    const stats = await getUsageStats(workspaceId);

    return NextResponse.json({
      limits,
      flags,
      stats,
      total: {
        limits: limits.length,
        flags: flags.length,
      },
    });
  } catch (error: any) {
    console.error("[API] /admin/rate-limits GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action, limitConfig, flagId, resolutionNotes } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.write or owner role)
    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle upsert limit action
    if (action === "upsert-limit") {
      if (!limitConfig || !limitConfig.route_pattern || !limitConfig.limit_count || !limitConfig.time_window) {
        return NextResponse.json(
          { error: "limitConfig with route_pattern, limit_count, and time_window required" },
          { status: 400 }
        );
      }

      const limitId = await upsertRateLimit({
        tenant_id: workspaceId,
        route_pattern: limitConfig.route_pattern,
        limit_count: limitConfig.limit_count,
        time_window: limitConfig.time_window as RateLimitWindow,
        enabled: limitConfig.enabled !== undefined ? limitConfig.enabled : true,
        description: limitConfig.description || null,
      });

      if (!limitId) {
        return NextResponse.json(
          { error: "Failed to upsert rate limit" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        limit_id: limitId,
        message: `Rate limit configured for ${limitConfig.route_pattern}`,
      });
    }

    // Handle resolve abuse flag action
    if (action === "resolve-flag") {
      if (!flagId) {
        return NextResponse.json(
          { error: "flagId required for resolve-flag action" },
          { status: 400 }
        );
      }

      const resolved = await resolveAbuseFlag(
        flagId,
        user.id,
        resolutionNotes || undefined
      );

      if (!resolved) {
        return NextResponse.json(
          { error: "Failed to resolve abuse flag" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Abuse flag resolved",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'upsert-limit' or 'resolve-flag'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /admin/rate-limits POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
