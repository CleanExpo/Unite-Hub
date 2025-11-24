'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Network,
  Info,
  AlertTriangle
} from 'lucide-react';
import type { OpportunityWindow } from '@/lib/predictive';

interface Signal {
  id: string;
  signalType: string;
  signalValue: number;
  signalLabel: string | null;
  sourceNodeId: string | null;
  weight: number;
}

interface OpportunitySignalBreakdownProps {
  window: OpportunityWindow;
  signals: Signal[];
  onNodeClick?: (nodeId: string) => void;
}

export function OpportunitySignalBreakdown({
  window: opportunityWindow,
  signals,
  onNodeClick,
}: OpportunitySignalBreakdownProps) {
  // Group signals by type prefix
  const groupedSignals: Record<string, Signal[]> = {};
  for (const signal of signals) {
    const prefix = signal.signalType.split('_')[0];
    if (!groupedSignals[prefix]) {
      groupedSignals[prefix] = [];
    }
    groupedSignals[prefix].push(signal);
  }

  const signalTypeLabels: Record<string, string> = {
    mesh: 'Intelligence Mesh',
    scaling: 'Region Scaling',
    performance: 'Performance Reality',
    compliance: 'Compliance',
    client: 'Client Data',
    budget: 'Budget',
    contact: 'Contact History',
  };

  return (
    <div className="space-y-4">
      {/* Window Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {opportunityWindow.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {opportunityWindow.description}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Category</div>
              <Badge variant="outline" className="mt-1">
                {opportunityWindow.opportunityCategory}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Window</div>
              <div className="text-sm font-medium mt-1">
                {opportunityWindow.windowType.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="text-sm font-medium mt-1">
                {Math.round(opportunityWindow.confidence * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signal Groups */}
      {Object.entries(groupedSignals).map(([prefix, groupSignals]) => (
        <Card key={prefix}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4" />
              {signalTypeLabels[prefix] || prefix}
              <Badge variant="secondary" className="ml-auto">
                {groupSignals.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupSignals.map((signal) => (
                <div key={signal.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {signal.signalLabel || signal.signalType.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium">
                      {(signal.signalValue * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={signal.signalValue * 100} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Weight: {signal.weight.toFixed(1)}</span>
                    {signal.sourceNodeId && onNodeClick && (
                      <button
                        onClick={() => onNodeClick(signal.sourceNodeId!)}
                        className="text-primary hover:underline"
                      >
                        View Node
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {signals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            No detailed signals available
          </CardContent>
        </Card>
      )}

      {/* Uncertainty Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Uncertainty Notice</div>
              <p>{opportunityWindow.uncertaintyNotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Nodes */}
      {opportunityWindow.supportingNodes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Supporting Mesh Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {opportunityWindow.supportingNodes.map((nodeId, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={onNodeClick ? 'cursor-pointer hover:bg-accent' : ''}
                  onClick={() => onNodeClick?.(nodeId)}
                >
                  {nodeId.slice(0, 8)}...
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
