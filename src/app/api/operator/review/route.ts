/**
 * Operator Review API - Phase 10 Week 3-4
 *
 * Handles comments, votes, and conflict resolution.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { commentService } from "@/lib/operator/commentService";
import { consensusService } from "@/lib/operator/consensusService";
import { operatorRoleService } from "@/lib/operator/operatorRoleService";
import { z } from "zod";

const CommentSchema = z.object({
  action: z.literal("comment"),
  proposal_id: z.string().uuid(),
  queue_item_id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  content: z.string().min(1),
  parent_id: z.string().uuid().optional(),
  comment_type: z.enum([
    "COMMENT",
    "APPROVAL",
    "REJECTION",
    "QUESTION",
    "SUGGESTION",
    "RESOLUTION",
  ]).optional(),
});

const VoteSchema = z.object({
  action: z.literal("vote"),
  queue_item_id: z.string().uuid(),
  vote: z.enum(["APPROVE", "REJECT", "ABSTAIN", "DEFER"]),
  reason: z.string().optional(),
  is_override: z.boolean().optional(),
});

const ResolveCommentSchema = z.object({
  action: z.literal("resolve_comment"),
  comment_id: z.string().uuid(),
});

const ResolveConflictSchema = z.object({
  action: z.literal("resolve_conflict"),
  conflict_id: z.string().uuid(),
  resolution: z.string().min(1),
});

const ReactSchema = z.object({
  action: z.literal("react"),
  comment_id: z.string().uuid(),
  reaction: z.string().min(1),
  remove: z.boolean().optional(),
});

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

    // Get query params
    const proposalId = req.nextUrl.searchParams.get("proposal_id");
    const queueItemId = req.nextUrl.searchParams.get("queue_item_id");
    const organizationId = req.nextUrl.searchParams.get("organization_id");

    if (proposalId) {
      // Get comments
      const comments = await commentService.getComments(proposalId, {
        includeReplies: true,
        queueItemId: queueItemId || undefined,
      });

      const unresolvedCount = await commentService.getUnresolvedCount(proposalId);

      return NextResponse.json({
        comments,
        unresolved_count: unresolvedCount,
        timestamp: new Date().toISOString(),
      });
    }

    if (queueItemId) {
      // Get votes and consensus
      const votes = await consensusService.getVotes(queueItemId);
      const consensus = await consensusService.checkConsensus(queueItemId);

      return NextResponse.json({
        votes,
        consensus,
        timestamp: new Date().toISOString(),
      });
    }

    if (organizationId) {
      // Get conflicts and activity
      const conflicts = await consensusService.getOpenConflicts(organizationId);
      const activity = await consensusService.getActivityStream(organizationId);

      return NextResponse.json({
        conflicts,
        activity,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "proposal_id, queue_item_id, or organization_id required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Review GET error:", error);
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
    const action = body.action;

    // Handle comment
    if (action === "comment") {
      const parsed = CommentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request", details: parsed.error.errors },
          { status: 400 }
        );
      }

      // Get operator role
      const operator = await operatorRoleService.getOperator(
        userId,
        parsed.data.organization_id
      );

      if (!operator) {
        return NextResponse.json(
          { error: "Operator not found" },
          { status: 403 }
        );
      }

      const comment = await commentService.createComment({
        ...parsed.data,
        author_id: userId,
        author_role: operator.role,
      });

      return NextResponse.json({
        comment,
        message: "Comment added",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle vote
    if (action === "vote") {
      const parsed = VoteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request", details: parsed.error.errors },
          { status: 400 }
        );
      }

      // Get queue item for org
      const supabase = await getSupabaseServer();
      const { data: queueItem } = await supabase
        .from("operator_approval_queue")
        .select("organization_id")
        .eq("id", parsed.data.queue_item_id)
        .single();

      if (!queueItem) {
        return NextResponse.json(
          { error: "Queue item not found" },
          { status: 404 }
        );
      }

      // Get operator role
      const operator = await operatorRoleService.getOperator(
        userId,
        queueItem.organization_id
      );

      if (!operator) {
        return NextResponse.json(
          { error: "Operator not found" },
          { status: 403 }
        );
      }

      const vote = await consensusService.castVote(
        parsed.data.queue_item_id,
        userId,
        operator.role,
        parsed.data.vote,
        parsed.data.reason,
        parsed.data.is_override
      );

      const consensus = await consensusService.checkConsensus(
        parsed.data.queue_item_id
      );

      return NextResponse.json({
        vote,
        consensus,
        message: "Vote cast",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle resolve comment
    if (action === "resolve_comment") {
      const parsed = ResolveCommentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request" },
          { status: 400 }
        );
      }

      const comment = await commentService.resolveComment(
        parsed.data.comment_id,
        userId
      );

      return NextResponse.json({
        comment,
        message: "Comment resolved",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle resolve conflict
    if (action === "resolve_conflict") {
      const parsed = ResolveConflictSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request" },
          { status: 400 }
        );
      }

      await consensusService.resolveConflict(
        parsed.data.conflict_id,
        userId,
        parsed.data.resolution
      );

      return NextResponse.json({
        message: "Conflict resolved",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle reaction
    if (action === "react") {
      const parsed = ReactSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request" },
          { status: 400 }
        );
      }

      if (parsed.data.remove) {
        await commentService.removeReaction(
          parsed.data.comment_id,
          userId,
          parsed.data.reaction
        );
      } else {
        await commentService.addReaction(
          parsed.data.comment_id,
          userId,
          parsed.data.reaction
        );
      }

      return NextResponse.json({
        message: parsed.data.remove ? "Reaction removed" : "Reaction added",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
