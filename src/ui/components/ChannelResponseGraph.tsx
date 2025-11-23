'use client';

/**
 * Channel Response Graph
 * Phase 70: Visualize channel performance with trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import { ChannelPerformanceSnapshot } from '@/lib/visual/reactive/creativePerformanceSignals';

interface ChannelResponseGraphProps {
  snapshots: ChannelPerformanceSnapshot[];
  className?: string;
}

export function ChannelResponseGraph({
  snapshots,
  className = '',
}: ChannelResponseGraphProps) {
  if (snapshots.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-muted-foreground">
          No channel data available
        </CardContent>
      </Card>
    );
  }

  const maxImpressions = Math.max(...snapshots.map(s => s.impressions));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Channel Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshots.map((snapshot) => (
          <ChannelBar
            key={snapshot.channel}
            snapshot={snapshot}
            maxImpressions={maxImpressions}
          />
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            Impressions
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Improving
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            Declining
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelBar({
  snapshot,
  maxImpressions,
}: {
  snapshot: ChannelPerformanceSnapshot;
  maxImpressions: number;
}) {
  const barWidth = maxImpressions > 0
    ? (snapshot.impressions / maxImpressions) * 100
    : 0;

  const engRate = snapshot.engagement_rate;
  const engColor = engRate === null
    ? 'text-muted-foreground'
    : engRate >= 0.03
    ? 'text-green-500'
    : engRate >= 0.01
    ? 'text-yellow-500'
    : 'text-red-500';

  const TrendIcon = snapshot.trend === 'improving'
    ? TrendingUp
    : snapshot.trend === 'declining'
    ? TrendingDown
    : Minus;

  const trendColor = snapshot.trend === 'improving'
    ? 'text-green-500'
    : snapshot.trend === 'declining'
    ? 'text-red-500'
    : 'text-muted-foreground';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize w-20 truncate">
            {snapshot.channel}
          </span>
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {snapshot.impressions.toLocaleString()}
          </span>
          <span className={`font-medium ${engColor}`}>
            {engRate !== null
              ? `${(engRate * 100).toFixed(1)}%`
              : '-'}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

export default ChannelResponseGraph;
