/**
 * Autonomy Proposal Detail API - Phase 9 Week 7-8
 *
 * GET /api/autonomy/proposals/:id - Get proposal details
 * PATCH /api/autonomy/proposals/:id - Approve/reject proposal
 */

 
import { NextRequest } from "next/server";
import { withErrorBoundary, successResponse } from "@/lib/errors/boundaries";
import { getSupabaseServer } from "@/lib/supabase";
import { proposalEngine } from "@/lib/autonomy/proposalEngine";
import { executionEngine } from "@/lib/autonomy/executionEngine";
import { AuthenticationError, ValidationError, NotFoundError, AuthorizationError } from "@/core/errors/app-error";
import { z } from "zod";

const UpdateProposalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/autonomy/proposals/[id] - Get proposal details
 */
export const GET = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authenticate
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError();
    }
  } else {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new AuthenticationError();
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
    throw new NotFoundError("Proposal", id);
  }

  return successResponse({
    proposal,
    timestamp: new Date().toISOString(),
  });
});

/**
 * PATCH /api/autonomy/proposals/[id] - Approve/reject proposal
 */
export const PATCH = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authenticate
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let userId: string;

  if (token) {
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    userId = data.user.id;
  } else {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new AuthenticationError();
    }

    userId = data.user.id;
  }

  // Parse and validate request
  const body = await req.json();
  const parsed = UpdateProposalSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
      "Invalid request"
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
    throw new NotFoundError("Proposal", id);
  }

  // Check user is admin
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", proposal.organization_id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new AuthorizationError("Insufficient permissions to approve proposals");
  }

  if (action === "approve") {
    const approved = await proposalEngine.approveProposal(id, userId, notes);

    // Auto-execute if approved
    const execution = await executionEngine.executeProposal({
      proposal: approved,
      executor_type: "HUMAN",
      executor_id: userId,
    });

    return successResponse({
      proposal: approved,
      execution,
      message: execution.success
        ? "Proposal approved and executed"
        : `Proposal approved but execution failed: ${execution.error_message}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    if (!reason) {
      throw new ValidationError(
        [{ field: "reason", message: "Reason is required for rejection" }],
        "Validation failed"
      );
    }

    const rejected = await proposalEngine.rejectProposal(id, userId, reason);

    return successResponse({
      proposal: rejected,
      message: "Proposal rejected",
      timestamp: new Date().toISOString(),
    });
  }
});
