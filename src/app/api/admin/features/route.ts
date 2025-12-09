/**
 * /api/admin/features
 *
 * Feature flag management (Phase E12)
 * GET: List all flags
 * POST: Create/update flags
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { listAllFlags, upsertFlag } from "@/lib/core/featureFlagService";
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

    // Check permission (settings.read or owner role)
    if (workspaceId) {
      const canView = await hasPermission(user.id, workspaceId, "settings", "read");
      if (!canView) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    const flags = await listAllFlags();

    return NextResponse.json({
      flags,
      total: flags.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/features GET error:", error);
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
    const { workspaceId, flagData } = body;

    if (!flagData || !flagData.key || !flagData.name) {
      return NextResponse.json({ error: "flagData with key and name required" }, { status: 400 });
    }

    // Check permission (settings.write or owner role)
    if (workspaceId) {
      const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
      if (!canWrite) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    const flagId = await upsertFlag(flagData);

    if (!flagId) {
      return NextResponse.json({ error: "Failed to create/update flag" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      flag_id: flagId,
    });
  } catch (error: any) {
    console.error("[API] /admin/features POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
