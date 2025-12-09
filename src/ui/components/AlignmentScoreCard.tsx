'use client';

/**
 * Alignment Score Card
 * Phase 73: 5-dimension alignment summary visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Compass,
  Briefcase,
  Star,
  Users,
  Info,
} from 'lucide-react';
import {
  AlignmentReport,
  DimensionScore,
  AlignmentDimension,
  getDimensionDisplayName,
  getDimensionDescription,
} from '@/lib/alignment/alignmentEngine';

interface AlignmentScoreCardProps {
  report: AlignmentReport;
  showDetails?: boolean;
  className?: string;
}

export function AlignmentScoreCard({
  report,
  showDetails = true,
  className = '',
}: AlignmentScoreCardProps) {
  const { overall_score, overall_status, dimensions, data_completeness } = report;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aligned':
      case 'strong':
        return 'text-green-500 bg-green-500/10';
      case 'mostly_aligned':
      case 'healthy':
        return 'text-blue-500 bg-blue-500/10';
      case 'needs_attention':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'misaligned':
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getDimensionIcon = (dimension: AlignmentDimension) => {
    switch (dimension) {
      case 'momentum':
        return Activity;
      case 'clarity':
        return Compass;
      case 'workload':
        return Briefcase;
      case 'quality':
        return Star;
      case 'engagement':
        return Users;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aligned':
        return 'Aligned';
      case 'mostly_aligned':
        return 'Mostly Aligned';
      case 'needs_attention':
        return 'Needs Attention';
      case 'misaligned':
        return 'Misaligned';
      default:
        return status;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Alignment Score</CardTitle>
          <Badge className={getStatusColor(overall_status)}>
            {getStatusLabel(overall_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall score */}
        <div className="text-center">
          <div className="text-4xl font-bold">{overall_score}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Overall Alignment
          </div>
        </div>

        {/* Data completeness notice */}
        {data_completeness < 50 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <Info className="h-3 w-3" />
            Limited data ({data_completeness}%). Score will improve as data accumulates.
          </div>
        )}

        {/* Dimension breakdown */}
        {showDetails && (
          <div className="space-y-3">
            {dimensions.map((dim) => (
              <DimensionRow key={dim.dimension} dimension={dim} />
            ))}
          </div>
        )}

        {/* Weight transparency */}
        {showDetails && (
          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            Weights: Momentum 25%, Clarity 20%, Workload 15%, Quality 20%, Engagement 20%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DimensionRow({ dimension }: { dimension: DimensionScore }) {
  const Icon = getDimensionIcon(dimension.dimension);
  const name = getDimensionDisplayName(dimension.dimension);

  const getScoreColor = (score: number) => {
    if (score >= 70) {
return 'bg-green-500';
}
    if (score >= 50) {
return 'bg-blue-500';
}
    if (score >= 30) {
return 'bg-yellow-500';
}
    return 'bg-red-500';
  };

  const isInsufficient = dimension.data_availability === 'insufficient';

  return (
    <div className={`space-y-1 ${isInsufficient ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isInsufficient ? (
            <span className="text-muted-foreground">No data</span>
          ) : (
            <>
              <span className={dimension.status === 'critical' || dimension.status === 'needs_attention' ? 'text-red-500' : ''}>
                {dimension.score}%
              </span>
              <span className="text-muted-foreground text-[10px]">
                ({(dimension.weight * 100).toFixed(0)}%)
              </span>
            </>
          )}
        </div>
      </div>
      {!isInsufficient && (
        <Progress
          value={dimension.score}
          className={`h-1.5 ${getScoreColor(dimension.score)}`}
        />
      )}
    </div>
  );
}

/**
 * Compact alignment indicator for list views
 */
export function AlignmentIndicator({
  score,
  status,
  onClick,
}: {
  score: number;
  status: string;
  onClick?: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aligned':
        return 'bg-green-500';
      case 'mostly_aligned':
        return 'bg-blue-500';
      case 'needs_attention':
        return 'bg-yellow-500';
      case 'misaligned':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}

export default AlignmentScoreCard;

function getDimensionIcon(dimension: AlignmentDimension) {
  switch (dimension) {
    case 'momentum':
      return Activity;
    case 'clarity':
      return Compass;
    case 'workload':
      return Briefcase;
    case 'quality':
      return Star;
    case 'engagement':
      return Users;
  }
}
