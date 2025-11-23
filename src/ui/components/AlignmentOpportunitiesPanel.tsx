'use client';

/**
 * Alignment Opportunities Panel
 * Phase 73: Display realistic growth and efficiency opportunities
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { AlignmentOpportunity, getDimensionDisplayName } from '@/lib/alignment/alignmentEngine';

interface AlignmentOpportunitiesPanelProps {
  opportunities: AlignmentOpportunity[];
  className?: string;
}

export function AlignmentOpportunitiesPanel({
  opportunities,
  className = '',
}: AlignmentOpportunitiesPanelProps) {
  if (opportunities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Opportunities</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No opportunities identified yet. As your journey progresses and data accumulates, potential growth areas will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm">Opportunities</CardTitle>
          </div>
          <Badge variant="outline" className="text-green-500">
            {opportunities.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.opportunity_id} opportunity={opp} />
        ))}
      </CardContent>
    </Card>
  );
}

function OpportunityCard({ opportunity }: { opportunity: AlignmentOpportunity }) {
  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getEffortLabel = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'Low effort';
      case 'medium':
        return 'Medium effort';
      case 'high':
        return 'High effort';
      default:
        return effort;
    }
  };

  return (
    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-sm font-medium">{opportunity.title}</span>
        </div>
        <Badge className={`text-[10px] ${getPotentialColor(opportunity.potential)}`}>
          {opportunity.potential}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground pl-6">
        {opportunity.description}
      </p>

      <div className="flex items-center justify-between pl-6">
        <div className="flex flex-wrap gap-1">
          {opportunity.affected_dimensions.map((dim) => (
            <Badge key={dim} variant="outline" className="text-[9px]">
              {getDimensionDisplayName(dim)}
            </Badge>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {getEffortLabel(opportunity.effort)}
        </span>
      </div>

      <div className="flex items-center gap-2 pl-6 pt-1 border-t border-green-500/20">
        <Zap className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-600 dark:text-green-400">
          {opportunity.next_step}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact opportunity indicator
 */
export function OpportunityCount({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 text-xs text-green-500 ${
        onClick ? 'cursor-pointer hover:text-green-600' : ''
      }`}
      onClick={onClick}
    >
      <Sparkles className="h-3 w-3" />
      {count} {count === 1 ? 'opportunity' : 'opportunities'}
      {onClick && <ArrowRight className="h-3 w-3" />}
    </div>
  );
}

export default AlignmentOpportunitiesPanel;
