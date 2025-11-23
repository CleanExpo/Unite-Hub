'use client';

/**
 * Story Summary Card
 * Phase 74: Display story overview with health indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ClientStoryNarrative } from '@/lib/storytelling/storytellingNarrativeBuilder';

interface StorySummaryCardProps {
  narrative: ClientStoryNarrative;
  dataCompleteness: number;
  onView?: () => void;
  className?: string;
}

export function StorySummaryCard({
  narrative,
  dataCompleteness,
  onView,
  className = '',
}: StorySummaryCardProps) {
  const getHealthConfig = () => {
    if (dataCompleteness >= 75) {
      return {
        status: 'complete',
        label: 'Complete',
        color: 'text-green-500 bg-green-500/10',
        icon: CheckCircle2,
      };
    } else if (dataCompleteness >= 40) {
      return {
        status: 'partial',
        label: 'Partial',
        color: 'text-yellow-500 bg-yellow-500/10',
        icon: AlertCircle,
      };
    } else {
      return {
        status: 'limited',
        label: 'Limited',
        color: 'text-orange-500 bg-orange-500/10',
        icon: AlertCircle,
      };
    }
  };

  const health = getHealthConfig();
  const HealthIcon = health.icon;

  const winsCount = narrative.key_wins.filter(
    w => w !== 'Journey is progressing - wins will be highlighted as milestones are achieved'
  ).length;

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{narrative.title}</CardTitle>
          </div>
          <Badge className={health.color} variant="outline">
            <HealthIcon className="h-3 w-3 mr-1" />
            {health.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{narrative.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{narrative.kpi_highlights.length}</div>
            <div className="text-muted-foreground">Metrics</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{winsCount}</div>
            <div className="text-muted-foreground">Wins</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{narrative.next_steps.length}</div>
            <div className="text-muted-foreground">Steps</div>
          </div>
        </div>

        {/* Summary preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {narrative.executive_summary}
        </p>

        {/* Action */}
        {onView && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onView}
          >
            View Full Story
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact story indicator for inline use
 */
export function StoryIndicator({
  title,
  timeRange,
  onClick,
}: {
  title: string;
  timeRange: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        onClick ? 'cursor-pointer hover:text-primary' : ''
      }`}
      onClick={onClick}
    >
      <BookOpen className="h-3 w-3" />
      <span>{title}</span>
      <span className="text-muted-foreground">• {timeRange}</span>
      {onClick && <ArrowRight className="h-3 w-3" />}
    </div>
  );
}

export default StorySummaryCard;
