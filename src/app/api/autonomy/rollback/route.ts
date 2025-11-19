/**
 * Autonomy Rollback API - Phase 9 Week 7-8
 *
 * POST /api/autonomy/rollback
 * Rollback an executed proposal.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { rollbackEngine } from "@/lib/autonomy/rollbackEngine";
import { z } from "zod";

const RollbackSchema = z.object({
  rollback_token_id: z.string().uuid(),
  reason: z.string().min(1),
  rollback_type: z.enum(["SOFT_UNDO", "HARD_UNDO", "ESCALATED_RESTORE"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse request
    const body = await req.json();
    const parsed = RollbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { rollback_token_id, reason, rollback_type } = parsed.data;

    // Check if rollback is available
    const availability = await rollbackEngine.isRollbackAvailable(rollback_token_id);

    if (!availability.available) {
      return NextResponse.json(
        {
          error: "Rollback not available",
          reason: availability.reason,
          deadline: availability.deadline,
        },
        { status: 400 }
      );
    }

    // Perform rollback
    const result = await rollbackEngine.rollback({
      rollback_token_id,
      requested_by: userId,
      reason,
      rollback_type,
    });

    return NextResponse.json({
      result,
      message: result.success
        ? `Rollback completed: ${result.message}`
        : `Rollback failed: ${result.error}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomy/rollback
 * Check rollback availability for a token.
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rollbackTokenId = req.nextUrl.searchParams.get("rollback_token_id");

    if (!rollbackTokenId) {
      return NextResponse.json(
        { error: "rollback_token_id is required" },
        { status: 400 }
      );
    }

    const availability = await rollbackEngine.isRollbackAvailable(rollbackTokenId);

    return NextResponse.json({
      ...availability,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check rollback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
