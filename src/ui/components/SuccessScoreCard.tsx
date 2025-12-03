'use client';

/**
 * Success Score Card Component
 * Phase 48: Displays client success score with breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Heart, Flame } from 'lucide-react';

interface SuccessScoreCardProps {
  overallScore: number;
  engagementScore: number;
  activationScore: number;
  progressScore: number;
  satisfactionScore: number;
  momentumScore: number;
  trend: 'rising' | 'stable' | 'declining';
  scoreChange: number;
  calculatedAt?: string;
}

export function SuccessScoreCard({
  overallScore,
  engagementScore,
  activationScore,
  progressScore,
  satisfactionScore,
  momentumScore,
  trend,
  scoreChange,
  calculatedAt,
}: SuccessScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendBadge = () => {
    if (scoreChange > 0) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500">
          +{scoreChange}
        </Badge>
      );
    }
    if (scoreChange < 0) {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500">
          {scoreChange}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-500">
        ±0
      </Badge>
    );
  };

  const scoreComponents = [
    { label: 'Engagement', score: engagementScore, icon: Zap },
    { label: 'Activation', score: activationScore, icon: Target },
    { label: 'Progress', score: progressScore, icon: Trophy },
    { label: 'Satisfaction', score: satisfactionScore, icon: Heart },
    { label: 'Momentum', score: momentumScore, icon: Flame },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Success Score</CardTitle>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            {getTrendBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div
              className={`text-6xl font-bold ${getScoreColor(overallScore)}`}
            >
              {overallScore}
            </div>
            <div className="text-sm text-muted-foreground text-center mt-1">
              out of 100
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          {scoreComponents.map((component) => (
            <div key={component.label} className="flex items-center gap-3">
              <component.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{component.label}</span>
                  <span className={getScoreColor(component.score)}>
                    {component.score}
                  </span>
                </div>
                <div className="w-full bg-bg-hover rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${getScoreBg(
                      component.score
                    )}`}
                    style={{ width: `${component.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Last calculated */}
        {calculatedAt && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Last calculated {new Date(calculatedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default SuccessScoreCard;
