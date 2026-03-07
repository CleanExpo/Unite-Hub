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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ThumbsUp,
  ThumbsDown,
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
      toast({ title: 'Error', description: 'Failed to approve channel', variant: 'destructive' });
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

      toast({ title: 'Blueprint Approved', description: 'All channels have been approved' });
      if (onApprove) onApprove(blueprintId!);
    } catch (error) {
      console.error('Error approving blueprint:', error);
      toast({ title: 'Error', description: 'Failed to approve blueprint', variant: 'destructive' });
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

      toast({ title: 'Blueprint Rejected', description: 'The blueprint has been rejected' });
      if (onReject) onReject(blueprintId!, rejectReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting blueprint:', error);
      toast({ title: 'Error', description: 'Failed to reject blueprint', variant: 'destructive' });
    }
  };

  const getChannelApprovalBadge = (channel: string) => {
    const approval = blueprint?.channel_approvals?.[channel];
    if (approval === 'approved')
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#00FF88', backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.25)' }}>
          <CheckCircle className="h-3 w-3" />Approved
        </span>
      );
    if (approval === 'rejected')
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#FF4444', backgroundColor: 'rgba(255,68,68,0.10)', borderColor: 'rgba(255,68,68,0.25)' }}>
          <ThumbsDown className="h-3 w-3" />Rejected
        </span>
      );
    if (approval === 'pending')
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#FFB800', backgroundColor: 'rgba(255,184,0,0.10)', borderColor: 'rgba(255,184,0,0.25)' }}>
          <Clock className="h-3 w-3" />Pending
        </span>
      );
    return (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-white/[0.08] text-white/40 bg-white/[0.03]">
        Draft
      </span>
    );
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

  const approvalStatusBadge = () => {
    const s = blueprint?.approval_status;
    if (s === 'approved')
      return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border" style={{ color: '#00FF88', backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.25)' }}>{s.replace(/_/g, ' ')}</span>;
    if (s === 'rejected')
      return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border" style={{ color: '#FF4444', backgroundColor: 'rgba(255,68,68,0.10)', borderColor: 'rgba(255,68,68,0.25)' }}>{s.replace(/_/g, ' ')}</span>;
    return <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/40 bg-white/[0.03]">{s?.replace(/_/g, ' ')}</span>;
  };

  if (!blueprint && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/[0.08] rounded-sm text-white">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-mono text-white">{blueprint?.blueprint_title}</DialogTitle>
              <DialogDescription className="mt-1 font-mono text-white/40">
                {blueprint?.brand_slug.replace(/_/g, ' ')} •{' '}
                {blueprint?.blueprint_type.replace(/_/g, ' ')}
              </DialogDescription>
            </div>
            {approvalStatusBadge()}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center font-mono text-white/30">Loading blueprint...</div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-5 w-full bg-white/[0.03] border border-white/[0.06] rounded-sm p-1">
              {["overview","content","visuals","scoring","history"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="font-mono text-xs text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/[0.08] rounded-sm capitalize"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Scoring Summary */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-mono font-semibold text-white mb-4">
                  <BarChart3 className="h-5 w-5" style={{ color: '#00F5FF' }} />
                  Campaign Scores
                </h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Priority', value: blueprint?.priority_score?.toFixed(1) || 'N/A', color: '#00FF88' },
                    { label: 'Impact',   value: blueprint?.impact_score || 'N/A',                color: '#00F5FF' },
                    { label: 'Difficulty',value: blueprint?.difficulty_score || 'N/A',           color: '#FFB800' },
                    { label: 'Effort',   value: blueprint?.effort_score || 'N/A',                color: '#FF00FF' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-3xl font-bold font-mono" style={{ color }}>{value}</p>
                      <p className="text-sm font-mono text-white/30">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords & Objective */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                  <h4 className="flex items-center gap-2 text-sm font-mono font-semibold text-white mb-3">
                    <Target className="h-5 w-5" style={{ color: '#00F5FF' }} />
                    Primary Objective
                  </h4>
                  <p className="capitalize font-mono text-white/70">
                    {blueprint?.primary_objective?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                  <h4 className="flex items-center gap-2 text-sm font-mono font-semibold text-white mb-3">
                    <Zap className="h-5 w-5" style={{ color: '#FFB800' }} />
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {blueprint?.topic_keywords?.map((keyword: string) => (
                      <span key={keyword} className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/50 bg-white/[0.03]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Uncertainty Notes */}
              {blueprint?.uncertainty_notes && (
                <div className="rounded-sm border p-4"
                  style={{ backgroundColor: 'rgba(255,184,0,0.06)', borderColor: 'rgba(255,184,0,0.2)' }}>
                  <h4 className="flex items-center gap-2 text-sm font-mono font-semibold mb-2"
                    style={{ color: '#FFB800' }}>
                    <AlertCircle className="h-5 w-5" />
                    Review Required
                  </h4>
                  <p className="text-sm font-mono" style={{ color: '#FFB800', opacity: 0.8 }}>
                    {blueprint.uncertainty_notes}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {blueprint?.channels &&
                  Object.keys(blueprint.channels).map((channel) => (
                    <button
                      key={channel}
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex items-center justify-between p-2 text-xs font-mono rounded-sm border transition-all ${
                        selectedChannel === channel
                          ? 'border-[#00F5FF]/40 bg-[#00F5FF]/10 text-[#00F5FF]'
                          : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="truncate">{channel.replace(/_/g, ' ')}</span>
                      {getChannelApprovalBadge(channel)}
                    </button>
                  ))}
              </div>

              {selectedChannel && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-mono font-semibold text-white">
                        {selectedChannel.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-xs font-mono text-white/30">Draft content for review</p>
                    </div>
                    {blueprint?.channel_approvals?.[selectedChannel] !== 'approved' && (
                      <button
                        onClick={() => handleApproveChannel(selectedChannel)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-sm border transition-all"
                        style={{ color: '#00FF88', backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.25)' }}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Approve Channel
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const content = getChannelContent(selectedChannel);
                      if (!content) return <p className="font-mono text-white/30">No content generated</p>;

                      return (
                        <>
                          {content.headline && (
                            <div>
                              <p className="text-xs font-mono text-white/30 mb-1">Headline</p>
                              <p className="text-lg font-bold font-mono text-white">{content.headline}</p>
                            </div>
                          )}
                          {content.hook && (
                            <div>
                              <p className="text-xs font-mono text-white/30 mb-1">Hook</p>
                              <p className="font-mono text-white/70">{content.hook}</p>
                            </div>
                          )}
                          {content.draft_content && (
                            <div>
                              <p className="text-xs font-mono text-white/30 mb-1">Content</p>
                              <p className="whitespace-pre-wrap font-mono text-sm text-white/70">{content.draft_content}</p>
                            </div>
                          )}
                          {content.cta && (
                            <div>
                              <p className="text-xs font-mono text-white/30 mb-1">Call to Action</p>
                              <p className="font-semibold font-mono text-white">{content.cta}</p>
                            </div>
                          )}
                          {content.hashtags && content.hashtags.length > 0 && (
                            <div>
                              <p className="text-xs font-mono text-white/30 mb-1">Hashtags</p>
                              <div className="flex flex-wrap gap-1">
                                {content.hashtags.map((tag: string) => (
                                  <span key={tag} className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/40 bg-white/[0.03]">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {content.word_count && (
                            <div className="text-sm font-mono text-white/30">
                              Word count: {content.word_count}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Visuals Tab */}
            <TabsContent value="visuals" className="space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-mono font-semibold text-white mb-1">
                  <ImageIcon className="h-5 w-5" style={{ color: '#FF00FF' }} />
                  Visual Concepts
                </h4>
                <p className="text-xs font-mono text-white/30 mb-4">
                  AI-generated visual concepts (placeholders pending VIF generation)
                </p>
                {blueprint?.visual_concepts && blueprint.visual_concepts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {blueprint.visual_concepts.map((visual: any, index: number) => (
                      <div key={index} className="border border-white/[0.06] rounded-sm p-4 space-y-2 bg-white/[0.02]">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/40">
                          {visual.visual_type?.replace(/_/g, ' ')}
                        </span>
                        <p className="text-sm font-mono text-white/70">{visual.description}</p>
                        <p className="text-xs font-mono text-white/30">
                          Dimensions: {visual.dimensions}
                        </p>
                        {visual.vif_prompt_id && (
                          <p className="text-xs font-mono text-white/30">
                            VIF ID: {visual.vif_prompt_id}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-white/30">No visual concepts generated</p>
                )}
              </div>

              {blueprint?.seo_recommendations && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                  <h4 className="text-sm font-mono font-semibold text-white mb-3">SEO Recommendations</h4>
                  <div className="space-y-2 text-sm font-mono text-white/70">
                    <div>
                      <span className="text-white/40">Primary Keyword:</span>{' '}
                      {blueprint.seo_recommendations.primary_keyword}
                    </div>
                    {blueprint.seo_recommendations.secondary_keywords && (
                      <div>
                        <span className="text-white/40">Secondary Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {blueprint.seo_recommendations.secondary_keywords.map((kw: string) => (
                            <span key={kw} className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/40 bg-white/[0.03]">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {blueprint.seo_recommendations.search_volume && (
                      <div>
                        <span className="text-white/40">Search Volume:</span>{' '}
                        {blueprint.seo_recommendations.search_volume}/month
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <h4 className="text-sm font-mono font-semibold text-white mb-1">Scoring Breakdown</h4>
                <p className="text-xs font-mono text-white/30 mb-4">
                  Priority = (Impact × 10) / (Difficulty + Effort)
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Impact Score',     value: blueprint?.impact_score,     desc: 'Potential reach and business impact of this campaign' },
                    { label: 'Difficulty Score', value: blueprint?.difficulty_score, desc: 'Complexity based on keyword competition and content requirements' },
                    { label: 'Effort Score',     value: blueprint?.effort_score,     desc: 'Resources and time required for execution across all channels' },
                  ].map(({ label, value, desc }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold font-mono text-white">{label}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/50 bg-white/[0.03]">
                          {value}/10
                        </span>
                      </div>
                      <p className="text-sm font-mono text-white/30">{desc}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono text-white">Priority Score</span>
                      <span className="text-lg font-mono px-3 py-1 rounded-sm border"
                        style={{ color: '#00FF88', backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.25)' }}>
                        {blueprint?.priority_score?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <h4 className="text-sm font-mono font-semibold text-white mb-3">Data Sources</h4>
                {blueprint?.data_sources && blueprint.data_sources.length > 0 ? (
                  <ul className="space-y-1">
                    {blueprint.data_sources.map((source: string, index: number) => (
                      <li key={index} className="text-sm font-mono flex items-center gap-2 text-white/60">
                        <CheckCircle className="h-4 w-4" style={{ color: '#00FF88' }} />
                        {source}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-white/30">No data sources recorded</p>
                )}
                {blueprint?.ai_confidence_score && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] font-mono text-white/60">
                    <span className="font-semibold text-white">AI Confidence:</span>{' '}
                    {(blueprint.ai_confidence_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-mono font-semibold text-white mb-4">
                  <Calendar className="h-5 w-5" style={{ color: '#00F5FF' }} />
                  Revision History
                </h4>
                {revisions && revisions.length > 0 ? (
                  <div className="space-y-4">
                    {revisions.map((revision: any) => (
                      <div key={revision.id} className="border-l-2 pl-4" style={{ borderColor: 'rgba(0,245,255,0.2)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm border border-white/[0.08] text-white/50 bg-white/[0.03]">
                            v{revision.revision_number}
                          </span>
                          <span className="text-sm font-mono text-white/30">
                            {new Date(revision.created_at).toLocaleString()}
                          </span>
                        </div>
                        {revision.changes_summary && (
                          <p className="text-sm font-mono text-white/60">{revision.changes_summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-white/30">No revision history</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-6">
          <div className="flex gap-2">
            {blueprint?.approval_status === 'pending_review' && (
              <>
                <button
                  onClick={handleApproveAll}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono rounded-sm border transition-all"
                  style={{ color: '#00FF88', backgroundColor: 'rgba(0,255,136,0.10)', borderColor: 'rgba(0,255,136,0.25)' }}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve All Channels
                </button>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-64 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono text-sm"
                  />
                  <button
                    onClick={handleReject}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono rounded-sm border transition-all"
                    style={{ color: '#FF4444', backgroundColor: 'rgba(255,68,68,0.10)', borderColor: 'rgba(255,68,68,0.25)' }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-mono rounded-sm border border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.15] transition-all"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
