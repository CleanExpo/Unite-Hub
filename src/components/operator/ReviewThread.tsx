"use client";

/**
 * Review Thread Component - Phase 10 Week 3-4
 *
 * Threaded discussion UI for proposal reviews.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Reply,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Send,
} from "lucide-react";

interface ReviewComment {
  id: string;
  author_id: string;
  author_role: string;
  content: string;
  comment_type: string;
  reactions: Record<string, string[]>;
  is_resolved: boolean;
  created_at: string;
  replies?: ReviewComment[];
}

interface ReviewThreadProps {
  proposalId: string;
  queueItemId?: string;
  organizationId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function ReviewThread({
  proposalId,
  queueItemId,
  organizationId,
  currentUserId,
  currentUserRole,
}: ReviewThreadProps) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("COMMENT");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [proposalId, queueItemId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ proposal_id: proposalId });
      if (queueItemId) params.set("queue_item_id", queueItemId);

      const response = await fetch(`/api/operator/review?${params}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/operator/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          proposal_id: proposalId,
          queue_item_id: queueItemId,
          organization_id: organizationId,
          content: newComment,
          parent_id: replyingTo,
          comment_type: commentType,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setReplyingTo(null);
        setCommentType("COMMENT");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await fetch("/api/operator/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_comment",
          comment_id: commentId,
        }),
      });
      fetchComments();
    } catch (error) {
      console.error("Failed to resolve:", error);
    }
  };

  const handleReact = async (commentId: string, reaction: string) => {
    try {
      await fetch("/api/operator/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "react",
          comment_id: commentId,
          reaction,
        }),
      });
      fetchComments();
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "APPROVAL":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "REJECTION":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "QUESTION":
        return <HelpCircle className="w-4 h-4 text-blue-500" />;
      case "SUGGESTION":
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case "RESOLUTION":
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      OWNER: "bg-purple-100 text-purple-800",
      MANAGER: "bg-blue-100 text-blue-800",
      ANALYST: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge variant="outline" className={colors[role] || ""}>
        {role}
      </Badge>
    );
  };

  const renderComment = (comment: ReviewComment, depth: number = 0) => (
    <div
      key={comment.id}
      className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}
    >
      <div
        className={`p-4 rounded-lg ${
          comment.is_resolved ? "bg-muted/50" : "bg-muted"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {comment.author_role.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {getRoleBadge(comment.author_role)}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
            {getTypeIcon(comment.comment_type)}
          </div>
          {comment.is_resolved && (
            <Badge variant="outline" className="text-green-600">
              Resolved
            </Badge>
          )}
        </div>

        {/* Content */}
        <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleReact(comment.id, "👍")}
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            {comment.reactions["👍"]?.length || 0}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReplyingTo(comment.id)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
          {!comment.is_resolved &&
            ["QUESTION", "SUGGESTION"].includes(comment.comment_type) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleResolve(comment.id)}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolve
              </Button>
            )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion
          {comments.length > 0 && (
            <Badge variant="secondary">{comments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        {!replyingTo && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={commentType} onValueChange={setCommentType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMENT">Comment</SelectItem>
                  <SelectItem value="QUESTION">Question</SelectItem>
                  <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                  {currentUserRole !== "ANALYST" && (
                    <>
                      <SelectItem value="APPROVAL">Approval Note</SelectItem>
                      <SelectItem value="REJECTION">Rejection Note</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            No comments yet
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReviewThread;
