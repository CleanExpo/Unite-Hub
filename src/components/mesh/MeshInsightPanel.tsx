'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  Zap,
  Globe,
  Info
} from 'lucide-react';
import type { MeshInsight } from '@/lib/intelligenceMesh';

interface MeshInsightPanelProps {
  insights: MeshInsight[];
  summary?: string;
}

const typeIcons = {
  risk: AlertTriangle,
  opportunity: Zap,
  pattern: Globe,
  momentum: TrendingUp,
};

const severityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function MeshInsightPanel({ insights, summary }: MeshInsightPanelProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Insights</h3>
          <p className="text-muted-foreground">
            No significant patterns or risks detected at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <Card>
          <CardContent className="pt-4">
            <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
          </CardContent>
        </Card>
      )}

      {insights.map((insight, index) => {
        const Icon = typeIcons[insight.type] || Info;

        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {insight.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={severityColors[insight.severity]}>
                    {insight.severity}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {insight.description}
              </p>
              {insight.affectedNodes.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Affected nodes: {insight.affectedNodes.length}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
