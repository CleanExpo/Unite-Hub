'use client';

/**
 * StrategyFinalReportTab Component
 * Phase 11 Week 9: Strategy health visualization
 *
 * Displays system health, long-horizon progress, and refinement cycles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';

interface SystemHealth {
  overall_score: number;
  status: string;
  trend: string;
  components: {
    drift_health: number;
    balance_health: number;
    performance_health: number;
    horizon_progress: number;
  };
}

interface DomainHealth {
  domain: string;
  score: number;
  status: string;
  allocation: number;
  performance: number;
  drift_signals: number;
  improvement_areas: string[];
}

interface HorizonProgress {
  plan_id: string;
  plan_name: string;
  horizon_type: string;
  days_remaining: number;
  progress_percent: number;
  steps_total: number;
  steps_completed: number;
  on_track: boolean;
}

interface RefinementHistory {
  cycle_id: string;
  cycle_number: number;
  cycle_type: string;
  started_at: string;
  drift_detected: boolean;
  adjustments_count: number;
  improvement_percent: number | null;
  status: string;
}

interface Alert {
  severity: string;
  message: string;
  action: string;
}

interface StrategyFinalReportTabProps {
  organizationId: string;
}

export function StrategyFinalReportTab({ organizationId }: StrategyFinalReportTabProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [domainHealth, setDomainHealth] = useState<DomainHealth[]>([]);
  const [horizonProgress, setHorizonProgress] = useState<HorizonProgress[]>([]);
  const [refinementHistory, setRefinementHistory] = useState<RefinementHistory[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [periodDays, setPeriodDays] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [organizationId, periodDays]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/strategy/report?organization_id=${organizationId}&type=summary&period_days=${periodDays}`
      );
      const data = await response.json();

      if (data.success) {
        const report = data.data;
        setSystemHealth(report.system_health);
        setDomainHealth(report.domain_health);
        setHorizonProgress(report.horizon_progress);
        setRefinementHistory(report.refinement_history);
        setAlerts(report.alerts);
        setRecommendations(report.recommendations);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'text-green-500';
      case 'GOOD': return 'text-blue-500';
      case 'FAIR': return 'text-yellow-500';
      case 'POOR': return 'text-orange-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'FAIR': return 'bg-yellow-500';
      case 'POOR': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'IMPROVING': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'DECLINING': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategy Report</h2>
          <p className="text-sm text-muted-foreground">
            System health, progress, and refinement summary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodDays} onValueChange={setPeriodDays}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReport} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getHealthColor(systemHealth.status)}`}>
                    {systemHealth.overall_score}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge className={getHealthBg(systemHealth.status)}>
                      {systemHealth.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendIcon trend={systemHealth.trend} />
                      {systemHealth.trend}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Drift Health</span>
                    <span>{systemHealth.components.drift_health}</span>
                  </div>
                  <Progress value={systemHealth.components.drift_health} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Balance Health</span>
                    <span>{systemHealth.components.balance_health}</span>
                  </div>
                  <Progress value={systemHealth.components.balance_health} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span>{systemHealth.components.performance_health}</span>
                  </div>
                  <Progress value={systemHealth.components.performance_health} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Horizon Progress</span>
                    <span>{systemHealth.components.horizon_progress}</span>
                  </div>
                  <Progress value={systemHealth.components.horizon_progress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge className={
                    alert.severity === 'CRITICAL' ? 'bg-red-500' :
                    alert.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                  }>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domain Health Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Health</CardTitle>
          <CardDescription>Performance across all marketing domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {domainHealth.map((domain) => (
              <Card key={domain.domain}>
                <CardContent className="pt-4">
                  <div className="text-center mb-3">
                    <div className={`text-2xl font-bold ${getHealthColor(domain.status)}`}>
                      {domain.score}
                    </div>
                    <div className="text-sm font-medium">{domain.domain}</div>
                    <Badge variant="outline" className="mt-1">
                      {domain.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Allocation</span>
                      <span>{domain.allocation.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Performance</span>
                      <span>{domain.performance.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Drift Signals</span>
                      <span className={domain.drift_signals > 0 ? 'text-yellow-500' : ''}>
                        {domain.drift_signals}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Horizon Progress */}
      {horizonProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Horizon Plans
            </CardTitle>
            <CardDescription>Active strategy plan progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {horizonProgress.map((plan) => (
                <div key={plan.plan_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{plan.plan_name}</span>
                      <Badge variant="outline" className="ml-2">
                        {plan.horizon_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.on_track ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {plan.days_remaining} days left
                      </span>
                    </div>
                  </div>
                  <Progress value={plan.progress_percent} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{plan.progress_percent.toFixed(1)}% complete</span>
                    <span>{plan.steps_completed}/{plan.steps_total} steps</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refinement History */}
      {refinementHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Refinement History
            </CardTitle>
            <CardDescription>Recent refinement cycles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cycle</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-center py-2">Drift</th>
                    <th className="text-right py-2">Adjustments</th>
                    <th className="text-right py-2">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {refinementHistory.slice(0, 10).map((cycle) => (
                    <tr key={cycle.cycle_id} className="border-b">
                      <td className="py-2">#{cycle.cycle_number}</td>
                      <td className="py-2">
                        <Badge variant="outline">{cycle.cycle_type}</Badge>
                      </td>
                      <td className="py-2">
                        {new Date(cycle.started_at).toLocaleDateString()}
                      </td>
                      <td className="text-center py-2">
                        {cycle.drift_detected ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 inline" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                        )}
                      </td>
                      <td className="text-right py-2">{cycle.adjustments_count}</td>
                      <td className="text-right py-2">
                        {cycle.improvement_percent !== null ? (
                          <span className={cycle.improvement_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {cycle.improvement_percent > 0 ? '+' : ''}{cycle.improvement_percent.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Strategic improvement suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StrategyFinalReportTab;
