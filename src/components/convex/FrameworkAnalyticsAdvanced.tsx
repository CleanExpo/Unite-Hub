/**
 * Advanced Framework Analytics Component
 *
 * Displays comprehensive alert analytics with trends, patterns, and performance metrics:
 * - 7-day/30-day alert trend analysis
 * - Alert type distribution analysis
 * - Response time and MTTR metrics
 * - False positive rate tracking
 * - Alert suppression effectiveness
 * - Pattern detection insights
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface AnalyticsData {
  date: string;
  totalTriggers: number;
  threshold: number;
  anomaly: number;
  performance: number;
  milestone: number;
  avgResponseTime: number;
  mttr: number;
  falsePositiveRate: number;
  suppressionEffectiveness: number;
}

interface AlertPattern {
  id: string;
  name: string;
  type: 'seasonal' | 'cyclical' | 'correlated' | 'triggered_by';
  confidence: number;
  frequency: string;
  lastOccurrence: string;
  recommendation: string;
}

interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  status: 'good' | 'fair' | 'warning';
}

// Mock analytics data (30 days)
const MOCK_ANALYTICS_DATA: AnalyticsData[] = [
  {
    date: '11-27',
    totalTriggers: 12,
    threshold: 7,
    anomaly: 3,
    performance: 2,
    milestone: 0,
    avgResponseTime: 45,
    mttr: 120,
    falsePositiveRate: 8,
    suppressionEffectiveness: 78,
  },
  {
    date: '11-26',
    totalTriggers: 8,
    threshold: 4,
    anomaly: 2,
    performance: 2,
    milestone: 0,
    avgResponseTime: 52,
    mttr: 135,
    falsePositiveRate: 12,
    suppressionEffectiveness: 75,
  },
  {
    date: '11-25',
    totalTriggers: 15,
    threshold: 9,
    anomaly: 4,
    performance: 2,
    milestone: 0,
    avgResponseTime: 38,
    mttr: 110,
    falsePositiveRate: 7,
    suppressionEffectiveness: 82,
  },
  {
    date: '11-24',
    totalTriggers: 10,
    threshold: 5,
    anomaly: 3,
    performance: 2,
    milestone: 0,
    avgResponseTime: 48,
    mttr: 125,
    falsePositiveRate: 10,
    suppressionEffectiveness: 76,
  },
  {
    date: '11-23',
    totalTriggers: 18,
    threshold: 10,
    anomaly: 5,
    performance: 3,
    milestone: 0,
    avgResponseTime: 35,
    mttr: 95,
    falsePositiveRate: 6,
    suppressionEffectiveness: 85,
  },
  {
    date: '11-22',
    totalTriggers: 14,
    threshold: 8,
    anomaly: 4,
    performance: 2,
    milestone: 0,
    avgResponseTime: 42,
    mttr: 115,
    falsePositiveRate: 9,
    suppressionEffectiveness: 79,
  },
  {
    date: '11-21',
    totalTriggers: 11,
    threshold: 6,
    anomaly: 3,
    performance: 2,
    milestone: 0,
    avgResponseTime: 50,
    mttr: 130,
    falsePositiveRate: 11,
    suppressionEffectiveness: 74,
  },
];

// Mock patterns
const MOCK_PATTERNS: AlertPattern[] = [
  {
    id: 'pattern_001',
    name: 'Monday Morning Spike',
    type: 'cyclical',
    confidence: 92,
    frequency: 'Weekly (Mondays)',
    lastOccurrence: '2025-11-24',
    recommendation: 'Schedule maintenance during off-peak hours or increase resource allocation',
  },
  {
    id: 'pattern_002',
    name: 'Effectiveness Score Drop After Release',
    type: 'correlated',
    confidence: 87,
    frequency: 'Every 2 weeks',
    lastOccurrence: '2025-11-22',
    recommendation: 'Run extended tests before releases or plan for gradual rollouts',
  },
  {
    id: 'pattern_003',
    name: 'Adoption Rate Seasonal Peak',
    type: 'seasonal',
    confidence: 85,
    frequency: 'Quarterly',
    lastOccurrence: '2025-11-15',
    recommendation: 'Prepare for capacity increases in Q4 and Q1',
  },
];

function getStatusColor(status: 'good' | 'fair' | 'warning'): string {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-50';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50';
    case 'warning':
      return 'text-red-600 bg-red-50';
  }
}

function getStatusIcon(status: 'good' | 'fair' | 'warning') {
  switch (status) {
    case 'good':
      return <TrendingDown className="h-4 w-4" />;
    case 'fair':
      return <Activity className="h-4 w-4" />;
    case 'warning':
      return <TrendingUp className="h-4 w-4" />;
  }
}

function KPICard({
  label,
  value,
  target,
  status,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  status: 'good' | 'fair' | 'warning';
  unit: string;
}) {
  const percentage = Math.round((value / target) * 100);

  return (
    <Card className={`${getStatusColor(status)}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <div className="flex items-center gap-2 mt-2">
              {getStatusIcon(status)}
              <p className="text-2xl font-bold">{value}</p>
              <span className="text-sm text-gray-600">{unit}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Target: {target}</p>
            <p className="text-sm font-semibold">{percentage}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FrameworkAnalyticsAdvanced({
  frameworkId,
  workspaceId,
}: {
  frameworkId: string;
  workspaceId: string;
}) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');
  const [selectedPattern, setSelectedPattern] = useState<AlertPattern | null>(null);

  // Filter data based on time range
  const chartData = useMemo(() => {
    if (timeRange === '7d') {
      return MOCK_ANALYTICS_DATA.slice(-7);
    }
    return MOCK_ANALYTICS_DATA;
  }, [timeRange]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const avgResponseTime = Math.round(
      chartData.reduce((sum, d) => sum + d.avgResponseTime, 0) / chartData.length
    );
    const avgMTTR = Math.round(
      chartData.reduce((sum, d) => sum + d.mttr, 0) / chartData.length
    );
    const avgFalsePositiveRate = Math.round(
      (chartData.reduce((sum, d) => sum + d.falsePositiveRate, 0) / chartData.length) * 10
    ) / 10;
    const avgSuppressionEffectiveness = Math.round(
      (chartData.reduce((sum, d) => sum + d.suppressionEffectiveness, 0) / chartData.length) * 10
    ) / 10;

    return {
      avgResponseTime,
      avgMTTR,
      avgFalsePositiveRate,
      avgSuppressionEffectiveness,
    };
  }, [chartData]);

  // Calculate alert type distribution
  const typeDistribution = useMemo(() => {
    const totals = {
      threshold: 0,
      anomaly: 0,
      performance: 0,
      milestone: 0,
    };

    chartData.forEach((d) => {
      totals.threshold += d.threshold;
      totals.anomaly += d.anomaly;
      totals.performance += d.performance;
      totals.milestone += d.milestone;
    });

    return [
      { name: 'Threshold', value: totals.threshold, color: '#ef4444' },
      { name: 'Anomaly', value: totals.anomaly, color: '#f97316' },
      { name: 'Performance', value: totals.performance, color: '#eab308' },
      { name: 'Milestone', value: totals.milestone, color: '#22c55e' },
    ];
  }, [chartData]);

  // Performance metrics for KPI cards
  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Avg Response Time',
      value: summaryMetrics.avgResponseTime,
      target: 60,
      status: summaryMetrics.avgResponseTime < 50 ? 'good' : 'fair',
    },
    {
      label: 'MTTR (Mean Time To Resolve)',
      value: summaryMetrics.avgMTTR,
      target: 120,
      status: summaryMetrics.avgMTTR < 100 ? 'good' : 'fair',
    },
    {
      label: 'False Positive Rate',
      value: summaryMetrics.avgFalsePositiveRate,
      target: 10,
      status: summaryMetrics.avgFalsePositiveRate < 10 ? 'good' : 'warning',
    },
    {
      label: 'Suppression Effectiveness',
      value: summaryMetrics.avgSuppressionEffectiveness,
      target: 80,
      status: summaryMetrics.avgSuppressionEffectiveness >= 75 ? 'good' : 'fair',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alert Analytics</h2>
        <div className="flex gap-2">
          {(['7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <KPICard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            target={metric.target}
            status={metric.status}
            unit={metric.label.includes('Rate') || metric.label.includes('Effectiveness') ? '%' : 'min'}
          />
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Volume Trend</CardTitle>
              <CardDescription>Total alerts triggered over {timeRange === '7d' ? 'last 7 days' : 'last 30 days'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalTriggers" stroke="#3b82f6" name="Total Triggers" strokeWidth={2} />
                  <Line type="monotone" dataKey="threshold" stroke="#ef4444" name="Threshold" />
                  <Line type="monotone" dataKey="anomaly" stroke="#f97316" name="Anomaly" />
                  <Line type="monotone" dataKey="performance" stroke="#eab308" name="Performance" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time & MTTR Trend</CardTitle>
              <CardDescription>Average response time and mean time to resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgResponseTime" stroke="#3b82f6" name="Avg Response Time (min)" strokeWidth={2} />
                  <Line type="monotone" dataKey="mttr" stroke="#8b5cf6" name="MTTR (min)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Type Distribution</CardTitle>
              <CardDescription>Breakdown of alerts by type for {timeRange === '7d' ? 'last 7 days' : 'last 30 days'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                {typeDistribution.map((type) => (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                    <span className="text-sm font-bold">{type.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Alert Patterns</CardTitle>
              <CardDescription>Recurring patterns and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {MOCK_PATTERNS.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{pattern.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{pattern.type}</Badge>
                            <Badge
                              variant={pattern.confidence >= 85 ? 'default' : 'secondary'}
                            >
                              {pattern.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <Zap className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Frequency: {pattern.frequency}</p>
                        <p>Last seen: {pattern.lastOccurrence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedPattern && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Pattern Details: {selectedPattern.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recommendation</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedPattern.recommendation}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="text-lg font-bold">{selectedPattern.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Frequency</p>
                    <p className="text-sm font-semibold">{selectedPattern.frequency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>Alert system quality and accuracy metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="falsePositiveRate" fill="#ef4444" name="False Positive Rate (%)" />
                  <Bar dataKey="suppressionEffectiveness" fill="#22c55e" name="Suppression Effectiveness (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">True Positive Rate</p>
                    <p className="text-2xl font-bold text-green-600">91.5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">False Positive Rate</p>
                    <p className="text-2xl font-bold text-red-600">{summaryMetrics.avgFalsePositiveRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Acknowledgment Rate</p>
                    <p className="text-2xl font-bold text-blue-600">94%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-purple-600">88%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
