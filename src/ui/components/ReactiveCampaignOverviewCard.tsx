'use client';

/**
 * Reactive Campaign Overview Card
 * Phase 70: Display campaign performance with reactive insights
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { CampaignFeedback, PerformanceLabel } from '@/lib/visual/reactive/creativeFeedbackMapper';

interface ReactiveCampaignOverviewCardProps {
  feedback: CampaignFeedback;
  campaignName: string;
  className?: string;
}

export function ReactiveCampaignOverviewCard({
  feedback,
  campaignName,
  className = '',
}: ReactiveCampaignOverviewCardProps) {
  const getLabelConfig = (label: PerformanceLabel) => {
    switch (label) {
      case 'high_performer':
        return { color: 'bg-green-500', icon: TrendingUp, text: 'High Performer' };
      case 'solid_performer':
        return { color: 'bg-blue-500', icon: CheckCircle2, text: 'Solid' };
      case 'average':
        return { color: 'bg-yellow-500', icon: Minus, text: 'Average' };
      case 'underperformer':
        return { color: 'bg-red-500', icon: TrendingDown, text: 'Needs Work' };
      case 'needs_experiment':
        return { color: 'bg-purple-500', icon: Lightbulb, text: 'Test Needed' };
      default:
        return { color: 'bg-gray-500', icon: AlertTriangle, text: 'No Data' };
    }
  };

  const config = getLabelConfig(feedback.overall_label);
  const Icon = config.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{campaignName}</CardTitle>
            <div className="text-xs text-muted-foreground">
              Reactive Performance Analysis
            </div>
          </div>
          <Badge className={`${config.color} gap-1`}>
            <Icon className="h-3 w-3" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Performance Score</span>
            <span className="font-bold">{feedback.overall_score}/100</span>
          </div>
          <Progress value={feedback.overall_score} className="h-2" />
        </div>

        {/* Channel breakdown */}
        {feedback.channel_breakdown.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Channel Performance
            </h4>
            <div className="space-y-1">
              {feedback.channel_breakdown.slice(0, 4).map((ch) => (
                <div
                  key={ch.channel}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="capitalize">{ch.channel}</span>
                  <div className="flex items-center gap-2">
                    <span className={getScoreColor(ch.score)}>{ch.score}</span>
                    <ActionBadge action={ch.action} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Method insights preview */}
        {feedback.method_insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Top Methods
            </h4>
            <div className="flex flex-wrap gap-1">
              {feedback.method_insights
                .filter(m => m.performance_tier === 'top' || m.performance_tier === 'strong')
                .slice(0, 3)
                .map((m) => (
                  <span
                    key={m.method_id}
                    className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded"
                  >
                    {m.method_id.replace(/_/g, ' ')}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Strategic recommendations */}
        {feedback.strategic_recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-medium flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              Recommendations
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {feedback.strategic_recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-500 font-medium';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function ActionBadge({ action }: { action: string }) {
  const config = {
    increase_investment: { color: 'bg-green-500/10 text-green-600', text: '↑' },
    maintain: { color: 'bg-blue-500/10 text-blue-600', text: '=' },
    reduce: { color: 'bg-orange-500/10 text-orange-600', text: '↓' },
    experiment: { color: 'bg-purple-500/10 text-purple-600', text: '?' },
    pause: { color: 'bg-red-500/10 text-red-600', text: '⏸' },
  };

  const { color, text } = config[action as keyof typeof config] || config.maintain;

  return (
    <span className={`text-[10px] px-1 py-0.5 rounded ${color}`}>
      {text}
    </span>
  );
}

export default ReactiveCampaignOverviewCard;
