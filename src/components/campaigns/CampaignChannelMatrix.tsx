'use client';

/**
 * Campaign Channel Matrix
 * Matrix visualization of which channels are included in each blueprint
 * with hover-to-preview and click-to-view interactions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Blueprint {
  id: string;
  blueprint_title: string;
  brand_slug: string;
  channels: Record<string, any>;
  channel_approvals?: Record<string, 'approved' | 'pending' | 'rejected'>;
  approval_status: string;
  website_content?: any;
  blog_content?: any;
  social_content?: any;
  email_content?: any;
  video_content?: any;
}

interface ChannelMatrixProps {
  blueprints: Blueprint[];
  availableChannels: string[];
  onChannelClick: (blueprintId: string, channel: string) => void;
  onBlueprintClick?: (blueprintId: string) => void;
}

export function CampaignChannelMatrix({
  blueprints,
  availableChannels,
  onChannelClick,
  onBlueprintClick,
}: ChannelMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ blueprintId: string; channel: string } | null>(
    null
  );

  const channelCategories = {
    website: ['website_landing_page', 'website_product_page'],
    blog: ['blog_pillar_post', 'blog_cluster_post'],
    social: ['facebook_post', 'instagram_post', 'linkedin_post', 'tiktok_video'],
    email: ['email_newsletter', 'email_nurture_sequence'],
    video: ['youtube_short'],
  };

  const getChannelCategory = (channel: string): string => {
    for (const [category, channels] of Object.entries(channelCategories)) {
      if (channels.includes(channel)) return category;
    }
    return 'other';
  };

  const getChannelDisplayName = (channel: string): string => {
    return channel
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isChannelEnabled = (blueprint: Blueprint, channel: string): boolean => {
    return blueprint.channels && blueprint.channels[channel]?.enabled === true;
  };

  const getChannelApprovalStatus = (
    blueprint: Blueprint,
    channel: string
  ): 'approved' | 'pending' | 'rejected' | null => {
    if (!blueprint.channel_approvals) return null;
    return blueprint.channel_approvals[channel] || null;
  };

  const getChannelContent = (blueprint: Blueprint, channel: string): any => {
    if (channel.includes('website')) return blueprint.website_content;
    if (channel.includes('blog')) return blueprint.blog_content;
    if (channel.includes('email')) return blueprint.email_content;
    if (channel.includes('facebook') || channel.includes('instagram') || channel.includes('linkedin'))
      return blueprint.social_content?.[channel];
    if (channel.includes('tiktok') || channel.includes('youtube')) return blueprint.video_content?.[channel];
    return null;
  };

  const getCellIcon = (blueprint: Blueprint, channel: string) => {
    const isEnabled = isChannelEnabled(blueprint, channel);
    const approvalStatus = getChannelApprovalStatus(blueprint, channel);

    if (!isEnabled) {
      return <X className="h-4 w-4 text-muted-foreground" />;
    }

    if (approvalStatus === 'approved') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    if (approvalStatus === 'rejected') {
      return <X className="h-4 w-4 text-red-600" />;
    }

    if (approvalStatus === 'pending') {
      return <Clock className="h-4 w-4 text-orange-600" />;
    }

    return <Check className="h-4 w-4 text-blue-600" />;
  };

  const getCellTooltip = (blueprint: Blueprint, channel: string): string => {
    const isEnabled = isChannelEnabled(blueprint, channel);
    const approvalStatus = getChannelApprovalStatus(blueprint, channel);
    const content = getChannelContent(blueprint, channel);

    if (!isEnabled) return 'Channel not included';
    if (approvalStatus === 'approved') return 'Approved';
    if (approvalStatus === 'rejected') return 'Rejected';
    if (approvalStatus === 'pending') return 'Pending approval';
    if (content) return 'Draft content available - click to view';
    return 'Included in blueprint';
  };

  const groupedChannels = availableChannels.reduce((acc, channel) => {
    const category = getChannelCategory(channel);
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Matrix</CardTitle>
        <CardDescription>
          Overview of which channels are included in each blueprint. Click cells to view content.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold sticky left-0 bg-background z-10">
                  Blueprint
                </th>
                {Object.entries(groupedChannels).map(([category, channels]) => (
                  <th
                    key={category}
                    colSpan={channels.length}
                    className="text-center p-3 font-semibold border-l"
                  >
                    <Badge variant="outline" className="capitalize">
                      {category}
                    </Badge>
                  </th>
                ))}
              </tr>
              <tr className="border-b bg-muted/50">
                <th className="p-2 sticky left-0 bg-muted/50 z-10"></th>
                {Object.values(groupedChannels)
                  .flat()
                  .map((channel) => (
                    <th key={channel} className="p-2 text-xs text-center border-l min-w-[80px]">
                      <div className="transform -rotate-45 origin-left whitespace-nowrap text-left ml-2">
                        {getChannelDisplayName(channel)}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {blueprints.map((blueprint) => (
                <tr key={blueprint.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 sticky left-0 bg-background z-10 border-r">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-sm">{blueprint.blueprint_title}</div>
                        <div className="text-xs text-muted-foreground">
                          {blueprint.brand_slug.replace(/_/g, ' ')}
                        </div>
                      </div>
                      {onBlueprintClick && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onBlueprintClick(blueprint.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>

                  {Object.values(groupedChannels)
                    .flat()
                    .map((channel) => {
                      const isEnabled = isChannelEnabled(blueprint, channel);
                      const isHovered =
                        hoveredCell?.blueprintId === blueprint.id &&
                        hoveredCell?.channel === channel;

                      return (
                        <TooltipProvider key={channel}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td
                                className={`p-2 text-center border-l cursor-pointer transition-all ${
                                  isHovered ? 'bg-muted scale-110' : ''
                                } ${isEnabled ? 'hover:bg-muted' : 'opacity-50'}`}
                                onMouseEnter={() =>
                                  setHoveredCell({ blueprintId: blueprint.id, channel })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                                onClick={() => {
                                  if (isEnabled) {
                                    onChannelClick(blueprint.id, channel);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-center">
                                  {getCellIcon(blueprint, channel)}
                                </div>
                              </td>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{getCellTooltip(blueprint, channel)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span>Pending Approval</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-600" />
            <span>Draft Available</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-muted-foreground" />
            <span>Not Included</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
