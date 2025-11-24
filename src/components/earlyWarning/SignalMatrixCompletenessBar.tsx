'use client';

/**
 * Signal Matrix Completeness Bar
 * Phase 82: Shows data completeness and confidence
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface SignalMatrixCompletenessBarProps {
  completeness: number;
  confidence: number;
  anomalyScore: number;
  trendShiftScore: number;
  fatigueScore: number;
  className?: string;
}

export function SignalMatrixCompletenessBar({
  completeness,
  confidence,
  anomalyScore,
  trendShiftScore,
  fatigueScore,
  className = '',
}: SignalMatrixCompletenessBarProps) {
  const completenessLabel = getLabel(completeness);
  const completenessColor = getColor(completeness);

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Completeness */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              Completeness
            </div>
            <div className="flex items-center gap-2">
              <Progress value={completeness * 100} className="h-1.5 flex-1" />
              <Badge variant="outline" className={`text-[10px] ${completenessColor}`}>
                {Math.round(completeness * 100)}%
              </Badge>
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Confidence
            </div>
            <div className="flex items-center gap-2">
              <Progress value={confidence * 100} className="h-1.5 flex-1" />
              <Badge variant="outline" className={`text-[10px] ${getColor(confidence)}`}>
                {Math.round(confidence * 100)}%
              </Badge>
            </div>
          </div>

          {/* Anomaly */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Anomaly
            </div>
            <div className="flex items-center gap-2">
              <Progress value={anomalyScore * 100} className="h-1.5 flex-1" />
              <Badge variant="outline" className={`text-[10px] ${getInverseColor(anomalyScore)}`}>
                {Math.round(anomalyScore * 100)}%
              </Badge>
            </div>
          </div>

          {/* Trend Shift */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Trend Shift
            </div>
            <div className="flex items-center gap-2">
              <Progress value={trendShiftScore * 100} className="h-1.5 flex-1" />
              <Badge variant="outline" className={`text-[10px] ${getInverseColor(trendShiftScore)}`}>
                {Math.round(trendShiftScore * 100)}%
              </Badge>
            </div>
          </div>

          {/* Fatigue */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Fatigue
            </div>
            <div className="flex items-center gap-2">
              <Progress value={fatigueScore * 100} className="h-1.5 flex-1" />
              <Badge variant="outline" className={`text-[10px] ${getInverseColor(fatigueScore)}`}>
                {Math.round(fatigueScore * 100)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getLabel(value: number): string {
  if (value >= 0.85) return 'Excellent';
  if (value >= 0.7) return 'Good';
  if (value >= 0.5) return 'Moderate';
  if (value >= 0.3) return 'Limited';
  return 'Minimal';
}

function getColor(value: number): string {
  if (value >= 0.7) return 'text-green-500';
  if (value >= 0.5) return 'text-yellow-500';
  return 'text-red-500';
}

function getInverseColor(value: number): string {
  // Lower is better for anomaly, trend shift, fatigue
  if (value <= 0.3) return 'text-green-500';
  if (value <= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}
