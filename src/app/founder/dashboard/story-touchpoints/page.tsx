'use client';

/**
 * Founder Story Touchpoints Dashboard
 * Phase 75: Monitor client touchpoint status and trigger regeneration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StoryTouchpointCard } from '@/ui/components/StoryTouchpointCard';
import { TouchpointStatusTable } from '@/ui/components/StoryTouchpointList';
import { CalloutHint } from '@/ui/components/CalloutHint';
import {
  StoryTouchpoint,
  TouchpointTimeframe,
  getTouchpointFreshness,
} from '@/lib/storytelling/storyTouchpointEngine';
import {
  runWeeklyTouchpoints,
  runMonthlyTouchpoints,
  run90DayTouchpoints,
  getSoftLaunchClients,
  SchedulerRunResult,
} from '@/lib/storytelling/storyTouchpointScheduler';
import {
  generateWeeklyTouchpointForClient,
  generateMonthlyTouchpointForClient,
  generate90DayTouchpointForClient,
} from '@/lib/storytelling/storyTouchpointEngine';

interface ClientTouchpointStatus {
  client_id: string;
  client_name: string;
  weekly: StoryTouchpoint;
  monthly: StoryTouchpoint;
  ninety_day: StoryTouchpoint;
  weekly_status: string;
  monthly_status: string;
  ninety_day_status: string;
  needs_attention: boolean;
}

export default function FounderStoryTouchpointsPage() {
  const router = useRouter();
  const [clientStatuses, setClientStatuses] = useState<ClientTouchpointStatus[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<SchedulerRunResult | null>(null);

  useEffect(() => {
    loadClientStatuses();
  }, []);

  const loadClientStatuses = async () => {
    setIsLoading(true);
    try {
      const clients = getSoftLaunchClients();
      const statuses: ClientTouchpointStatus[] = [];

      for (const client of clients) {
        const weekly = generateWeeklyTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );
        const monthly = generateMonthlyTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );
        const ninetyDay = generate90DayTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );

        const weeklyStatus = getTouchpointFreshness(weekly.generated_at, 'weekly');
        const monthlyStatus = getTouchpointFreshness(monthly.generated_at, 'monthly');
        const ninetyDayStatus = getTouchpointFreshness(ninetyDay.generated_at, 'ninety_day');

        const needsAttention =
          weekly.data_status === 'limited' ||
          monthly.data_status === 'limited' ||
          weekly.story_health < 40;

        statuses.push({
          client_id: client.client_id,
          client_name: client.client_name,
          weekly,
          monthly,
          ninety_day: ninetyDay,
          weekly_status: weeklyStatus,
          monthly_status: monthlyStatus,
          ninety_day_status: ninetyDayStatus,
          needs_attention: needsAttention,
        });
      }

      setClientStatuses(statuses);
      if (statuses.length > 0) {
        setSelectedClient(statuses[0].client_id);
      }
    } catch (error) {
      console.error('Failed to load client statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBatch = async (timeframe: TouchpointTimeframe) => {
    setIsRunning(true);
    try {
      const clients = getSoftLaunchClients();
      let result: SchedulerRunResult;

      switch (timeframe) {
        case 'weekly':
          result = runWeeklyTouchpoints(clients);
          break;
        case 'monthly':
          result = runMonthlyTouchpoints(clients);
          break;
        case 'ninety_day':
          result = run90DayTouchpoints(clients);
          break;
      }

      setLastRun(result);
      // Reload statuses after run
      await loadClientStatuses();
    } catch (error) {
      console.error('Failed to run batch:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRegenerateClient = async (clientId: string, timeframe: TouchpointTimeframe) => {
    setIsRunning(true);
    try {
      // Call API to regenerate
      const client = clientStatuses.find(c => c.client_id === clientId);
      if (!client) {
return;
}

      const response = await fetch('/api/storytelling/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_single',
          workspace_id: 'ws_demo', // Would come from client data
          client_id: clientId,
          client_name: client.client_name,
          timeframe,
        }),
      });

      if (response.ok) {
        await loadClientStatuses();
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Calculate summary stats
  const totalClients = clientStatuses.length;
  const needsAttentionCount = clientStatuses.filter(c => c.needs_attention).length;
  const avgHealth = Math.round(
    clientStatuses.reduce((sum, c) => sum + c.weekly.story_health, 0) / totalClients
  );
  const staleCount = clientStatuses.filter(
    c => c.weekly_status === 'stale' || c.monthly_status === 'stale'
  ).length;

  const selectedClientData = clientStatuses.find(c => c.client_id === selectedClient);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Touchpoints</h1>
          <p className="text-muted-foreground">
            Monitor and manage client story touchpoint generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/client-stories')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Full Stories
          </Button>
          <Button
            variant="outline"
            onClick={loadClientStatuses}
            disabled={isRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{avgHealth}%</p>
                <p className="text-xs text-muted-foreground">Avg Health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={staleCount > 0 ? 'border-yellow-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className={`h-8 w-8 ${staleCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{staleCount}</p>
                <p className="text-xs text-muted-foreground">Stale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={needsAttentionCount > 0 ? 'border-orange-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${needsAttentionCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{needsAttentionCount}</p>
                <p className="text-xs text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch run controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generate Touchpoints</CardTitle>
          <CardDescription>
            Run touchpoint generation for all soft-launch clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleRunBatch('weekly')}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Weekly
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRunBatch('monthly')}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Monthly
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRunBatch('ninety_day')}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              Run 90-Day
            </Button>
          </div>

          {/* Last run result */}
          {lastRun && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">
                Last run: {lastRun.timeframe} touchpoints
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {lastRun.success_count} success, {lastRun.failed_count} failed
                <span className="mx-2">•</span>
                {new Date(lastRun.completed_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client status table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Client Touchpoint Status</CardTitle>
        </CardHeader>
        <CardContent>
          <TouchpointStatusTable
            clients={clientStatuses.map(c => ({
              client_id: c.client_id,
              client_name: c.client_name,
              weekly_status: c.weekly_status,
              monthly_status: c.monthly_status,
              ninety_day_status: c.ninety_day_status,
              needs_attention: c.needs_attention,
            }))}
            onRegenerate={handleRegenerateClient}
          />
        </CardContent>
      </Card>

      {/* Selected client detail */}
      {selectedClientData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {selectedClientData.client_name} - Latest Touchpoints
              </CardTitle>
              <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientStatuses.map((client) => (
                    <SelectItem key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StoryTouchpointCard
                touchpoint={selectedClientData.weekly}
                onView={() => router.push('/founder/dashboard/client-stories')}
                onRegenerate={() => handleRegenerateClient(selectedClientData.client_id, 'weekly')}
              />
              <StoryTouchpointCard
                touchpoint={selectedClientData.monthly}
                onView={() => router.push('/founder/dashboard/client-stories')}
                onRegenerate={() => handleRegenerateClient(selectedClientData.client_id, 'monthly')}
              />
              <StoryTouchpointCard
                touchpoint={selectedClientData.ninety_day}
                onView={() => router.push('/founder/dashboard/client-stories')}
                onRegenerate={() => handleRegenerateClient(selectedClientData.client_id, 'ninety_day')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to alignment */}
      <CalloutHint
        variant="explore"
        title="View Client Alignment"
        description="See how clients are progressing across all dimensions"
        actionLabel="Open Alignment"
        onAction={() => router.push('/founder/dashboard/alignment')}
      />
    </div>
  );
}
