'use client';

/**
 * Founder Agent Console
 * Phase 83: Central command for managing client operations agent
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  RefreshCw,
  ArrowLeft,
  Play,
  Settings,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AgentOverviewStats } from '@/components/clientAgent/AgentOverviewStats';
import { AgentRunHistory } from '@/components/clientAgent/AgentRunHistory';
import { PolicyEditor } from '@/components/clientAgent/PolicyEditor';
import { SafetyBanner } from '@/components/clientAgent/SafetyBanner';
import { SuggestedActionsCard } from '@/components/clientAgent/SuggestedActionsCard';

// Demo workspace ID - would come from auth context in production
const DEMO_WORKSPACE_ID = 'demo-workspace';

export default function AgentConsolePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load overview
      const overviewRes = await fetch(
        `/api/client-agent/scheduler?workspaceId=${DEMO_WORKSPACE_ID}&type=overview`
      );
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }

      // Load pending actions
      const actionsRes = await fetch(
        `/api/client-agent/actions?workspaceId=${DEMO_WORKSPACE_ID}&status=pending`
      );
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setPendingActions(data.data || []);
      }

      // Load action history
      const historyRes = await fetch(
        `/api/client-agent/actions?workspaceId=${DEMO_WORKSPACE_ID}&limit=20`
      );
      if (historyRes.ok) {
        const data = await historyRes.json();
        setActionHistory(data.data || []);
      }

      // Load default policy
      const policyRes = await fetch(
        `/api/client-agent/policies?workspaceId=${DEMO_WORKSPACE_ID}`
      );
      if (policyRes.ok) {
        const data = await policyRes.json();
        setPolicy(data.data?.[0] || getDefaultPolicy());
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runEvaluation = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/client-agent/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: DEMO_WORKSPACE_ID,
          action: 'run_evaluation',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `Evaluation complete:\n` +
          `- Clients evaluated: ${data.data.clients_evaluated}\n` +
          `- Actions proposed: ${data.data.actions_proposed}\n` +
          `- Actions executed: ${data.data.actions_executed}`
        );
        await loadData();
      }
    } catch (error) {
      console.error('Failed to run evaluation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const approveAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/client-agent/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          approval_status: 'approved_executed',
        }),
      });

      if (res.ok) {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
        await loadData();
      }
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const rejectAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/client-agent/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          approval_status: 'rejected',
        }),
      });

      if (res.ok) {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  };

  const savePolicy = async (updates: any) => {
    try {
      const res = await fetch('/api/client-agent/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: DEMO_WORKSPACE_ID,
          ...updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPolicy(data.data);
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  const getDefaultPolicy = () => ({
    id: 'default',
    agent_enabled: true,
    allowed_actions: ['send_followup', 'update_status', 'add_tag', 'schedule_task', 'generate_content'],
    auto_exec_enabled: true,
    auto_exec_risk_threshold: 'low',
    max_actions_per_day: 10,
    require_human_review_above_score: 70,
    respect_early_warnings: true,
    pause_on_high_severity_warning: true,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/founder/intel')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Agent Operations Console
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage the safety-caged client operations agent
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={runEvaluation} disabled={isRunning}>
            <Play className={`h-4 w-4 mr-2`} />
            {isRunning ? 'Running...' : 'Run Evaluation'}
          </Button>
        </div>
      </div>

      {/* Safety banner */}
      {overview && (
        <SafetyBanner
          warningsCount={overview.clients_with_warnings}
          highWarningsCount={overview.clients_with_warnings > 3 ? overview.clients_with_warnings - 3 : 0}
          safetyInfo={{
            total_risk_score: overview.avg_risk_score,
            actions_auto_executed: overview.auto_executed_today,
            actions_awaiting_approval: overview.awaiting_approval,
            early_warning_active: overview.clients_with_warnings > 0,
            truth_compliance: overview.truth_compliance_avg,
            disclaimers: [],
          }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pending
            {pendingActions.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px]">
                {pendingActions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-3 w-3" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {overview && <AgentOverviewStats overview={overview} />}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <SuggestedActionsCard
            actions={pendingActions.map(a => ({
              id: a.id,
              action_type: a.action_type,
              description: a.agent_reasoning || '',
              risk_level: a.risk_level,
              confidence_score: a.confidence_score,
            }))}
            onApprove={approveAction}
            onReject={rejectAction}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AgentRunHistory actions={actionHistory} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          {policy && (
            <PolicyEditor
              policy={policy}
              onSave={savePolicy}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
