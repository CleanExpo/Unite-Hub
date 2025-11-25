'use client';

/**
 * Campaign Blueprint Card
 * Displays blueprint summary with brand, channels, scores, and approval status
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Eye, ThumbsUp, AlertCircle } from 'lucide-react';

interface BlueprintCardProps {
  blueprint: any;
  onView: (id: string) => void;
  onApprove?: (id: string) => void;
}

export function CampaignBlueprintCard({ blueprint, onView, onApprove }: BlueprintCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_review: { variant: 'default', label: 'Pending Review' },
      partially_approved: { variant: 'default', label: 'Partially Approved' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      archived: { variant: 'outline', label: 'Archived' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const channelCount = blueprint.channels ? Object.keys(blueprint.channels).length : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(blueprint.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{blueprint.blueprint_title}</CardTitle>
            <CardDescription className="mt-1">
              {blueprint.topic_title}
            </CardDescription>
          </div>
          {getStatusBadge(blueprint.approval_status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Brand and Type */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{blueprint.brand_slug.replace(/_/g, ' ')}</Badge>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground capitalize">
            {blueprint.blueprint_type.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className={`text-2xl font-bold ${getScoreColor(blueprint.priority_score || 0)}`}>
              {blueprint.priority_score?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Priority</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{blueprint.impact_score || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Impact</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{blueprint.difficulty_score || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Difficulty</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{blueprint.effort_score || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Effort</p>
          </div>
        </div>

        {/* Channels */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{channelCount} Channels</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {blueprint.channels &&
              Object.keys(blueprint.channels).slice(0, 5).map((channel) => (
                <Badge key={channel} variant="secondary" className="text-xs">
                  {channel.replace(/_/g, ' ')}
                </Badge>
              ))}
            {channelCount > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{channelCount - 5} more
              </Badge>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(blueprint.created_at).toLocaleDateString()}
            </span>
          </div>
          {blueprint.uncertainty_notes && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>Review Required</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onView(blueprint.id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          {blueprint.approval_status === 'pending_review' && onApprove && (
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(blueprint.id);
              }}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
