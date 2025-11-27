/**
 * Framework Insights Component
 *
 * Displays AI-generated insights about framework performance:
 * - Performance analysis and trends
 * - Pattern recognition
 * - Anomaly detection
 * - Trend forecasting
 * - Optimization opportunities
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Download,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface InsightMetrics {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
}

interface Insight {
  id: string;
  type: 'performance' | 'pattern' | 'anomaly' | 'trend' | 'opportunity';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metrics?: InsightMetrics;
  relatedData: any;
  generatedAt: string;
  aiConfidence: number;
}

interface FrameworkInsightsProps {
  frameworkId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock insights for development
const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'insight_1',
    type: 'performance',
    title: 'Performance Improved 23% This Month',
    description:
      'Your framework effectiveness score has increased significantly due to improved component quality and higher user adoption rates.',
    severity: 'info',
    metrics: {
      currentValue: 84,
      previousValue: 68,
      change: 16,
      changePercent: 23.5,
    },
    relatedData: { driver: 'Quality improvements', factor: 'component_refinement' },
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiConfidence: 95,
  },
  {
    id: 'insight_2',
    type: 'pattern',
    title: 'Usage Peaks on Tuesdays and Wednesdays',
    description:
      'Analysis shows consistent usage patterns with 45% higher activity on mid-week days. This correlates with team planning cycles.',
    severity: 'info',
    relatedData: {
      pattern: 'Weekly cycle',
      frequency: 'Every week',
      impact: 'Predictable adoption',
    },
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    aiConfidence: 88,
  },
  {
    id: 'insight_3',
    type: 'anomaly',
    title: 'Unusual Drop in Effectiveness Score',
    description:
      'Detected a 12% drop in effectiveness score on 2025-01-02. Root cause likely new users with learning curve.',
    severity: 'warning',
    metrics: {
      currentValue: 74,
      previousValue: 84,
      change: -10,
      changePercent: -11.9,
    },
    relatedData: {
      anomalyType: 'Performance drop',
      suspectedCause: 'New user onboarding',
      recoveryETA: '3-5 days',
    },
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiConfidence: 82,
  },
  {
    id: 'insight_4',
    type: 'trend',
    title: '30-Day Adoption Forecast: +18% Growth',
    description:
      'Based on current trajectory and user growth patterns, we forecast a 18% increase in adoption over the next 30 days.',
    severity: 'info',
    metrics: {
      currentValue: 12,
      previousValue: 10,
      change: 2,
      changePercent: 18.0,
    },
    relatedData: {
      forecast: 'Linear regression model',
      confidence: 'High',
      baselineGrowth: '12% monthly',
    },
    generatedAt: new Date().toISOString(),
    aiConfidence: 91,
  },
  {
    id: 'insight_5',
    type: 'opportunity',
    title: 'Opportunity: Untapped High-Value Components',
    description:
      '3 components show high potential but low current usage. Promoting these could increase framework value by 25%.',
    severity: 'info',
    relatedData: {
      components: ['Input Field 3', 'Rule Engine 2', 'Metric Aggregator'],
      potentialValue: 25,
      implementationTime: '2-3 days',
    },
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiConfidence: 87,
  },
];

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600';
    case 'warning':
      return 'text-yellow-600';
    case 'info':
    default:
      return 'text-blue-600';
  }
}

function getSeverityBgColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    case 'info':
    default:
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'performance':
      return <TrendingUp className="h-4 w-4" />;
    case 'pattern':
      return <Zap className="h-4 w-4" />;
    case 'anomaly':
      return <AlertTriangle className="h-4 w-4" />;
    case 'trend':
      return <TrendingUp className="h-4 w-4" />;
    case 'opportunity':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

function InsightCard({ insight }: { insight: Insight }) {
  const showMetrics = insight.metrics !== undefined;

  return (
    <Card className={`${getSeverityBgColor(insight.severity)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`mt-1 ${getSeverityColor(insight.severity)}`}>
              {getTypeIcon(insight.type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base mb-1">{insight.title}</CardTitle>
              <CardDescription className="text-sm">{insight.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs">
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
            </Badge>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(insight.generatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showMetrics && insight.metrics && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Current</div>
              <div className="text-lg font-bold">{insight.metrics.currentValue}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Previous</div>
              <div className="text-lg font-bold">{insight.metrics.previousValue}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Change</div>
              <div
                className={`text-lg font-bold ${
                  insight.metrics.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {insight.metrics.change >= 0 ? '+' : ''}
                {insight.metrics.changePercent.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {insight.relatedData && Object.keys(insight.relatedData).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Related Information</div>
            {Object.entries(insight.relatedData).map(([key, value]) => (
              <div key={key} className="text-xs space-y-1">
                <div className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</div>
                <div className="text-muted-foreground">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 bg-gray-300 rounded-full flex-1 w-24">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${insight.aiConfidence}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {insight.aiConfidence}% Confidence
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FrameworkInsights({ frameworkId, workspaceId, isOpen, onClose }: FrameworkInsightsProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredInsights = useMemo(() => {
    if (!selectedType) return MOCK_INSIGHTS;
    return MOCK_INSIGHTS.filter((insight) => insight.type === selectedType);
  }, [selectedType]);

  const insightsByType = useMemo(
    () => ({
      all: MOCK_INSIGHTS.length,
      performance: MOCK_INSIGHTS.filter((i) => i.type === 'performance').length,
      pattern: MOCK_INSIGHTS.filter((i) => i.type === 'pattern').length,
      anomaly: MOCK_INSIGHTS.filter((i) => i.type === 'anomaly').length,
      trend: MOCK_INSIGHTS.filter((i) => i.type === 'trend').length,
      opportunity: MOCK_INSIGHTS.filter((i) => i.type === 'opportunity').length,
    }),
    []
  );

  const handleGenerateInsights = async () => {
    try {
      setIsGenerating(true);
      logger.info('[INSIGHTS] Generating new insights...');

      // In production, this would call the API
      // const response = await fetch('/api/convex/framework-insights', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     frameworkId,
      //     workspaceId,
      //     action: 'generate',
      //   }),
      // });

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logger.info('[INSIGHTS] Insights generated successfully');
    } catch (error) {
      logger.error('[INSIGHTS] Failed to generate insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportInsights = () => {
    const data = {
      frameworkId,
      insights: filteredInsights,
      exportedAt: new Date().toISOString(),
      totalInsights: filteredInsights.length,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-${frameworkId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Framework Insights</DialogTitle>
          <DialogDescription>
            AI-generated insights about your framework performance and optimization opportunities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-5 gap-2">
            <Card
              className={`cursor-pointer transition ${
                selectedType === null ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType(null)}
            >
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{insightsByType.all}</div>
                <div className="text-xs text-muted-foreground">All Insights</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition ${
                selectedType === 'performance' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType('performance')}
            >
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{insightsByType.performance}</div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition ${
                selectedType === 'pattern' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType('pattern')}
            >
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{insightsByType.pattern}</div>
                <div className="text-xs text-muted-foreground">Patterns</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition ${
                selectedType === 'anomaly' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType('anomaly')}
            >
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{insightsByType.anomaly}</div>
                <div className="text-xs text-muted-foreground">Anomalies</div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition ${
                selectedType === 'opportunity' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedType('opportunity')}
            >
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{insightsByType.opportunity}</div>
                <div className="text-xs text-muted-foreground">Opportunities</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Insights List */}
          <ScrollArea className="h-[500px] border rounded-lg p-4">
            <div className="space-y-4">
              {filteredInsights.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No insights found in this category
                </div>
              ) : (
                filteredInsights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleGenerateInsights}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate New'}
            </Button>
            <Button variant="outline" onClick={handleExportInsights}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
