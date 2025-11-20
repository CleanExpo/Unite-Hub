/**
 * Operator Queue API - Phase 10 Week 1-2
 *
 * GET /api/operator/queue - List queue items
 * POST /api/operator/queue - Resolve queue item
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { approvalQueueService } from "@/lib/operator/approvalQueueService";
import { operatorRoleService } from "@/lib/operator/operatorRoleService";
import { z } from "zod";

const ResolveSchema = z.object({
  queue_item_id: z.string().uuid(),
  action: z.enum(["approve", "reject", "escalate", "assign"]),
  notes: z.string().optional(),
  reason: z.string().optional(),
  assign_to: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
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

    // Get query params
    const organizationId = req.nextUrl.searchParams.get("organization_id");
    const status = req.nextUrl.searchParams.get("status");
    const myQueue = req.nextUrl.searchParams.get("my_queue") === "true";

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    // Verify operator exists
    const operator = await operatorRoleService.getOperator(userId, organizationId);

    if (!operator) {
      return NextResponse.json(
        { error: "Operator profile not found" },
        { status: 403 }
      );
    }

    let queue;

    if (myQueue) {
      // Get items the operator can approve
      queue = await approvalQueueService.getOperatorQueue(userId, organizationId);
    } else {
      // Get all org queue items
      queue = await approvalQueueService.getQueue(organizationId, {
        status: status as any,
      });
    }

    // Get stats
    const stats = await approvalQueueService.getQueueStats(organizationId);

    return NextResponse.json({
      queue,
      stats,
      operator,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const parsed = ResolveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { queue_item_id, action, notes, reason, assign_to } = parsed.data;

    let result;

    switch (action) {
      case "approve":
        result = await approvalQueueService.resolve({
          queue_item_id,
          resolved_by: userId,
          status: "APPROVED",
          notes,
        });
        break;

      case "reject":
        result = await approvalQueueService.resolve({
          queue_item_id,
          resolved_by: userId,
          status: "REJECTED",
          notes,
        });
        break;

      case "escalate":
        if (!reason) {
          return NextResponse.json(
            { error: "Reason required for escalation" },
            { status: 400 }
          );
        }
        result = await approvalQueueService.escalate(queue_item_id, userId, reason);
        break;

      case "assign":
        if (!assign_to) {
          return NextResponse.json(
            { error: "assign_to required for assignment" },
            { status: 400 }
          );
        }
        result = await approvalQueueService.assignToOperator(queue_item_id, assign_to);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      result,
      message: `Queue item ${action}ed successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Queue resolve error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
