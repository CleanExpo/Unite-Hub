'use client';

/**
 * Scaling Health Scores Panel
 * Phase 86: Show health scores for infra, AI cost, warnings, churn
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  DollarSign,
  AlertTriangle,
  UserMinus,
  Heart,
} from 'lucide-react';

interface ScalingHealthScoresPanelProps {
  infraHealth: number;
  aiCostPressure: number;
  warningDensity: number;
  churnRisk: number;
  overallHealth: number;
  className?: string;
}

export function ScalingHealthScoresPanel({
  infraHealth,
  aiCostPressure,
  warningDensity,
  churnRisk,
  overallHealth,
  className = '',
}: ScalingHealthScoresPanelProps) {
  const getScoreColor = (score: number, inverted: boolean = false) => {
    const effectiveScore = inverted ? 100 - score : score;
    if (effectiveScore >= 80) return 'text-green-500';
    if (effectiveScore >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number, inverted: boolean = false) => {
    const effectiveScore = inverted ? 100 - score : score;
    if (effectiveScore >= 80) return 'bg-green-500';
    if (effectiveScore >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scores = [
    {
      label: 'Infrastructure Health',
      value: infraHealth,
      icon: Activity,
      inverted: false,
      description: 'CPU, latency, errors',
    },
    {
      label: 'AI Cost Pressure',
      value: aiCostPressure,
      icon: DollarSign,
      inverted: true,
      description: 'Lower is better',
    },
    {
      label: 'Warning Density',
      value: warningDensity,
      icon: AlertTriangle,
      inverted: true,
      description: 'Active warnings per client',
    },
    {
      label: 'Churn Risk',
      value: churnRisk,
      icon: UserMinus,
      inverted: true,
      description: 'At-risk clients',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Health Scores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Scaling Health</span>
            <span className={`text-lg font-bold ${getScoreColor(overallHealth)}`}>
              {overallHealth.toFixed(0)}
            </span>
          </div>
          <Progress value={overallHealth} className="h-2" />
        </div>

        {/* Individual scores */}
        <div className="space-y-3">
          {scores.map(score => (
            <div key={score.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <score.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{score.label}</span>
                </div>
                <span className={`text-sm font-medium ${getScoreColor(score.value, score.inverted)}`}>
                  {score.value.toFixed(0)}
                </span>
              </div>
              <Progress
                value={score.value}
                className={`h-1 ${score.inverted && score.value > 50 ? '[&>div]:bg-red-500' : ''}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
