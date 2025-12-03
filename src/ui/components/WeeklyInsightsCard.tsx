'use client';

/**
 * Weekly Insights Card Component
 * Phase 48: Displays generated insights and recommendations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
  Check,
} from 'lucide-react';

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  status: 'unread' | 'read' | 'dismissed' | 'acted_on';
  created_at: string;
}

interface WeeklyInsightsCardProps {
  insights: Insight[];
  onMarkRead?: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
  showAll?: boolean;
}

export function WeeklyInsightsCard({
  insights,
  onMarkRead,
  onDismiss,
  showAll = false,
}: WeeklyInsightsCardProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'milestone':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'trend_alert':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'tip':
        return <Info className="h-4 w-4 text-purple-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'normal':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-gray-300 bg-bg-raised';
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 3);
  const unreadCount = insights.filter(i => i.status === 'unread').length;

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No insights yet this week.</p>
            <p className="text-sm mt-1">Keep using the platform to generate insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weekly Insights</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} new</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border-l-4 ${getPriorityColor(
                insight.priority
              )} ${insight.status === 'unread' ? 'font-medium' : 'opacity-75'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-0.5">{getInsightIcon(insight.insight_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {insight.status === 'unread' && (
                  <div className="flex gap-1">
                    {onMarkRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => onMarkRead(insight.id)}
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {onDismiss && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => onDismiss(insight.id)}
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!showAll && insights.length > 3 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            +{insights.length - 3} more insights
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default WeeklyInsightsCard;
