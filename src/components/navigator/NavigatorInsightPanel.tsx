'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  AlertTriangle,
  Activity,
  Shield,
  Palette,
  Scale,
  Globe,
  Target,
  Info
} from 'lucide-react';
import type { NavigatorInsight } from '@/lib/navigator';

interface NavigatorInsightPanelProps {
  insights: NavigatorInsight[];
}

const categoryIcons = {
  opportunity: Lightbulb,
  warning: AlertTriangle,
  performance: Activity,
  compliance: Shield,
  creative: Palette,
  scaling: Scale,
  market: Globe,
  strategic: Target,
};

const bandColors = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
  exploratory: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function NavigatorInsightPanel({ insights }: NavigatorInsightPanelProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Insights</h3>
          <p className="text-muted-foreground">
            Generate a new snapshot to see insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const Icon = categoryIcons[insight.category] || Info;

        return (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {insight.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={bandColors[insight.confidenceBand]}>
                    {insight.confidenceBand}
                  </Badge>
                  <Badge variant="secondary">P{insight.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {insight.detail.description}
              </p>

              {/* Data Points */}
              {insight.detail.dataPoints && insight.detail.dataPoints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insight.detail.dataPoints.map((dp, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {dp.metric}: {dp.value}
                      {dp.trend && (
                        <span className={`ml-1 ${
                          dp.trend === 'up' ? 'text-green-600' :
                          dp.trend === 'down' ? 'text-red-600' : ''
                        }`}>
                          {dp.trend === 'up' ? '↑' : dp.trend === 'down' ? '↓' : ''}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested Actions */}
              {insight.detail.suggestedActions && insight.detail.suggestedActions.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Actions: </span>
                  {insight.detail.suggestedActions.join(' • ')}
                </div>
              )}

              {/* Uncertainty Notes */}
              {insight.uncertaintyNotes && (
                <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                  {insight.uncertaintyNotes}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
