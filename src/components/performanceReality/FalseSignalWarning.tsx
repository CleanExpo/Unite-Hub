'use client';

/**
 * False Signal Warning
 * Phase 81: Displays false positive/negative risk warnings
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface FalseSignalWarningProps {
  falsePositiveRisk: number;
  falseNegativeRisk: number;
  perceivedScore: number;
  trueScore: number;
  className?: string;
}

export function FalseSignalWarning({
  falsePositiveRisk,
  falseNegativeRisk,
  perceivedScore,
  trueScore,
  className = '',
}: FalseSignalWarningProps) {
  const hasPositiveRisk = falsePositiveRisk > 0.2;
  const hasNegativeRisk = falseNegativeRisk > 0.2;

  if (!hasPositiveRisk && !hasNegativeRisk) {
    return null;
  }

  return (
    <Card className={`border-yellow-500/30 bg-yellow-500/5 ${className}`}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Signal Risk Assessment</span>
        </div>

        {hasPositiveRisk && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-red-500" />
                <span className="text-xs">False Positive Risk</span>
              </div>
              <span className="text-xs font-medium text-red-500">
                {Math.round(falsePositiveRisk * 100)}%
              </span>
            </div>
            <Progress
              value={falsePositiveRisk * 100}
              className="h-1.5"
            />
            <p className="text-[10px] text-muted-foreground">
              Perceived score ({perceivedScore}) may be overstated compared to true performance ({trueScore})
            </p>
          </div>
        )}

        {hasNegativeRisk && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-3 w-3 text-orange-500" />
                <span className="text-xs">False Negative Risk</span>
              </div>
              <span className="text-xs font-medium text-orange-500">
                {Math.round(falseNegativeRisk * 100)}%
              </span>
            </div>
            <Progress
              value={falseNegativeRisk * 100}
              className="h-1.5"
            />
            <p className="text-[10px] text-muted-foreground">
              Perceived score ({perceivedScore}) may be understated compared to true performance ({trueScore})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
