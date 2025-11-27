'use client';

/**
 * CONVEX Collaboration Panel Component
 *
 * Manages strategy sharing, comments, and activity with:
 * - Share strategy with access levels (viewer/editor/owner)
 * - Comment threading with resolution tracking
 * - Activity timeline with user actions
 * - Permission-based access display
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  Trash2,
  User,
  X,
} from 'lucide-react';

interface AccessLevel {
  userId: string;
  userName: string;
  email: string;
  role: 'viewer' | 'editor' | 'owner';
  sharedAt: string;
  expiresAt?: string;
  sharedBy: string;
}

interface StrategyComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: StrategyComment[];
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'commented' | 'shared' | 'restored';
  user: string;
  description: string;
  timestamp: string;
}

interface CollaborationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyId: string;
  strategyTitle: string;
  accessList: AccessLevel[];
  comments: StrategyComment[];
  activityLog: Activity[];
  currentUserId: string;
  currentUserRole: 'viewer' | 'editor' | 'owner';
  onShare?: (email: string, role: 'viewer' | 'editor' | 'owner') => Promise<void>;
  onRevokeAccess?: (userId: string) => Promise<void>;
  onAddComment?: (content: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
}

export function ConvexCollaborationPanel({
  open,
  onOpenChange,
  strategyId,
  strategyTitle,
  accessList,
  comments,
  activityLog,
  currentUserId,
  currentUserRole,
  onShare,
  onRevokeAccess,
  onAddComment,
  onResolveComment,
}: CollaborationPanelProps) {
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('viewer');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isCommentingAround, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const canShare = currentUserRole === 'owner' || currentUserRole === 'editor';
  const canComment = currentUserRole !== 'viewer';

  const handleShare = async () => {
    if (!shareEmail.trim() || !onShare) return;

    setIsSharing(true);
    setShareError(null);

    try {
      await onShare(shareEmail, shareRole);
      setShareEmail('');
      setShareRole('viewer');
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : 'Failed to share strategy'
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return;

    setIsCommenting(true);
    setCommentError(null);

    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      setCommentError(
        error instanceof Error ? error.message : 'Failed to add comment'
      );
    } finally {
      setIsCommenting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'updated':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'commented':
        return <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'shared':
        return <Share2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'restored':
        return <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'viewer':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Strategy Collaboration</DialogTitle>
          <DialogDescription>{strategyTitle}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sharing" className="mt-6">
          <TabsList>
            <TabsTrigger value="sharing">Sharing ({accessList.length})</TabsTrigger>
            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Sharing Tab */}
          <TabsContent value="sharing">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Share Form */}
                {canShare && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                    {shareError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{shareError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Email Address</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="user@example.com"
                          type="email"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          disabled={isSharing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Access Level</label>
                      <Select value={shareRole} onValueChange={(value: any) => setShareRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                          <SelectItem value="editor">Editor (can modify)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleShare}
                      disabled={isSharing || !shareEmail.trim()}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Strategy
                    </Button>
                  </div>
                )}

                {!canShare && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Only editors and owners can share strategies
                    </AlertDescription>
                  </Alert>
                )}

                {/* Access List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Team Access</h4>
                  {accessList.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No one else has access to this strategy yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {accessList.map((access) => (
                        <div
                          key={access.userId}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {access.userName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {access.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(access.role)}>
                              {access.role}
                            </Badge>
                            {access.expiresAt && (
                              <Badge variant="outline">
                                Expires{' '}
                                {new Date(access.expiresAt).toLocaleDateString()}
                              </Badge>
                            )}
                            {currentUserRole === 'owner' && access.userId !== currentUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRevokeAccess?.(access.userId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Form */}
                {canComment && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    {commentError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{commentError}</AlertDescription>
                      </Alert>
                    )}

                    <Textarea
                      placeholder="Add feedback or suggestions..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isCommentingAround}
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={isCommentingAround || !newComment.trim()}
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                )}

                {!canComment && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Viewers cannot comment on strategies
                    </AlertDescription>
                  </Alert>
                )}

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No comments yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`border rounded-lg p-4 space-y-2 ${
                            comment.resolved ? 'bg-green-50 dark:bg-green-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{comment.author}</p>
                              <time className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </time>
                            </div>
                            {comment.resolved && (
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                          {!comment.resolved && canComment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onResolveComment?.(comment.id)}
                              className="text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No activity yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activityLog.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-4 items-start p-3 border rounded-lg bg-muted/20"
                        >
                          <div className="mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{activity.user}</p>
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground mt-1">
                              {activity.description}
                            </p>
                            <time className="text-xs text-muted-foreground mt-1 block">
                              {new Date(activity.timestamp).toLocaleString()}
                            </time>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Footer */}
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
