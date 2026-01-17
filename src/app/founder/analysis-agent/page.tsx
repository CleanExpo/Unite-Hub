'use client';

/**
 * Analysis Agent Demo Dashboard
 * Test business intelligence and KPI analysis
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Zap } from 'lucide-react';

interface AnalysisDemo {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  result?: {
    kpis: {
      emailEngagement: number;
      emailOpenRate: number;
      contentGenerated: number;
      autoApprovedContent: number;
      staffUtilization: number;
      profitMargin: number;
    };
    anomalies: Array<{
      type: string;
      source: string;
      description: string;
      severity: string;
    }>;
    insights: Array<{
      title: string;
      priority: string;
      category: string;
      description: string;
    }>;
    forecast: {
      emailPrediction: { sent: number; opens: number };
      contentPrediction: { volume: number; approvalRate: number };
      recommendedActions: string[];
    };
  };
}

export default function AnalysisAgentDemo() {
  const { session, currentOrganization } = useAuth();
  const [demo, setDemo] = useState<AnalysisDemo>({ status: 'idle', message: '' });
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'quarter'>('7d');

  const workspaceId = currentOrganization?.org_id || '';

  // Generate sample datasets
  const generateSampleDatasets = () => {
    return {
      email: [
        { sent: 500, opens: 125, clicks: 25, bounces: 5 },
        { sent: 480, opens: 108, clicks: 18, bounces: 4 },
        { sent: 520, opens: 156, clicks: 36, bounces: 3 },
      ],
      research: [
        { source: 'Industry Report', insight: 'AI adoption accelerating', threat_level: 'low' },
        { source: 'Competitor Analysis', insight: 'New entrant pricing pressure', threat_level: 'medium' },
        { source: 'Market Trends', insight: 'Customer demand shifting', threat_level: 'high' },
      ],
      content: [
        { intent: 'email', risk_level: 'low', ready_to_use: true },
        { intent: 'post', risk_level: 'low', ready_to_use: true },
        { intent: 'article', risk_level: 'medium', ready_to_use: false },
        { intent: 'email', risk_level: 'low', ready_to_use: true },
        { intent: 'post', risk_level: 'low', ready_to_use: true },
      ],
      scheduling: [
        { slots_available: 8, conflicts: [] },
        { slots_available: 5, conflicts: [{ overlap: 30 }] },
        { slots_available: 3, conflicts: [{ overlap: 45 }, { overlap: 20 }] },
      ],
      staff: [
        { name: 'Alice', utilization: 85, tasks: 12 },
        { name: 'Bob', utilization: 72, tasks: 9 },
        { name: 'Carol', utilization: 91, tasks: 14 },
      ],
      financials: [
        { revenue: 45000, expenses: 32000 },
        { revenue: 48000, expenses: 33500 },
        { revenue: 52000, expenses: 35200 },
      ],
    };
  };

  // Run analysis demo
  const runDemo = async () => {
    if (!workspaceId || !session?.access_token) {
      setDemo({ status: 'error', message: 'Not authenticated' });
      return;
    }

    setDemo({ status: 'loading', message: 'Analyzing metrics...' });

    try {
      const response = await fetch('/api/agents/analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          brand: 'unite_hub',
          timeframe,
          datasets: generateSampleDatasets(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setDemo({
        status: 'success',
        message: 'Analysis complete',
        result: {
          kpis: data.kpis,
          anomalies: data.anomalies || [],
          insights: data.insights || [],
          forecast: data.forecast,
        },
      });
    } catch (error) {
      console.error('Demo error:', error);
      setDemo({
        status: 'error',
        message: error instanceof Error ? error.message : 'Demo failed',
      });
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <Alert className="border-warning-200 bg-warning-50 dark:bg-warning-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please log in to access the analysis agent demo.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const result = demo.result;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analysis Agent</h1>
        <p className="text-text-secondary mt-2">
          Business intelligence, KPI analysis, anomaly detection, forecasting, and insights
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Analysis Report</CardTitle>
          <CardDescription>Test the analysis agent with sample datasets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Analysis Timeframe</label>
              <div className="flex gap-2 mt-2">
                {(['7d', '30d', 'quarter'] as const).map((tf) => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'outline'}
                    onClick={() => setTimeframe(tf)}
                    className="text-xs"
                  >
                    {tf === 'quarter' ? '90d' : tf}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={runDemo} disabled={demo.status === 'loading'}>
              {demo.status === 'loading' ? 'Analyzing...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {demo.status === 'success' && (
        <Alert className="border-success-200 bg-success-50 dark:bg-success-950/30">
          <CheckCircle2 className="h-4 w-4 text-success-600" />
          <AlertTitle>Analysis Complete</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {demo.status === 'error' && (
        <Alert className="border-error-200 bg-error-50 dark:bg-error-950/30">
          <AlertTriangle className="h-4 w-4 text-error-600" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Tabs defaultValue="kpis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies ({result.anomalies.length})</TabsTrigger>
            <TabsTrigger value="insights">Insights ({result.insights.length})</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* KPIs Tab */}
          <TabsContent value="kpis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Email Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Engagement Score</span>
                    <span className="text-2xl font-bold">{result.kpis.emailEngagement.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">Open Rate</span>
                    <span className="font-medium">{result.kpis.emailOpenRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-bg-hover rounded h-2">
                    <div
                      className="bg-info-600 h-2 rounded"
                      style={{ width: `${Math.min(result.kpis.emailEngagement, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Generation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pieces Generated</span>
                    <span className="text-2xl font-bold">{result.kpis.contentGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">Auto-Approved</span>
                    <span className="font-medium">{result.kpis.autoApprovedContent.toFixed(0)}%</span>
                  </div>
                  <Badge
                    variant={result.kpis.autoApprovedContent > 75 ? 'default' : 'secondary'}
                  >
                    {result.kpis.autoApprovedContent > 75 ? 'Strong' : 'Fair'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Staff Utilization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Utilization</span>
                    <span className="text-2xl font-bold">{result.kpis.staffUtilization.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-bg-hover rounded h-2">
                    <div
                      className={`h-2 rounded ${result.kpis.staffUtilization > 85 ? 'bg-error-600' : result.kpis.staffUtilization > 75 ? 'bg-warning-600' : 'bg-success-600'}`}
                      style={{ width: `${Math.min(result.kpis.staffUtilization, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {result.kpis.staffUtilization > 85
                      ? 'Overloaded'
                      : result.kpis.staffUtilization > 75
                        ? 'High'
                        : 'Healthy'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Financial Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-2xl font-bold">{result.kpis.profitMargin.toFixed(1)}%</span>
                  </div>
                  <Badge
                    variant={
                      result.kpis.profitMargin > 30
                        ? 'default'
                        : result.kpis.profitMargin > 15
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {result.kpis.profitMargin > 30
                      ? 'Strong'
                      : result.kpis.profitMargin > 15
                        ? 'Stable'
                        : 'At Risk'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies">
            {result.anomalies.length === 0 ? (
              <Card className="bg-success-50 dark:bg-success-950/20 border-success-200">
                <CardContent className="pt-6">
                  <p className="text-success-900 dark:text-success-200">No anomalies detected.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {result.anomalies.map((anomaly, idx) => (
                  <Card
                    key={idx}
                    className={`border-l-4 ${
                      anomaly.severity === 'critical'
                        ? 'border-l-red-600 bg-error-50 dark:bg-error-950/20'
                        : anomaly.severity === 'high'
                          ? 'border-l-accent-600 bg-accent-50 dark:bg-accent-950/20'
                          : 'border-l-warning-600 bg-warning-50 dark:bg-warning-950/20'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{anomaly.description}</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Source: {anomaly.source} | Type: {anomaly.type}
                          </p>
                        </div>
                        <Badge
                          variant={
                            anomaly.severity === 'critical'
                              ? 'destructive'
                              : anomaly.severity === 'high'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            {result.insights.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-text-secondary">No insights generated yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {result.insights.map((insight, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-medium text-sm">{insight.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <Badge
                            variant={
                              insight.priority === 'critical' || insight.priority === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {insight.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Email Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Predicted Sends</span>
                    <span className="font-bold">{result.forecast.emailPrediction.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Predicted Opens</span>
                    <span className="font-bold">{result.forecast.emailPrediction.opens}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Content Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Predicted Volume</span>
                    <span className="font-bold">{result.forecast.contentPrediction.volume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Predicted Approval Rate</span>
                    <span className="font-bold">
                      {result.forecast.contentPrediction.approvalRate.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.forecast.recommendedActions.length > 0 && (
              <Card className="mt-4 border-info-200 bg-info-50 dark:bg-info-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.forecast.recommendedActions.map((action, idx) => (
                      <li key={idx} className="text-sm flex gap-2">
                        <span className="text-info-600">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Documentation */}
      <Card className="border-info-200 bg-info-50 dark:bg-info-950/20">
        <CardHeader>
          <CardTitle className="text-base">How the Analysis Agent Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">1. Data Collection</p>
            <p className="text-text-secondary">
              Aggregates data from email, research, content, scheduling, staff, and financial systems.
            </p>
          </div>
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">2. KPI Extraction</p>
            <p className="text-text-secondary">
              Calculates 15+ key performance indicators across all business dimensions.
            </p>
          </div>
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">3. Anomaly Detection</p>
            <p className="text-text-secondary">
              Identifies statistical outliers, spikes, drops, and pattern breaks using z-score analysis.
            </p>
          </div>
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">4. Forecasting</p>
            <p className="text-text-secondary">
              Projects future metrics using exponential smoothing and trend extrapolation.
            </p>
          </div>
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">5. Insight Generation</p>
            <p className="text-text-secondary">
              Derives 50+ business insights with action items and priority levels.
            </p>
          </div>
          <div>
            <p className="font-medium text-info-900 dark:text-info-200">6. Founder Review</p>
            <p className="text-text-secondary">
              Routes high-risk reports to founder with full context for decision-making.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
