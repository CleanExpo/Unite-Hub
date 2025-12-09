'use client';

/**
 * Founder Posting Execution Console
 * Phase 87: Cross-Channel Publishing Execution Layer
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { PreflightTable } from '@/components/postingExecution/PreflightTable';
import { ExecutionHistoryTable } from '@/components/postingExecution/ExecutionHistoryTable';
import { RollbackTable } from '@/components/postingExecution/RollbackTable';
import { useAuth } from '@/contexts/AuthContext';

interface ExecutionStats {
  total: number;
  success: number;
  failed: number;
  rolledBack: number;
  pending: number;
}

interface SchedulerStatus {
  pending: number;
  processing: number;
  blocked: number;
  completedToday: number;
  failedToday: number;
}

export default function FounderPostingExecutionPage() {
  const { currentOrganization, loading: authLoading } = useAuth();
  const router = useRouter();
  const workspaceId = currentOrganization?.org_id;

  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [preflights, setPreflights] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [rollbacks, setRollbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect to login if no workspace after auth loads
  useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.push('/login');
    }
  }, [authLoading, workspaceId, router]);

  useEffect(() => {
    if (workspaceId) {
      loadDashboardData();
    }
  }, [workspaceId]);

  const loadDashboardData = async () => {
    if (!workspaceId) {
return;
}
    setIsLoading(true);
    try {
      const [statsRes, schedulerRes, preflightsRes, executionsRes, rollbacksRes] = await Promise.all([
        fetch(`/api/posting-execution/execute?workspaceId=${workspaceId}&type=stats`),
        fetch(`/api/posting-execution/scheduler?workspaceId=${workspaceId}&type=status`),
        fetch(`/api/posting-execution/preflight?workspaceId=${workspaceId}&limit=20`),
        fetch(`/api/posting-execution/execute?workspaceId=${workspaceId}&limit=20`),
        fetch(`/api/posting-execution/rollback?workspaceId=${workspaceId}&limit=20`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      if (schedulerRes.ok) {
        const data = await schedulerRes.json();
        setSchedulerStatus(data.data);
      }

      if (preflightsRes.ok) {
        const data = await preflightsRes.json();
        setPreflights(data.data || []);
      }

      if (executionsRes.ok) {
        const data = await executionsRes.json();
        setExecutions(data.data || []);
      }

      if (rollbacksRes.ok) {
        const data = await rollbacksRes.json();
        setRollbacks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSchedules = async () => {
    if (!workspaceId) {
return;
}
    setIsProcessing(true);
    try {
      const res = await fetch('/api/posting-execution/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          workspaceId,
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to process schedules:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async (executionId: string) => {
    try {
      await fetch('/api/posting-execution/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry',
          executionId,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleRollback = async (executionId: string) => {
    const reason = prompt('Enter rollback reason:');
    if (!reason) {
return;
}

    try {
      await fetch('/api/posting-execution/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionId,
          reason,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  // Show loading while auth is being determined
  if (authLoading || !workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6" />
            Posting Execution Console
          </h1>
          <p className="text-muted-foreground">
            Cross-channel publishing with preflight, execution, and rollback
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={processSchedules} disabled={isProcessing}>
            <Play className="h-4 w-4 mr-2" />
            Process Due Schedules
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{stats?.success || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed</span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{stats?.failed || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rolled Back</span>
              <RotateCcw className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats?.rolledBack || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats?.pending || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler Status */}
      {schedulerStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{schedulerStatus.pending}</Badge>
                <span className="text-sm text-muted-foreground">Due</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{schedulerStatus.processing}</Badge>
                <span className="text-sm text-muted-foreground">Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{schedulerStatus.blocked}</Badge>
                <span className="text-sm text-muted-foreground">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">{schedulerStatus.completedToday}</Badge>
                <span className="text-sm text-muted-foreground">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{schedulerStatus.failedToday}</Badge>
                <span className="text-sm text-muted-foreground">Failed Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Executions
            {executions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {executions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preflights" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Preflights
            {preflights.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {preflights.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rollbacks" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Rollbacks
            {rollbacks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {rollbacks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executions">
          <ExecutionHistoryTable
            executions={executions}
            onRetry={handleRetry}
            onRollback={handleRollback}
          />
        </TabsContent>

        <TabsContent value="preflights">
          <PreflightTable preflights={preflights} />
        </TabsContent>

        <TabsContent value="rollbacks">
          <RollbackTable rollbacks={rollbacks} />
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Phase 87:</strong> Cross-Channel Publishing Execution Layer provides
              real posting capability with 7-point preflight validation, channel-specific
              execution, and rollback support for supported platforms.
            </p>
            <p className="mt-2">
              All executions are audited. Rollback is available for FB, LinkedIn, X, Reddit,
              YouTube, and GMB. Instagram, TikTok, and Email do not support programmatic deletion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
