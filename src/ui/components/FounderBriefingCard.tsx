'use client';

/**
 * Founder Briefing Card Component
 * Phase 51: Display daily briefing summary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, AlertTriangle, CheckCircle, TrendingUp, ChevronRight, Eye
} from 'lucide-react';

interface BriefingCardProps {
  briefing: {
    id: string;
    briefing_date: string;
    executive_summary: string;
    key_metrics: Record<string, any>;
    alerts: { type: string; message: string; severity: string }[];
    action_items: { title: string; priority: string }[];
    ai_insights: { insight: string; category: string }[];
    recommendations: { recommendation: string; priority: string }[];
    is_read: boolean;
  };
  onView?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

export function FounderBriefingCard({
  briefing,
  onView,
  onMarkRead,
  compact = false,
}: BriefingCardProps) {
  const urgentAlerts = briefing.alerts.filter((a) => a.severity === 'high').length;
  const pendingActions = briefing.action_items.length;

  if (compact) {
    return (
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!briefing.is_read ? 'border-primary' : ''}`}>
        <CardContent className="p-4" onClick={() => onView?.(briefing.id)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {new Date(briefing.briefing_date).toLocaleDateString()}
              </span>
            </div>
            {!briefing.is_read && (
              <Badge variant="default" className="text-xs">New</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {briefing.executive_summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {urgentAlerts > 0 && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {urgentAlerts}
              </span>
            )}
            {pendingActions > 0 && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {pendingActions}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={!briefing.is_read ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Daily Briefing</CardTitle>
            {!briefing.is_read && (
              <Badge variant="default">New</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(briefing.briefing_date).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Executive Summary */}
        <div>
          <p className="text-sm">{briefing.executive_summary}</p>
        </div>

        {/* Key Metrics */}
        {briefing.key_metrics && Object.keys(briefing.key_metrics).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(briefing.key_metrics).slice(0, 4).map(([key, value]) => (
              <div key={key} className="bg-muted p-2 rounded">
                <div className="text-xs text-muted-foreground capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="font-semibold">{String(value)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {briefing.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alerts
            </h4>
            {briefing.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded ${
                  alert.severity === 'high'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    : alert.severity === 'medium'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Action Items */}
        {briefing.action_items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Action Items
            </h4>
            {briefing.action_items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge
                  variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {item.priority}
                </Badge>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights */}
        {briefing.ai_insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Insights
            </h4>
            {briefing.ai_insights.slice(0, 2).map((insight, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                {insight.insight}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(briefing.id)}>
              <Eye className="mr-1 h-3 w-3" />
              View Full
            </Button>
          )}
          {!briefing.is_read && onMarkRead && (
            <Button variant="ghost" size="sm" onClick={() => onMarkRead(briefing.id)}>
              Mark Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FounderBriefingCard;
