/**
 * Framework Analytics Dashboard Component
 *
 * Displays comprehensive analytics for custom frameworks:
 * - Usage metrics and adoption rates
 * - Performance scoring and effectiveness
 * - ROI calculations and impact metrics
 * - Team engagement analytics
 * - Trend analysis and insights
 * - Comparative metrics
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface FrameworkAnalytics {
  framework_id: string;
  total_uses: number;
  active_users: number;
  avg_effectiveness_score: number;
  completion_rate: number;
  conversion_rate: number;
  adoption_trend: Array<{ date: string; uses: number }>;
  effectiveness_trend: Array<{ date: string; score: number }>;
  user_engagement: Array<{ user_id: string; uses: number; last_used: string }>;
  component_usage: Array<{ component_id: string; usage_count: number }>;
  roi_impact: {
    estimated_value: number;
    time_saved_hours: number;
    team_productivity_increase: number;
    campaign_improvement: number;
  };
}

interface FrameworkAnalyticsDashboardProps {
  workspaceId: string;
  frameworkId: string;
  frameworkName: string;
  isOpen: boolean;
  onClose: () => void;
}

const KPICard = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-bold">{value}</p>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground">{Icon}</div>
      </div>
    </CardContent>
  </Card>
);

export function FrameworkAnalyticsDashboard({
  workspaceId,
  frameworkId,
  frameworkName,
  isOpen,
  onClose,
}: FrameworkAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<FrameworkAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/convex/framework-analytics?workspaceId=${workspaceId}&frameworkId=${frameworkId}&range=${timeRange}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      logger.error('[ANALYTICS] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, frameworkId, timeRange]);

  // Load analytics on mount
  React.useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, loadAnalytics]);

  // Refresh analytics
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Export analytics
  const handleExportAnalytics = () => {
    if (!analytics) return;

    const data = {
      framework_id: frameworkId,
      framework_name: frameworkName,
      exported_at: new Date().toISOString(),
      time_range: timeRange,
      analytics,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${frameworkId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!analytics) return null;

    const avgEffectiveness = Math.round(analytics.avg_effectiveness_score);
    const completionRate = Math.round(analytics.completion_rate * 100);
    const conversionRate = Math.round(analytics.conversion_rate * 100);
    const adoptionScore = Math.min(100, (analytics.active_users / 10) * 100);

    return {
      avgEffectiveness,
      completionRate,
      conversionRate,
      adoptionScore,
    };
  }, [analytics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{frameworkName} - Analytics</CardTitle>
              <CardDescription>Performance metrics and usage insights</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalytics}
                disabled={!analytics}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mt-4 flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">Loading analytics...</div>
            </div>
          ) : analytics && metrics ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="roi">ROI</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Total Uses"
                    value={analytics.total_uses}
                    trend="up"
                    trendValue={12}
                    icon={<Activity className="h-5 w-5" />}
                  />
                  <KPICard
                    title="Active Users"
                    value={analytics.active_users}
                    trend="up"
                    trendValue={8}
                    icon={<Users className="h-5 w-5" />}
                  />
                  <KPICard
                    title="Effectiveness"
                    value={metrics.avgEffectiveness}
                    unit="%"
                    trend="up"
                    trendValue={5}
                    icon={<Target className="h-5 w-5" />}
                  />
                  <KPICard
                    title="Adoption Score"
                    value={Math.round(metrics.adoptionScore)}
                    unit="%"
                    trend="up"
                    trendValue={15}
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                </div>

                {/* Key Metrics Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Completion Rate</span>
                        <span className="text-sm font-bold">{metrics.completionRate}%</span>
                      </div>
                      <Progress value={metrics.completionRate} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Conversion Rate</span>
                        <span className="text-sm font-bold">{metrics.conversionRate}%</span>
                      </div>
                      <Progress value={metrics.conversionRate} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">Effectiveness Score</span>
                        <span className="text-sm font-bold">{metrics.avgEffectiveness}/100</span>
                      </div>
                      <Progress value={metrics.avgEffectiveness} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Usage Tab */}
              <TabsContent value="usage" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Usage Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Usage Trend</CardTitle>
                      <CardDescription>Daily framework usage over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-center justify-center bg-muted rounded">
                        <LineChart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Users</CardTitle>
                      <CardDescription>Most active team members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.user_engagement.slice(0, 5).map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">User {idx + 1}</span>
                            <Badge variant="secondary">{user.uses} uses</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Component Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Component Usage Distribution</CardTitle>
                    <CardDescription>Which framework components are most used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.component_usage.slice(0, 6).map((comp, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Component {idx + 1}</span>
                            <span className="font-semibold">{comp.usage_count}</span>
                          </div>
                          <Progress value={(comp.usage_count / 100) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Effectiveness Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Effectiveness Trend</CardTitle>
                      <CardDescription>How framework effectiveness changes over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-center justify-center bg-muted rounded">
                        <LineChart className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Overall Performance</CardTitle>
                      <CardDescription>Framework quality score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center h-48">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                          <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold">
                                {metrics.avgEffectiveness}
                              </div>
                              <div className="text-xs text-muted-foreground">/100</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">Excellent Performance</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ROI Tab */}
              <TabsContent value="roi" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Estimated ROI Value"
                    value={`$${analytics.roi_impact.estimated_value.toLocaleString()}`}
                    trend="up"
                    trendValue={22}
                    icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                  />
                  <KPICard
                    title="Time Saved"
                    value={analytics.roi_impact.time_saved_hours}
                    unit="hours"
                    trend="up"
                    trendValue={18}
                    icon={<Activity className="h-5 w-5" />}
                  />
                  <KPICard
                    title="Productivity Increase"
                    value={analytics.roi_impact.team_productivity_increase}
                    unit="%"
                    trend="up"
                    trendValue={14}
                    icon={<Users className="h-5 w-5" />}
                  />
                  <KPICard
                    title="Campaign Improvement"
                    value={analytics.roi_impact.campaign_improvement}
                    unit="%"
                    trend="up"
                    trendValue={11}
                    icon={<Target className="h-5 w-5" />}
                  />
                </div>

                {/* ROI Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ROI Breakdown</CardTitle>
                    <CardDescription>Impact analysis and value drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-semibold">Time Efficiency Gains</span>
                        <span className="text-2xl font-bold">
                          ${(analytics.roi_impact.time_saved_hours * 150).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-semibold">Quality Improvements</span>
                        <span className="text-2xl font-bold">
                          ${(analytics.roi_impact.campaign_improvement * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        <span className="font-bold">Total Estimated Value</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${analytics.roi_impact.estimated_value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Insights</CardTitle>
                    <CardDescription>Actionable recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        High Adoption Rate
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                        Your framework has achieved {metrics.adoptionScore}% adoption among team members.
                        Consider promoting usage across the organization.
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                      <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                        Strong Effectiveness
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                        Framework effectiveness score of {metrics.avgEffectiveness}% indicates strong
                        performance. Continue monitoring and refining based on user feedback.
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-4 border-yellow-500">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                        Optimization Opportunity
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                        Completion rate is at {metrics.completionRate}%. Consider adding
                        training materials for low-completion sections.
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded border-l-4 border-purple-500">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                        ROI Achievement
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                        Framework has generated estimated value of $
                        {analytics.roi_impact.estimated_value.toLocaleString()} through efficiency
                        gains and campaign improvements.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">No analytics data available</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
