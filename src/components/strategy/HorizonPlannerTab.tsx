'use client';

/**
 * HorizonPlannerTab Component
 * Phase 11 Week 5-6: Long-Horizon Planning UI
 *
 * Shows timelines, KPIs, dependencies, and plan scoring
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  PlayCircle,
  RefreshCw,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface HorizonPlan {
  id: string;
  name: string;
  description: string | null;
  horizon_type: string;
  start_date: string;
  end_date: string;
  days_total: number;
  is_rolling: boolean;
  status: string;
  confidence_score: number | null;
  feasibility_score: number | null;
  impact_score: number | null;
  overall_score: number | null;
  created_at: string;
}

interface HorizonStep {
  id: string;
  name: string;
  description: string | null;
  step_number: number;
  domain: string;
  start_day: number;
  end_day: number;
  duration_days: number;
  status: string;
  progress: number;
  risk_level: string;
}

interface KPITrend {
  metric_name: string;
  domain: string;
  current_value: number;
  baseline_value: number;
  target_value: number;
  change_percent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  on_track: boolean;
  gap_to_target: number;
}

interface DomainSummary {
  domain: string;
  metrics: KPITrend[];
  overall_score: number;
  health_status: string;
  improvement_areas: string[];
}

interface HorizonPlannerTabProps {
  organizationId: string;
}

export function HorizonPlannerTab({ organizationId }: HorizonPlannerTabProps) {
  const [plans, setPlans] = useState<HorizonPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<HorizonPlan | null>(null);
  const [steps, setSteps] = useState<HorizonStep[]>([]);
  const [kpiTrends, setKpiTrends] = useState<KPITrend[]>([]);
  const [domainSummaries, setDomainSummaries] = useState<DomainSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanType, setNewPlanType] = useState<string>('MEDIUM');

  // Load plans
  useEffect(() => {
    loadPlans();
    loadKPITrends();
  }, [organizationId]);

  const loadPlans = async () => {
    try {
      const response = await fetch(
        `/api/strategy/horizon/list?organization_id=${organizationId}`
      );
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
        if (data.plans.length > 0 && !selectedPlan) {
          setSelectedPlan(data.plans[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadKPITrends = async () => {
    try {
      const response = await fetch(
        `/api/strategy/horizon/kpi?organization_id=${organizationId}&action=trends`
      );
      const data = await response.json();
      if (data.success) {
        setKpiTrends(data.data);
      }

      // Load domain summaries
      const domains = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
      const summaries: DomainSummary[] = [];

      for (const domain of domains) {
        const summaryResponse = await fetch(
          `/api/strategy/horizon/kpi?organization_id=${organizationId}&action=summary&domain=${domain}`
        );
        const summaryData = await summaryResponse.json();
        if (summaryData.success) {
          summaries.push(summaryData.data);
        }
      }

      setDomainSummaries(summaries);
    } catch (error) {
      console.error('Failed to load KPI trends:', error);
    }
  };

  const createPlan = async () => {
    if (!newPlanName) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/strategy/horizon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          horizon_type: newPlanType,
          name: newPlanName,
          description: newPlanDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPlans(prev => [data.plan, ...prev]);
        setSelectedPlan(data.plan);
        setSteps(data.steps);
        setIsCreateOpen(false);
        setNewPlanName('');
        setNewPlanDescription('');
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'DRAFT':
        return 'bg-gray-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'text-green-500';
      case 'GOOD':
        return 'text-blue-500';
      case 'FAIR':
        return 'text-yellow-500';
      case 'POOR':
        return 'text-orange-500';
      case 'CRITICAL':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'DOWN':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Horizon Planning</h2>
          <p className="text-sm text-muted-foreground">
            30/60/90-day rolling strategy plans with KPI tracking
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Horizon Plan</DialogTitle>
              <DialogDescription>
                Generate a new rolling strategy plan with automated step generation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Q1 2025 Growth Strategy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Horizon Type</Label>
                <Select value={newPlanType} onValueChange={setNewPlanType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHORT">Short (30 days)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (60 days)</SelectItem>
                    <SelectItem value="LONG">Long (90 days)</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Strategic objectives and focus areas..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createPlan} disabled={isLoading || !newPlanName}>
                {isLoading ? 'Generating...' : 'Generate Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans List */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-colors ${
              selectedPlan?.id === plan.id ? 'border-primary' : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {plan.days_total} days | {plan.horizon_type}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(plan.start_date).toLocaleDateString()} -{' '}
                  {new Date(plan.end_date).toLocaleDateString()}
                </div>
                {plan.overall_score !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Score</span>
                      <span>{plan.overall_score.toFixed(0)}/100</span>
                    </div>
                    <Progress value={plan.overall_score} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No horizon plans yet</p>
              <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                Create your first plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KPI Performance</CardTitle>
              <CardDescription>Current metrics across all domains</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadKPITrends}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {domainSummaries.map((summary) => (
              <Card key={summary.domain}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{summary.domain}</CardTitle>
                    <span className={`text-sm font-medium ${getHealthColor(summary.health_status)}`}>
                      {summary.overall_score.toFixed(0)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={summary.overall_score} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {summary.health_status}
                  </div>
                  {summary.improvement_areas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Focus areas:</p>
                      <ul className="text-xs text-muted-foreground">
                        {summary.improvement_areas.slice(0, 2).map((area) => (
                          <li key={area} className="flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            {area.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPI Trends Table */}
          {kpiTrends.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Key Metrics</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Metric</th>
                      <th className="text-left py-2">Domain</th>
                      <th className="text-right py-2">Current</th>
                      <th className="text-right py-2">Target</th>
                      <th className="text-right py-2">Change</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiTrends.slice(0, 10).map((trend, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{trend.metric_name.replace(/_/g, ' ')}</td>
                        <td className="py-2">
                          <Badge variant="outline">{trend.domain}</Badge>
                        </td>
                        <td className="text-right py-2">
                          {trend.current_value.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          {trend.target_value.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          <div className="flex items-center justify-end gap-1">
                            <TrendIcon trend={trend.trend} />
                            <span className={trend.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {trend.change_percent.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-2">
                          {trend.on_track ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedPlan.name}</CardTitle>
                <CardDescription>
                  {selectedPlan.description || 'No description'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedPlan.status === 'DRAFT' && (
                  <Button size="sm">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Activate
                  </Button>
                )}
                {selectedPlan.is_rolling && (
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Roll Forward
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Plan Scores */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedPlan.confidence_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedPlan.feasibility_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">Feasibility</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedPlan.impact_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">Impact</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedPlan.overall_score?.toFixed(0) || '--'}
                </div>
                <div className="text-xs text-muted-foreground">Overall</div>
              </div>
            </div>

            {/* Plan Timeline */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Timeline
              </h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Start: {new Date(selectedPlan.start_date).toLocaleDateString()}</span>
                <span>End: {new Date(selectedPlan.end_date).toLocaleDateString()}</span>
                <span>Duration: {selectedPlan.days_total} days</span>
                {selectedPlan.is_rolling && (
                  <Badge variant="outline">Rolling</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default HorizonPlannerTab;
