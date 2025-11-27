/**
 * Framework Performance Metrics Component
 *
 * Displays detailed performance measurements:
 * - Execution time and speed metrics
 * - Quality scoring across dimensions
 * - Adoption metrics and team engagement
 * - Component-level performance
 * - Comparative analysis vs benchmarks
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Gauge,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Trophy,
  Target,
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface PerformanceMetrics {
  framework_id: string;
  execution_time_ms: number;
  quality_score: {
    completeness: number;
    consistency: number;
    clarity: number;
    usability: number;
  };
  adoption_metrics: {
    adoption_rate: number;
    team_engagement: number;
    recommendation_score: number;
  };
  component_metrics: Array<{
    component_id: string;
    name: string;
    usage_frequency: number;
    quality_score: number;
  }>;
  benchmark_comparison: {
    vs_industry_average: number;
    vs_top_performers: number;
    percentile_rank: number;
  };
}

interface FrameworkPerformanceMetricsProps {
  frameworkId: string;
  metrics?: PerformanceMetrics;
  onClose?: () => void;
}

const ScoreGauge = ({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient(score)}`}></div>
        <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getColor(score)}`}>{Math.round(score)}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold mt-3 text-center">{label}</p>
    </div>
  );
};

const PerformanceBar = ({
  label,
  value,
  target = 80,
}: {
  label: string;
  value: number;
  target?: number;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">{Math.round(value)}</span>
        {value >= target ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        )}
      </div>
    </div>
    <Progress value={Math.min(100, value)} className="h-2" />
  </div>
);

export function FrameworkPerformanceMetrics({
  frameworkId,
  metrics: externalMetrics,
  onClose,
}: FrameworkPerformanceMetricsProps) {
  const [loading, setLoading] = useState(!externalMetrics);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(externalMetrics || null);

  // Load metrics if not provided
  React.useEffect(() => {
    if (!externalMetrics) {
      const loadMetrics = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/convex/framework-metrics?frameworkId=${frameworkId}`);

          if (!response.ok) {
            throw new Error('Failed to load metrics');
          }

          const data = await response.json();
          setMetrics(data);
        } catch (error) {
          logger.error('[METRICS] Load error:', error);
        } finally {
          setLoading(false);
        }
      };

      loadMetrics();
    }
  }, [frameworkId, externalMetrics]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (!metrics) return 0;
    const qualityAvg =
      (metrics.quality_score.completeness +
        metrics.quality_score.consistency +
        metrics.quality_score.clarity +
        metrics.quality_score.usability) /
      4;
    const adoptionAvg =
      (metrics.adoption_metrics.adoption_rate +
        metrics.adoption_metrics.team_engagement +
        metrics.adoption_metrics.recommendation_score) /
      3;
    return (qualityAvg * 0.6 + adoptionAvg * 0.4);
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">No metrics available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={overallScore} label="Overall Performance" size="md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Execution Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.execution_time_ms}</div>
                <p className="text-xs text-muted-foreground">milliseconds</p>
                <p className="text-xs text-green-600 font-semibold mt-2">↓ 15% faster than avg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Percentile Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.benchmark_comparison.percentile_rank}</div>
                <p className="text-xs text-muted-foreground">top performers</p>
                <p className="text-xs text-green-600 font-semibold mt-2">Excellent performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Summary Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PerformanceBar label="Quality Score" value={Object.values(metrics.quality_score).reduce((a, b) => a + b) / 4} />
              <PerformanceBar label="Adoption Rate" value={metrics.adoption_metrics.adoption_rate} />
              <PerformanceBar label="Team Engagement" value={metrics.adoption_metrics.team_engagement} />
              <PerformanceBar label="Recommendation" value={metrics.adoption_metrics.recommendation_score} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.quality_score.completeness} label="Completeness" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.quality_score.consistency} label="Consistency" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.quality_score.clarity} label="Clarity" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.quality_score.usability} label="Usability" size="sm" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Breakdown</CardTitle>
              <CardDescription>Detailed quality metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Completeness</span>
                  <span className="text-sm">{Math.round(metrics.quality_score.completeness)}%</span>
                </div>
                <Progress value={metrics.quality_score.completeness} />
                <p className="text-xs text-muted-foreground mt-1">
                  All required components and sections are present
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Consistency</span>
                  <span className="text-sm">{Math.round(metrics.quality_score.consistency)}%</span>
                </div>
                <Progress value={metrics.quality_score.consistency} />
                <p className="text-xs text-muted-foreground mt-1">
                  Framework elements follow consistent patterns and structure
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Clarity</span>
                  <span className="text-sm">{Math.round(metrics.quality_score.clarity)}%</span>
                </div>
                <Progress value={metrics.quality_score.clarity} />
                <p className="text-xs text-muted-foreground mt-1">
                  Documentation and instructions are clear and comprehensive
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Usability</span>
                  <span className="text-sm">{Math.round(metrics.quality_score.usability)}%</span>
                </div>
                <Progress value={metrics.quality_score.usability} />
                <p className="text-xs text-muted-foreground mt-1">
                  Framework is easy to understand and apply
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adoption Tab */}
        <TabsContent value="adoption" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.adoption_metrics.adoption_rate} label="Adoption Rate" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.adoption_metrics.team_engagement} label="Team Engagement" size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ScoreGauge score={metrics.adoption_metrics.recommendation_score} label="Recommendation" size="sm" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adoption Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                <p className="text-sm font-semibold">High Adoption Potential</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Framework shows strong adoption trends across the team with consistent growth
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                <p className="text-sm font-semibold">Strong Team Engagement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Team members actively use and recommend the framework to colleagues
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                <p className="text-sm font-semibold">Excellent Recommendation Score</p>
                <p className="text-xs text-muted-foreground mt-1">
                  High likelihood that team members will recommend to other organizations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Component Performance</CardTitle>
              <CardDescription>How each framework component is performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.component_metrics.map((component) => (
                  <div key={component.component_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{component.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Used {component.usage_frequency} times
                        </p>
                      </div>
                      <Badge
                        variant={component.quality_score >= 80 ? 'default' : 'secondary'}
                      >
                        {Math.round(component.quality_score)}%
                      </Badge>
                    </div>
                    <Progress value={component.quality_score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benchmark Comparison</CardTitle>
              <CardDescription>How your framework compares to industry standards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">vs Industry Average</span>
                    <span className={`font-bold ${metrics.benchmark_comparison.vs_industry_average >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.benchmark_comparison.vs_industry_average >= 0 ? '+' : ''}
                      {metrics.benchmark_comparison.vs_industry_average}%
                    </span>
                  </div>
                  <Progress value={50 + metrics.benchmark_comparison.vs_industry_average} />
                  <p className="text-xs text-muted-foreground mt-2">Your framework performs {Math.abs(metrics.benchmark_comparison.vs_industry_average)}% better than industry average</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">vs Top Performers</span>
                    <span className={`font-bold ${metrics.benchmark_comparison.vs_top_performers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.benchmark_comparison.vs_top_performers >= 0 ? '+' : ''}
                      {metrics.benchmark_comparison.vs_top_performers}%
                    </span>
                  </div>
                  <Progress value={50 + metrics.benchmark_comparison.vs_top_performers} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.benchmark_comparison.vs_top_performers >= 0 ? 'Your framework competes' : 'Room for improvement vs'} top-performing frameworks
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Percentile Rank</span>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {metrics.benchmark_comparison.percentile_rank}th percentile
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Your framework ranks in the top {100 - metrics.benchmark_comparison.percentile_rank}% of all frameworks
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
