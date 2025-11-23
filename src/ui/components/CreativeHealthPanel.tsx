'use client';

/**
 * Creative Health Panel
 * Phase 70: Widget showing overall creative performance health
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
} from 'lucide-react';

interface CreativeHealthPanelProps {
  score: number;
  label: string;
  factors: {
    name: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  topChannel?: string;
  bestCampaign?: string;
  className?: string;
}

export function CreativeHealthPanel({
  score,
  label,
  factors,
  topChannel,
  bestCampaign,
  className = '',
}: CreativeHealthPanelProps) {
  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Heart className={`h-4 w-4 ${getHealthColor(score)}`} />
          <CardTitle className="text-sm">Creative Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getHealthColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>

        {/* Progress ring visualization */}
        <Progress value={score} className={`h-2 ${getHealthBg(score)}`} />

        {/* Factor breakdown */}
        <div className="space-y-2">
          {factors.map((factor) => (
            <div
              key={factor.name}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{factor.name}</span>
              <div className="flex items-center gap-1">
                <span className={getHealthColor(factor.score)}>
                  {factor.score}
                </span>
                {getTrendIcon(factor.trend)}
              </div>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        {(topChannel || bestCampaign) && (
          <div className="pt-2 border-t space-y-1">
            {topChannel && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Top Channel</span>
                <span className="font-medium capitalize">{topChannel}</span>
              </div>
            )}
            {bestCampaign && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Best Campaign</span>
                <span className="font-medium truncate max-w-[100px]">
                  {bestCampaign}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CreativeHealthPanel;
