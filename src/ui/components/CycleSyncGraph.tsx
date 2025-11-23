'use client';

/**
 * Cycle Sync Graph
 * Phase 71: Visualize cycle alignment and misalignment
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { CycleState, CycleAlignment, CreativeCycle } from '@/lib/operations/cycleCoordinator';

interface CycleSyncGraphProps {
  cycleStates: CycleState[];
  alignments: CycleAlignment[];
  className?: string;
}

export function CycleSyncGraph({
  cycleStates,
  alignments,
  className = '',
}: CycleSyncGraphProps) {
  const getAlignmentIcon = (status: CycleAlignment['status']) => {
    switch (status) {
      case 'aligned':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'minor_drift':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'major_drift':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      case 'critical_misalignment':
        return <XCircle className="h-3 w-3 text-red-500" />;
    }
  };

  const getAlignmentColor = (status: CycleAlignment['status']) => {
    switch (status) {
      case 'aligned':
        return 'border-green-500 bg-green-500/10';
      case 'minor_drift':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'major_drift':
        return 'border-orange-500 bg-orange-500/10';
      case 'critical_misalignment':
        return 'border-red-500 bg-red-500/10';
    }
  };

  const getCycleHealthColor = (health: number) => {
    if (health >= 70) return 'bg-green-500';
    if (health >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Group alignments by source cycle
  const alignmentsBySource = new Map<CreativeCycle, CycleAlignment[]>();
  for (const alignment of alignments) {
    if (!alignmentsBySource.has(alignment.cycle_a)) {
      alignmentsBySource.set(alignment.cycle_a, []);
    }
    alignmentsBySource.get(alignment.cycle_a)!.push(alignment);
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Cycle Synchronization</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cycle states */}
        <div className="grid grid-cols-7 gap-1">
          {cycleStates.map((state) => (
            <div
              key={state.cycle}
              className="text-center"
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full ${getCycleHealthColor(state.health)} flex items-center justify-center text-white text-xs font-bold`}
              >
                {state.health.toFixed(0)}
              </div>
              <div className="text-[9px] text-muted-foreground mt-1 truncate capitalize">
                {state.cycle}
              </div>
            </div>
          ))}
        </div>

        {/* Alignment connections */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Array.from(alignmentsBySource.entries()).map(([source, aligns]) => {
            const criticalAligns = aligns.filter(
              a => a.status === 'critical_misalignment' || a.status === 'major_drift'
            );
            if (criticalAligns.length === 0) return null;

            return (
              <div key={source} className="space-y-1">
                {criticalAligns.map((alignment) => (
                  <div
                    key={`${alignment.cycle_a}-${alignment.cycle_b}`}
                    className={`flex items-center gap-2 p-2 rounded border ${getAlignmentColor(alignment.status)}`}
                  >
                    {getAlignmentIcon(alignment.status)}
                    <div className="flex items-center gap-1 text-xs flex-1">
                      <span className="font-medium capitalize">{alignment.cycle_a}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{alignment.cycle_b}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {alignment.drift.toFixed(0)}% drift
                    </span>
                  </div>
                ))}
              </div>
            );
          })}

          {alignments.every(a => a.status === 'aligned') && (
            <div className="text-center py-4 text-sm text-green-500">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
              All cycles aligned
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t text-xs text-center">
          <div>
            <div className="font-bold text-green-500">
              {alignments.filter(a => a.status === 'aligned').length}
            </div>
            <div className="text-muted-foreground">Aligned</div>
          </div>
          <div>
            <div className="font-bold text-yellow-500">
              {alignments.filter(a => a.status === 'minor_drift').length}
            </div>
            <div className="text-muted-foreground">Minor</div>
          </div>
          <div>
            <div className="font-bold text-orange-500">
              {alignments.filter(a => a.status === 'major_drift').length}
            </div>
            <div className="text-muted-foreground">Major</div>
          </div>
          <div>
            <div className="font-bold text-red-500">
              {alignments.filter(a => a.status === 'critical_misalignment').length}
            </div>
            <div className="text-muted-foreground">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CycleSyncGraph;
