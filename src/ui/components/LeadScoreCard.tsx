'use client';

/**
 * Lead Score Card
 * Phase 59: Display lead score and funnel stage
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
} from 'lucide-react';

type FunnelStage = 'visitor' | 'engaged' | 'lead' | 'trial' | 'early_activation' | 'activation_day_30' | 'activation_day_60' | 'activation_day_90';

interface LeadScore {
  score: number;
  stage: FunnelStage;
  signals: string[];
  last_activity: string;
  days_in_stage: number;
  conversion_likelihood: 'low' | 'medium' | 'high';
}

interface LeadScoreCardProps {
  email: string;
  name?: string;
  industry?: string;
  score: LeadScore;
  onViewDetails?: () => void;
}

export function LeadScoreCard({
  email,
  name,
  industry,
  score,
  onViewDetails,
}: LeadScoreCardProps) {
  const getStageLabel = (stage: FunnelStage) => {
    const labels: Record<FunnelStage, string> = {
      visitor: 'Visitor',
      engaged: 'Engaged',
      lead: 'Lead',
      trial: 'Trial',
      early_activation: 'Early Activation',
      activation_day_30: 'Day 30',
      activation_day_60: 'Day 60',
      activation_day_90: 'Day 90',
    };
    return labels[stage];
  };

  const getStageColor = (stage: FunnelStage) => {
    if (stage.includes('activation') || stage.includes('day')) return 'bg-green-500';
    if (stage === 'trial') return 'bg-blue-500';
    if (stage === 'lead') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getLikelihoodColor = (likelihood: 'low' | 'medium' | 'high') => {
    switch (likelihood) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {name || email.split('@')[0]}
              </CardTitle>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
          </div>
          <Badge className={getStageColor(score.stage)}>
            {getStageLabel(score.stage)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Score</span>
            <span className="font-medium">{score.score}/150</span>
          </div>
          <Progress value={(score.score / 150) * 100} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Target className={`h-3 w-3 ${getLikelihoodColor(score.conversion_likelihood)}`} />
            <span className="capitalize">{score.conversion_likelihood} likelihood</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{score.days_in_stage}d in stage</span>
          </div>
        </div>

        {/* Industry */}
        {industry && (
          <div className="text-xs text-muted-foreground">
            Industry: {industry}
          </div>
        )}

        {/* Signals */}
        {score.signals.length > 0 && (
          <div className="space-y-1">
            {score.signals.slice(0, 2).map((signal, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        )}

        {/* Last Activity */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last activity: {formatDate(score.last_activity)}
        </div>
      </CardContent>
    </Card>
  );
}

export default LeadScoreCard;
