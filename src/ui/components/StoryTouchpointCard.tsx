'use client';

/**
 * Story Touchpoint Card
 * Phase 75: Display touchpoint summary with actions
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import {
  StoryTouchpoint,
  getTouchpointSummary,
  getTouchpointFreshness,
} from '@/lib/storytelling/storyTouchpointEngine';
import { exportToEmail } from '@/lib/storytelling/storyExportFormats';
import { ClientStoryNarrative } from '@/lib/storytelling/storytellingNarrativeBuilder';

interface StoryTouchpointCardProps {
  touchpoint: StoryTouchpoint;
  onView?: () => void;
  onRegenerate?: () => void;
  showActions?: boolean;
  className?: string;
}

export function StoryTouchpointCard({
  touchpoint,
  onView,
  onRegenerate,
  showActions = true,
  className = '',
}: StoryTouchpointCardProps) {
  const [copied, setCopied] = useState(false);

  const summary = getTouchpointSummary(touchpoint);
  const freshness = getTouchpointFreshness(touchpoint.generated_at, touchpoint.timeframe);

  const timeframeLabel = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    ninety_day: '90-Day',
  }[touchpoint.timeframe];

  const timeframeColor = {
    weekly: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    monthly: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    ninety_day: 'bg-green-500/10 text-green-500 border-green-500/30',
  }[touchpoint.timeframe];

  const statusConfig = {
    complete: {
      icon: CheckCircle2,
      color: 'text-green-500',
      label: 'Complete',
    },
    partial: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      label: 'Partial',
    },
    limited: {
      icon: AlertCircle,
      color: 'text-orange-500',
      label: 'Limited',
    },
  }[touchpoint.data_status];

  const freshnessConfig = {
    fresh: { color: 'text-green-500', label: 'Fresh' },
    stale: { color: 'text-yellow-500', label: 'Stale' },
    expired: { color: 'text-red-500', label: 'Expired' },
  }[freshness];

  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = async () => {
    try {
      const exported = exportToEmail(touchpoint.narrative as ClientStoryNarrative);
      await navigator.clipboard.writeText(exported.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={timeframeColor}>
              {timeframeLabel}
            </Badge>
            <Badge variant="outline" className={`${statusConfig.color} border-current/30`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <span className={`text-[10px] ${freshnessConfig.color}`}>
            {freshnessConfig.label}
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {touchpoint.excerpt}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {summary.metrics_count} metrics
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {summary.wins_count} wins
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(touchpoint.generated_at)}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={onView}
              >
                View Full Story
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onRegenerate}
              >
                <Clock className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact touchpoint indicator
 */
export function TouchpointIndicator({
  timeframe,
  status,
  generatedAt,
  onClick,
}: {
  timeframe: string;
  status: 'complete' | 'partial' | 'limited';
  generatedAt: string;
  onClick?: () => void;
}) {
  const statusColor = {
    complete: 'bg-green-500',
    partial: 'bg-yellow-500',
    limited: 'bg-orange-500',
  }[status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      className={`flex items-center gap-2 text-xs ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="font-medium">{timeframe}</span>
      <span className="text-muted-foreground">{formatDate(generatedAt)}</span>
    </div>
  );
}

export default StoryTouchpointCard;
