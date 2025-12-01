/**
 * Autonomy Proposal Detail API - Phase 9 Week 7-8
 *
 * GET /api/autonomy/proposals/:id - Get proposal details
 * PATCH /api/autonomy/proposals/:id - Approve/reject proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { proposalEngine } from "@/lib/autonomy/proposalEngine";
import { executionEngine } from "@/lib/autonomy/executionEngine";
import { z } from "zod";

const UpdateProposalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const supabase = await getSupabaseServer();

    // Get proposal with execution info
    const { data: proposal, error } = await supabase
      .from("autonomy_proposals")
      .select(`
        *,
        autonomy_executions (
          id,
          executed_at,
          execution_duration_ms,
          rollback_token_id,
          rollback_available_until
        )
      `)
      .eq("id", id)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({
      proposal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const parsed = UpdateProposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { action, notes, reason } = parsed.data;

    // Get proposal to verify access
    const supabase = await getSupabaseServer();
    const { data: proposal, error: propError } = await supabase
      .from("autonomy_proposals")
      .select("client_id, organization_id, status")
      .eq("id", id)
      .single();

    if (propError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check user is admin
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", proposal.organization_id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "approve") {
      const approved = await proposalEngine.approveProposal(id, userId, notes);

      // Auto-execute if approved
      const execution = await executionEngine.executeProposal({
        proposal: approved,
        executor_type: "HUMAN",
        executor_id: userId,
      });

      return NextResponse.json({
        proposal: approved,
        execution,
        message: execution.success
          ? "Proposal approved and executed"
          : `Proposal approved but execution failed: ${execution.error_message}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      if (!reason) {
        return NextResponse.json(
          { error: "Reason is required for rejection" },
          { status: 400 }
        );
      }

      const rejected = await proposalEngine.rejectProposal(id, userId, reason);

      return NextResponse.json({
        proposal: rejected,
        message: "Proposal rejected",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Update proposal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
