/**
 * Comment Service - Phase 10 Week 3-4
 *
 * Handles threaded comments on proposals and reviews.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { OperatorRole } from "./operatorRoleService";

// =============================================================
// Types
// =============================================================

export type CommentType =
  | "COMMENT"
  | "APPROVAL"
  | "REJECTION"
  | "QUESTION"
  | "SUGGESTION"
  | "RESOLUTION";

export interface ReviewComment {
  id: string;
  proposal_id: string;
  queue_item_id?: string;
  organization_id: string;
  author_id: string;
  author_role: OperatorRole;
  content: string;
  parent_id?: string;
  thread_depth: number;
  comment_type: CommentType;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  // Populated
  replies?: ReviewComment[];
  author?: any;
}

export interface CreateCommentRequest {
  proposal_id: string;
  queue_item_id?: string;
  organization_id: string;
  author_id: string;
  author_role: OperatorRole;
  content: string;
  parent_id?: string;
  comment_type?: CommentType;
}

// =============================================================
// Comment Service
// =============================================================

export class CommentService {
  /**
   * Create a comment
   */
  async createComment(request: CreateCommentRequest): Promise<ReviewComment> {
    const supabase = await getSupabaseServer();

    // Calculate thread depth
    let threadDepth = 0;
    if (request.parent_id) {
      const { data: parent } = await supabase
        .from("review_comments")
        .select("thread_depth")
        .eq("id", request.parent_id)
        .single();

      threadDepth = (parent?.thread_depth || 0) + 1;
    }

    const { data, error } = await supabase
      .from("review_comments")
      .insert({
        proposal_id: request.proposal_id,
        queue_item_id: request.queue_item_id,
        organization_id: request.organization_id,
        author_id: request.author_id,
        author_role: request.author_role,
        content: request.content,
        parent_id: request.parent_id,
        thread_depth: threadDepth,
        comment_type: request.comment_type || "COMMENT",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    // Log activity
    await this.logCommentActivity(
      request.organization_id,
      request.author_id,
      request.author_role,
      request.queue_item_id || null,
      request.proposal_id,
      data.id,
      "COMMENT_ADDED",
      `${request.author_role} added ${request.comment_type || "comment"}`
    );

    return data;
  }

  /**
   * Get comments for a proposal
   */
  async getComments(
    proposalId: string,
    options?: { includeReplies?: boolean; queueItemId?: string }
  ): Promise<ReviewComment[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("review_comments")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: true });

    if (options?.queueItemId) {
      query = query.eq("queue_item_id", options.queueItemId);
    }

    const { data, error } = await query;

    if (error) return [];

    if (options?.includeReplies) {
      return this.buildThreadTree(data);
    }

    return data;
  }

  /**
   * Build threaded tree from flat comments
   */
  private buildThreadTree(comments: ReviewComment[]): ReviewComment[] {
    const map = new Map<string, ReviewComment>();
    const roots: ReviewComment[] = [];

    // First pass: create map
    comments.forEach((comment) => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach((comment) => {
      const node = map.get(comment.id)!;
      if (comment.parent_id) {
        const parent = map.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    authorId: string,
    content: string
  ): Promise<ReviewComment> {
    const supabase = await getSupabaseServer();

    // Verify author
    const { data: existing } = await supabase
      .from("review_comments")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (existing?.author_id !== authorId) {
      throw new Error("Can only edit own comments");
    }

    const { data, error } = await supabase
      .from("review_comments")
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return data;
  }

  /**
   * Resolve a comment thread
   */
  async resolveComment(
    commentId: string,
    resolvedBy: string
  ): Promise<ReviewComment> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("review_comments")
      .update({
        is_resolved: true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve comment: ${error.message}`);
    }

    return data;
  }

  /**
   * Add reaction to comment
   */
  async addReaction(
    commentId: string,
    userId: string,
    reaction: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get current reactions
    const { data: comment } = await supabase
      .from("review_comments")
      .select("reactions")
      .eq("id", commentId)
      .single();

    const reactions = comment?.reactions || {};

    // Add user to reaction
    if (!reactions[reaction]) {
      reactions[reaction] = [];
    }
    if (!reactions[reaction].includes(userId)) {
      reactions[reaction].push(userId);
    }

    await supabase
      .from("review_comments")
      .update({ reactions })
      .eq("id", commentId);
  }

  /**
   * Remove reaction from comment
   */
  async removeReaction(
    commentId: string,
    userId: string,
    reaction: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get current reactions
    const { data: comment } = await supabase
      .from("review_comments")
      .select("reactions")
      .eq("id", commentId)
      .single();

    const reactions = comment?.reactions || {};

    // Remove user from reaction
    if (reactions[reaction]) {
      reactions[reaction] = reactions[reaction].filter(
        (id: string) => id !== userId
      );
      if (reactions[reaction].length === 0) {
        delete reactions[reaction];
      }
    }

    await supabase
      .from("review_comments")
      .update({ reactions })
      .eq("id", commentId);
  }

  /**
   * Get unresolved comment count
   */
  async getUnresolvedCount(proposalId: string): Promise<number> {
    const supabase = await getSupabaseServer();

    const { count, error } = await supabase
      .from("review_comments")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", proposalId)
      .eq("is_resolved", false)
      .in("comment_type", ["QUESTION", "SUGGESTION"]);

    if (error) return 0;
    return count || 0;
  }

  /**
   * Log comment activity
   */
  private async logCommentActivity(
    organizationId: string,
    actorId: string,
    actorRole: string,
    queueItemId: string | null,
    proposalId: string,
    commentId: string,
    activityType: string,
    summary: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("operator_activity_stream").insert({
      organization_id: organizationId,
      activity_type: activityType,
      actor_id: actorId,
      actor_role: actorRole,
      queue_item_id: queueItemId,
      proposal_id: proposalId,
      comment_id: commentId,
      summary,
      details: {},
    });
  }
}

export const commentService = new CommentService();
