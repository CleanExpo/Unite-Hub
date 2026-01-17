'use client';

/**
 * Founder Soft Launch Dashboard
 * Phase 57: Monitor and manage controlled rollout
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoftLaunchTracker } from '@/ui/components/SoftLaunchTracker';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  Target,
  Zap,
} from 'lucide-react';

// Types
type RolloutState = 'invited' | 'trial_active' | 'activation_active' | 'stabilized' | 'paused' | 'churned';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface SoftLaunchClient {
  id: string;
  workspace_id: string;
  client_name: string;
  contact_email: string;
  industry: string;
  state: RolloutState;
  gates_completed: string[];
  risk_level: RiskLevel;
  risk_flags: string[];
  invited_at: string;
  trial_started_at?: string;
  activation_started_at?: string;
  momentum_score: number;
  notes: string;
  kill_switch_active: boolean;
}

interface RolloutSummary {
  total_clients: number;
  by_state: Record<RolloutState, number>;
  by_risk: Record<RiskLevel, number>;
  avg_momentum: number;
  clients_needing_attention: SoftLaunchClient[];
}

interface ReadinessCheck {
  name: string;
  passed: boolean;
  message: string;
}

// Mock data for demonstration
const mockClients: SoftLaunchClient[] = [
  {
    id: '1',
    workspace_id: 'ws-1',
    client_name: 'Brisbane Balustrades',
    contact_email: 'owner@brisbanebalustrades.com.au',
    industry: 'Construction/Trades',
    state: 'trial_active',
    gates_completed: ['technical_ready', 'strategy_ready'],
    risk_level: 'low',
    risk_flags: [],
    invited_at: '2025-01-10T00:00:00Z',
    trial_started_at: '2025-01-12T00:00:00Z',
    momentum_score: 72,
    notes: 'First soft launch client',
    kill_switch_active: false,
  },
];

const mockSummary: RolloutSummary = {
  total_clients: 1,
  by_state: {
    invited: 0,
    trial_active: 1,
    activation_active: 0,
    stabilized: 0,
    paused: 0,
    churned: 0,
  },
  by_risk: {
    low: 1,
    medium: 0,
    high: 0,
    critical: 0,
  },
  avg_momentum: 72,
  clients_needing_attention: [],
};

const mockReadinessChecks: ReadinessCheck[] = [
  { name: 'Database Connection', passed: true, message: 'Connected' },
  { name: 'Authentication', passed: true, message: 'Supabase Auth configured' },
  { name: 'Email Service', passed: true, message: 'Email provider configured' },
  { name: 'AI Service', passed: true, message: 'AI provider configured' },
  { name: 'Feature Flags', passed: true, message: 'Kill switches available' },
  { name: 'Truth Layer', passed: true, message: 'Compliance system active' },
];

export default function SoftLaunchPage() {
  const [clients, setClients] = useState<SoftLaunchClient[]>(mockClients);
  const [summary, setSummary] = useState<RolloutSummary>(mockSummary);
  const [readinessChecks, setReadinessChecks] = useState<ReadinessCheck[]>(mockReadinessChecks);
  const [loading, setLoading] = useState(false);

  // KPI targets
  const kpiTargets = {
    time_to_first_value: '24 hours',
    time_to_first_strategy_pack: '72 hours',
    trial_completion_rate: '80%',
    day_30_engagement: 70,
    day_60_momentum: 75,
    day_90_transformation: 80,
  };

  const handleViewClient = (clientId: string) => {
    // Navigate to client details
    console.log('View client:', clientId);
  };

  const handleToggleKillSwitch = async (clientId: string, active: boolean) => {
    setClients(prev =>
      prev.map(c =>
        c.id === clientId ? { ...c, kill_switch_active: active } : c
      )
    );
  };

  const allChecksPass = readinessChecks.every(c => c.passed);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Soft Launch Control Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage your first 1-5 clients through controlled rollout
          </p>
        </div>
        <Badge
          variant={allChecksPass ? 'default' : 'destructive'}
          className="text-lg px-4 py-2"
        >
          {allChecksPass ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Launch Ready
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Not Ready
            </>
          )}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Main Tracker */}
            <SoftLaunchTracker
              clients={clients}
              summary={summary}
              maxClients={5}
              onViewClient={handleViewClient}
              onToggleKillSwitch={handleToggleKillSwitch}
            />

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Launch Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{summary.total_clients}/5</div>
                    <div className="text-xs text-muted-foreground">Capacity</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-success-500">
                      {Math.round(summary.avg_momentum)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-info-500">
                      {summary.by_state.trial_active}
                    </div>
                    <div className="text-xs text-muted-foreground">In Trial</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-success-500">
                      {summary.by_state.stabilized}
                    </div>
                    <div className="text-xs text-muted-foreground">Stabilized</div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Risk</span>
                      <Badge variant="outline" className="bg-success-50 text-success-600">
                        {summary.by_risk.low}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium Risk</span>
                      <Badge variant="outline" className="bg-warning-50 text-warning-600">
                        {summary.by_risk.medium}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High Risk</span>
                      <Badge variant="outline" className="bg-accent-50 text-accent-600">
                        {summary.by_risk.high}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Critical</span>
                      <Badge variant="outline" className="bg-error-50 text-error-600">
                        {summary.by_risk.critical}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Readiness Tab */}
        <TabsContent value="readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                System Readiness Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readinessChecks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {check.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-success-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-error-500" />
                      )}
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-muted-foreground">{check.message}</div>
                      </div>
                    </div>
                    <Badge variant={check.passed ? 'default' : 'destructive'}>
                      {check.passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Activation KPI Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    Time to First Value
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.time_to_first_value}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Time to First Strategy Pack
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.time_to_first_strategy_pack}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Trial Completion Rate
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.trial_completion_rate}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Day 30 Engagement
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.day_30_engagement}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Day 60 Momentum
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.day_60_momentum}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    Day 90 Transformation
                  </div>
                  <div className="text-2xl font-bold">{kpiTargets.day_90_transformation}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Honest Expectations */}
          <Card className="border-info-200 bg-info-50 dark:bg-info-900/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-info-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-info-900 dark:text-info-100">
                    Truth Layer Reminder
                  </h4>
                  <p className="text-sm text-info-800 dark:text-info-200 mt-1">
                    These KPIs measure engagement and momentum, not guaranteed outcomes.
                    Real marketing results take 90+ days. Set clear expectations with
                    each client about realistic timelines and required effort.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Onboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pre-Onboarding */}
                <div>
                  <h4 className="font-medium mb-3">Pre-Onboarding (Before Invite)</h4>
                  <div className="space-y-2">
                    {[
                      'Confirm client industry fit',
                      'Review truth-layer expectations',
                      'Prepare 90-day timeline document',
                      'Set up workspace and integrations',
                      'Generate first strategy pack draft',
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trial Period */}
                <div>
                  <h4 className="font-medium mb-3">14-Day Trial</h4>
                  <div className="space-y-2">
                    {[
                      'Day 1: Welcome call + system walkthrough',
                      'Day 3: First strategy pack review',
                      'Day 7: Week 1 check-in + adjustments',
                      'Day 10: Production content preview',
                      'Day 14: Trial completion review + activation decision',
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Activation */}
                <div>
                  <h4 className="font-medium mb-3">90-Day Activation</h4>
                  <div className="space-y-2">
                    {[
                      'Day 30: Month 1 review + milestone check',
                      'Day 45: Mid-point momentum assessment',
                      'Day 60: Month 2 review + optimization',
                      'Day 75: Pre-graduation preparation',
                      'Day 90: Graduation review + stabilization',
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
