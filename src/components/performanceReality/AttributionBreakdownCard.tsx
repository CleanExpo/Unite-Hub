'use client';

/**
 * Attribution Breakdown Card
 * Phase 81: Shows factor contributions to performance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { AttributionBreakdown, AttributionFactor } from '@/lib/performanceReality';

interface AttributionBreakdownCardProps {
  breakdown: AttributionBreakdown;
  className?: string;
}

export function AttributionBreakdownCard({
  breakdown,
  className = '',
}: AttributionBreakdownCardProps) {
  // Sort by absolute impact
  const sortedFactors = [...breakdown.factors].sort(
    (a, b) => Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight)
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Attribution Breakdown</CardTitle>
          <Badge variant="outline" className="text-xs">
            Primary: {breakdown.primary_driver.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedFactors.map((factor) => (
          <FactorRow key={factor.name} factor={factor} />
        ))}
      </CardContent>
    </Card>
  );
}

function FactorRow({ factor }: { factor: AttributionFactor }) {
  const impact = factor.contribution * factor.weight * 100;
  const absImpact = Math.abs(impact);

  const DirectionIcon = factor.direction === 'positive'
    ? TrendingUp
    : factor.direction === 'negative'
    ? TrendingDown
    : Minus;

  const directionColor = factor.direction === 'positive'
    ? 'text-green-500'
    : factor.direction === 'negative'
    ? 'text-red-500'
    : 'text-muted-foreground';

  const confidenceColor = factor.confidence >= 0.7
    ? 'text-green-500'
    : factor.confidence >= 0.4
    ? 'text-yellow-500'
    : 'text-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionIcon className={`h-3 w-3 ${directionColor}`} />
          <span className="text-sm capitalize">
            {factor.name.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${directionColor}`}>
            {impact >= 0 ? '+' : ''}{impact.toFixed(1)}%
          </span>
          <span className={`text-[10px] ${confidenceColor}`}>
            ({Math.round(factor.confidence * 100)}%)
          </span>
        </div>
      </div>
      <Progress
        value={Math.min(absImpact * 5, 100)}
        className="h-1"
      />
      {factor.description && (
        <p className="text-[10px] text-muted-foreground">
          {factor.description}
        </p>
      )}
    </div>
  );
}
