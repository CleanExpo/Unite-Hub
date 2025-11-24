'use client';

/**
 * Performance Reality Snapshot List
 * Phase 81: List of recent snapshots
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PerformanceRealitySnapshot } from '@/lib/performanceReality';

interface PerformanceRealitySnapshotListProps {
  snapshots: PerformanceRealitySnapshot[];
  className?: string;
}

export function PerformanceRealitySnapshotList({
  snapshots,
  className = '',
}: PerformanceRealitySnapshotListProps) {
  const router = useRouter();

  if (snapshots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No snapshots yet. Generate one to see performance reality analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Snapshots
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {snapshots.map((snapshot) => {
          const delta = snapshot.true_score - snapshot.perceived_score;
          const DeltaIcon = delta > 0.5 ? TrendingUp : delta < -0.5 ? TrendingDown : Minus;
          const deltaColor = delta > 0.5
            ? 'text-green-500'
            : delta < -0.5
            ? 'text-red-500'
            : 'text-muted-foreground';

          return (
            <Button
              key={snapshot.id}
              variant="ghost"
              className="w-full justify-between h-auto py-2 px-3"
              onClick={() => router.push(`/founder/performance-reality/${snapshot.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {snapshot.scope}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(snapshot.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">
                      {Math.round(snapshot.perceived_score)} → {Math.round(snapshot.true_score)}
                    </span>
                    <DeltaIcon className={`h-3 w-3 ${deltaColor}`} />
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
