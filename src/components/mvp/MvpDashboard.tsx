'use client';

/**
 * MvpDashboard Component
 * MVP Dashboard & UX Integration Layer - Phase 15 Week 5-6
 *
 * Production-polished dashboard with:
 * - 8px baseline grid spacing
 * - WCAG AA accessibility
 * - Consistent animations
 * - Skeleton loading states
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/skeleton-card';
import {
  Activity,
  Brain,
  ListTodo,
  Search,
  CreditCard,
  Zap,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserPlus,
  Mail,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

// Animation classes for consistent motion
const fadeSlideUp = 'animate-in fade-in slide-in-from-bottom-2 duration-300';
const cardHover = 'transition-all duration-200 hover:shadow-md hover:border-primary/20';

import type {
  DashboardData,
  SystemHealthData,
  StrategyEngineStatus,
  OperatorQueueSnapshot,
  IndexingHealthData,
  BillingStatusData,
} from '@/lib/services/MvpDashboardService';

// ============================================================================
// WIDGET COMPONENTS
// ============================================================================

interface WidgetProps {
  className?: string;
}

// System Health Widget
function SystemHealthCard({ data, className }: WidgetProps & { data: SystemHealthData }) {
  const statusConfig = {
    healthy: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Healthy' },
    degraded: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Degraded' },
    unhealthy: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Unhealthy' },
  };

  const config = statusConfig[data.status];
  const StatusIcon = data.status === 'healthy' ? CheckCircle2 : data.status === 'degraded' ? AlertTriangle : XCircle;

  return (
    <Card className={cn(cardHover, fadeSlideUp, className)} role="region" aria-label="System Health">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium tracking-tight">System Health</CardTitle>
        <div className={cn('p-1.5 rounded-md', config.bg)}>
          <Activity className={cn('h-4 w-4', config.color)} aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
          <span className="text-2xl font-bold tabular-nums">{data.score}%</span>
          <Badge variant="outline" className={cn('ml-auto text-xs', config.color)}>
            {config.label}
          </Badge>
        </div>
        <Progress
          value={data.score}
          className="h-2"
          aria-label={`Health score: ${data.score}%`}
        />
        <div className="space-y-2 pt-1">
          {Object.entries(data.checks).map(([key, check]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="capitalize text-muted-foreground">{key}</span>
              <Badge
                variant={check.status === 'healthy' ? 'secondary' : 'destructive'}
                className="text-xs font-medium"
              >
                {check.status}
                {check.latency && ` • ${check.latency}ms`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Strategy Engine Status Widget
function StrategyStatusCard({ data }: WidgetProps & { data: StrategyEngineStatus }) {
  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-gray-500',
    processing: 'bg-blue-500',
    error: 'bg-red-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Strategy Engine</CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-2 w-2 rounded-full ${statusColors[data.status]}`} />
          <span className="text-lg font-semibold capitalize">{data.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Active</span>
            <p className="font-medium">{data.activeTasks}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Today</span>
            <p className="font-medium">{data.completedToday}</p>
          </div>
        </div>
        {data.currentPlan && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            Current: {data.currentPlan}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Operator Queue Widget
function OperatorQueueCard({ data }: WidgetProps & { data: OperatorQueueSnapshot }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Operator Queue</CardTitle>
        <ListTodo className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-2xl font-bold">{data.queuedTasks}</p>
            <p className="text-xs text-muted-foreground">Queued</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-2xl font-bold">{data.processingTasks}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Failed: {data.failedTasks}</span>
          <span>Done today: {data.completedToday}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Indexing Health Widget
function IndexingHealthCard({ data }: WidgetProps & { data: IndexingHealthData }) {
  const statusColors = {
    healthy: 'text-green-500',
    indexing: 'text-blue-500',
    stale: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Indexing Status</CardTitle>
        <Search className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-lg font-semibold capitalize ${statusColors[data.status]}`}>
            {data.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Documents</span>
            <span className="font-medium">{data.documentsIndexed.toLocaleString()}</span>
          </div>
          {data.pendingDocuments > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">{data.pendingDocuments}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Billing Status Widget
function BillingStatusCard({ data }: WidgetProps & { data: BillingStatusData }) {
  const getUsagePercent = (used: number, limit: number) => Math.round((used / limit) * 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Billing Status</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold">{data.plan}</span>
          <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
            {data.status}
          </Badge>
        </div>
        <div className="space-y-2">
          {Object.entries(data.usage).map(([key, usage]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span>{usage.used}/{usage.limit}</span>
              </div>
              <Progress value={getUsagePercent(usage.used, usage.limit)} className="h-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Actions Widget
function QuickActionsCard({ className }: WidgetProps) {
  const actions = [
    { icon: UserPlus, label: 'Add Contact', href: '/dashboard/contacts/new' },
    { icon: Mail, label: 'Send Email', href: '/dashboard/campaigns' },
    { icon: Megaphone, label: 'New Campaign', href: '/dashboard/campaigns/new' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Button key={action.label} variant="outline" size="sm" className="justify-start" asChild>
              <a href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

interface MvpDashboardProps {
  className?: string;
}

export function MvpDashboard({ className }: MvpDashboardProps) {
  const { session, currentOrganization } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const workspaceId = currentOrganization?.org_id;

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token || !workspaceId) return;

    try {
      const response = await fetch(`/api/mvp/dashboard?workspaceId=${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, workspaceId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className={className}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System overview and quick actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Onboarding Banner */}
      {!data.onboarding.completed && data.onboarding.percentComplete < 100 && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Complete your setup</p>
                <p className="text-sm text-muted-foreground">
                  {data.onboarding.percentComplete}% complete - Step {data.onboarding.currentStep} of {data.onboarding.totalSteps}
                </p>
              </div>
              <Button size="sm" asChild>
                <a href="/onboarding">Continue</a>
              </Button>
            </div>
            <Progress value={data.onboarding.percentComplete} className="h-1 mt-2" />
          </CardContent>
        </Card>
      )}

      {/* Widgets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SystemHealthCard data={data.systemHealth} />
        <StrategyStatusCard data={data.strategyEngine} />
        <OperatorQueueCard data={data.operatorQueue} />
        <IndexingHealthCard data={data.indexingHealth} />
        <BillingStatusCard data={data.billingStatus} />
        <QuickActionsCard />
      </div>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-2 rounded ${
                    notification.is_read ? 'opacity-60' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    )}
                  </div>
                  {notification.action_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={notification.action_url}>{notification.action_label || 'View'}</a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MvpDashboard;
