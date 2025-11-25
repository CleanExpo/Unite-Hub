'use client';

/**
 * Campaign Detailed View
 * Full blueprint modal displaying all content, visuals, scoring, and approval controls
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ThumbsUp,
  ThumbsDown,
  Eye,
  BarChart3,
  Target,
  Zap,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';

interface CampaignDetailedViewProps {
  blueprintId: string | null;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (blueprintId: string, channel?: string) => void;
  onReject?: (blueprintId: string, reason: string) => void;
}

export function CampaignDetailedView({
  blueprintId,
  workspaceId,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: CampaignDetailedViewProps) {
  const { toast } = useToast();
  const [blueprint, setBlueprint] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (isOpen && blueprintId) {
      fetchBlueprint();
    }
  }, [isOpen, blueprintId]);

  const fetchBlueprint = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/campaigns/blueprints/${blueprintId}?workspaceId=${workspaceId}`
      );

      if (!response.ok) throw new Error('Failed to fetch blueprint');

      const data = await response.json();
      setBlueprint(data.blueprint);
      setRevisions(data.revisions || []);

      // Auto-select first channel
      if (data.blueprint.channels && Object.keys(data.blueprint.channels).length > 0) {
        setSelectedChannel(Object.keys(data.blueprint.channels)[0]);
      }
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blueprint details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveChannel = async (channel: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/blueprints/${blueprintId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approve_channel: { channel } }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve channel');

      const data = await response.json();
      setBlueprint(data.blueprint);

      toast({
        title: 'Channel Approved',
        description: `${channel.replace(/_/g, ' ')} has been approved`,
      });

      if (onApprove) onApprove(blueprintId!, channel);
    } catch (error) {
      console.error('Error approving channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve channel',
        variant: 'destructive',
      });
    }
  };

  const handleApproveAll = async () => {
    try {
      const response = await fetch(
        `/api/campaigns/blueprints/${blueprintId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval_status: 'approved' }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve blueprint');

      const data = await response.json();
      setBlueprint(data.blueprint);

      toast({
        title: 'Blueprint Approved',
        description: 'All channels have been approved',
      });

      if (onApprove) onApprove(blueprintId!);
    } catch (error) {
      console.error('Error approving blueprint:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve blueprint',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/campaigns/blueprints/${blueprintId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approval_status: 'rejected',
            rejected_reason: rejectReason,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject blueprint');

      const data = await response.json();
      setBlueprint(data.blueprint);

      toast({
        title: 'Blueprint Rejected',
        description: 'The blueprint has been rejected',
      });

      if (onReject) onReject(blueprintId!, rejectReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting blueprint:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject blueprint',
        variant: 'destructive',
      });
    }
  };

  const getChannelApprovalBadge = (channel: string) => {
    const approval = blueprint?.channel_approvals?.[channel];
    if (approval === 'approved')
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (approval === 'rejected')
      return <Badge variant="destructive"><ThumbsDown className="h-3 w-3 mr-1" />Rejected</Badge>;
    if (approval === 'pending')
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
  };

  const getChannelContent = (channel: string) => {
    if (channel.includes('website')) return blueprint?.website_content;
    if (channel.includes('blog')) return blueprint?.blog_content;
    if (channel.includes('email')) return blueprint?.email_content;
    if (channel.includes('facebook') || channel.includes('instagram') || channel.includes('linkedin'))
      return blueprint?.social_content?.[channel];
    if (channel.includes('tiktok') || channel.includes('youtube'))
      return blueprint?.video_content?.[channel];
    return null;
  };

  if (!blueprint && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{blueprint?.blueprint_title}</DialogTitle>
              <DialogDescription className="mt-1">
                {blueprint?.brand_slug.replace(/_/g, ' ')} •{' '}
                {blueprint?.blueprint_type.replace(/_/g, ' ')}
              </DialogDescription>
            </div>
            <Badge
              variant={
                blueprint?.approval_status === 'approved'
                  ? 'default'
                  : blueprint?.approval_status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {blueprint?.approval_status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading blueprint...</div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="visuals">Visuals</TabsTrigger>
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Scoring Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Campaign Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-600">
                        {blueprint?.priority_score?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">Priority</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{blueprint?.impact_score || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Impact</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{blueprint?.difficulty_score || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Difficulty</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{blueprint?.effort_score || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Effort</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Keywords & Objective */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Primary Objective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="capitalize">{blueprint?.primary_objective?.replace(/_/g, ' ')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {blueprint?.topic_keywords?.map((keyword: string) => (
                        <Badge key={keyword} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Uncertainty Notes */}
              {blueprint?.uncertainty_notes && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <AlertCircle className="h-5 w-5" />
                      Review Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {blueprint.uncertainty_notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {blueprint?.channels &&
                  Object.keys(blueprint.channels).map((channel) => (
                    <Button
                      key={channel}
                      variant={selectedChannel === channel ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChannel(channel)}
                      className="justify-between"
                    >
                      <span className="text-xs truncate">
                        {channel.replace(/_/g, ' ')}
                      </span>
                      {getChannelApprovalBadge(channel)}
                    </Button>
                  ))}
              </div>

              {selectedChannel && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{selectedChannel.replace(/_/g, ' ')}</CardTitle>
                      <CardDescription>Draft content for review</CardDescription>
                    </div>
                    {blueprint?.channel_approvals?.[selectedChannel] !== 'approved' && (
                      <Button onClick={() => handleApproveChannel(selectedChannel)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve Channel
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const content = getChannelContent(selectedChannel);
                      if (!content) return <p className="text-muted-foreground">No content generated</p>;

                      return (
                        <>
                          {content.headline && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Headline</p>
                              <p className="text-lg font-bold">{content.headline}</p>
                            </div>
                          )}
                          {content.hook && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Hook</p>
                              <p>{content.hook}</p>
                            </div>
                          )}
                          {content.draft_content && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Content</p>
                              <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{content.draft_content}</p>
                              </div>
                            </div>
                          )}
                          {content.cta && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Call to Action</p>
                              <p className="font-semibold">{content.cta}</p>
                            </div>
                          )}
                          {content.hashtags && content.hashtags.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Hashtags</p>
                              <div className="flex flex-wrap gap-1">
                                {content.hashtags.map((tag: string) => (
                                  <Badge key={tag} variant="secondary">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {content.word_count && (
                            <div className="text-sm text-muted-foreground">
                              Word count: {content.word_count}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Visuals Tab */}
            <TabsContent value="visuals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Visual Concepts
                  </CardTitle>
                  <CardDescription>
                    AI-generated visual concepts (placeholders pending VIF generation)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {blueprint?.visual_concepts && blueprint.visual_concepts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {blueprint.visual_concepts.map((visual: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <Badge variant="outline">{visual.visual_type?.replace(/_/g, ' ')}</Badge>
                          <p className="text-sm">{visual.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Dimensions: {visual.dimensions}
                          </p>
                          {visual.vif_prompt_id && (
                            <p className="text-xs text-muted-foreground font-mono">
                              VIF ID: {visual.vif_prompt_id}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No visual concepts generated</p>
                  )}
                </CardContent>
              </Card>

              {/* SEO Recommendations */}
              {blueprint?.seo_recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold">Primary Keyword:</span>{' '}
                      {blueprint.seo_recommendations.primary_keyword}
                    </div>
                    {blueprint.seo_recommendations.secondary_keywords && (
                      <div>
                        <span className="font-semibold">Secondary Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {blueprint.seo_recommendations.secondary_keywords.map((kw: string) => (
                            <Badge key={kw} variant="outline">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {blueprint.seo_recommendations.search_volume && (
                      <div>
                        <span className="font-semibold">Search Volume:</span>{' '}
                        {blueprint.seo_recommendations.search_volume}/month
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scoring Breakdown</CardTitle>
                  <CardDescription>
                    Priority = (Impact × 10) / (Difficulty + Effort)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Impact Score</span>
                      <Badge>{blueprint?.impact_score}/10</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Potential reach and business impact of this campaign
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Difficulty Score</span>
                      <Badge>{blueprint?.difficulty_score}/10</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complexity based on keyword competition and content requirements
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Effort Score</span>
                      <Badge>{blueprint?.effort_score}/10</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Resources and time required for execution across all channels
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Priority Score</span>
                      <Badge variant="default" className="text-lg">
                        {blueprint?.priority_score?.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {blueprint?.data_sources && blueprint.data_sources.length > 0 ? (
                    <ul className="space-y-1">
                      {blueprint.data_sources.map((source: string, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {source}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No data sources recorded</p>
                  )}
                  {blueprint?.ai_confidence_score && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-semibold">AI Confidence:</span>{' '}
                      {(blueprint.ai_confidence_score * 100).toFixed(0)}%
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Revision History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revisions && revisions.length > 0 ? (
                    <div className="space-y-4">
                      {revisions.map((revision: any) => (
                        <div key={revision.id} className="border-l-2 border-muted pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">v{revision.revision_number}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(revision.created_at).toLocaleString()}
                            </span>
                          </div>
                          {revision.changes_summary && (
                            <p className="text-sm">{revision.changes_summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No revision history</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-6">
          <div className="flex gap-2">
            {blueprint?.approval_status === 'pending_review' && (
              <>
                <Button onClick={handleApproveAll}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve All Channels
                </Button>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="destructive" onClick={handleReject}>
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
