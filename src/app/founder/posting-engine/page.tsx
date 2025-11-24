'use client';

/**
 * Founder Posting Engine Control Panel
 * Phase 85: Control and monitor AMPE
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  RefreshCw,
  Play,
  Power,
  FileText,
  Shield,
  Link2,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { PostingAttemptTable } from '@/components/posting/PostingAttemptTable';
import { PostingChannelStatus } from '@/components/posting/PostingChannelStatus';

// Demo workspace ID
const DEMO_WORKSPACE_ID = 'demo-workspace';

interface PostingEngineOverview {
  total_attempts: number;
  published_count: number;
  draft_count: number;
  blocked_count: number;
  failed_count: number;
  channels_active: number;
  avg_confidence: number;
  engine_enabled: boolean;
  draft_mode: boolean;
}

interface PostingEngineConfig {
  engine_enabled: boolean;
  draft_mode_only: boolean;
  auto_publish_low_risk: boolean;
  require_approval_medium: boolean;
  require_approval_high: boolean;
  min_confidence_score: number;
  max_fatigue_score: number;
  block_during_warnings: boolean;
  max_posts_per_hour: number;
  max_posts_per_day: number;
}

export default function FounderPostingEnginePage() {
  const [overview, setOverview] = useState<PostingEngineOverview | null>(null);
  const [config, setConfig] = useState<PostingEngineConfig | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, configRes, attemptsRes] = await Promise.all([
        fetch(`/api/posting/attempts?workspaceId=${DEMO_WORKSPACE_ID}&type=overview`),
        fetch(`/api/posting/scheduler?workspaceId=${DEMO_WORKSPACE_ID}`),
        fetch(`/api/posting/attempts?workspaceId=${DEMO_WORKSPACE_ID}&limit=50`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data.data);
      }

      if (attemptsRes.ok) {
        const data = await attemptsRes.json();
        setAttempts(data.data || []);
      }

      // Mock channel data for demo
      setChannels([
        { channel: 'fb', connected: true, health: { fatigue: 0.3, momentum: 0.7 } },
        { channel: 'ig', connected: true, health: { fatigue: 0.5, momentum: 0.6 } },
        { channel: 'linkedin', connected: true, health: { fatigue: 0.2, momentum: 0.8 } },
        { channel: 'tiktok', connected: false, error: 'Not configured' },
        { channel: 'youtube', connected: false },
        { channel: 'gmb', connected: true, health: { fatigue: 0.1, momentum: 0.9 } },
        { channel: 'x', connected: false },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runPostingLoop = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/posting/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: 'run',
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to run posting loop:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleEngine = async (enabled: boolean) => {
    try {
      await fetch('/api/posting/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: enabled ? 'enable' : 'disable',
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to toggle engine:', error);
    }
  };

  const toggleDraftMode = async (enabled: boolean) => {
    try {
      await fetch('/api/posting/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: 'draft_mode',
          enabled,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to toggle draft mode:', error);
    }
  };

  const handleRetry = async (attemptId: string) => {
    try {
      await fetch('/api/posting/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: 'retry',
          attemptId,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to retry attempt:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Posting Engine
          </h1>
          <p className="text-muted-foreground">
            Autonomous multi-channel publishing control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={runPostingLoop} disabled={isRunning || !config?.engine_enabled}>
            <Play className="h-4 w-4 mr-2" />
            Run Now
          </Button>
        </div>
      </div>

      {/* Engine Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Engine Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4" />
                <span className="text-sm font-medium">Engine</span>
              </div>
              <Switch
                checked={config?.engine_enabled || false}
                onCheckedChange={toggleEngine}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Draft Mode</span>
              </div>
              <Switch
                checked={config?.draft_mode_only || true}
                onCheckedChange={toggleDraftMode}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Block Warnings</span>
              </div>
              <Switch checked={config?.block_during_warnings || true} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{overview.total_attempts}</div>
              <p className="text-xs text-muted-foreground">Total (24h)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">
                {overview.published_count}
              </div>
              <p className="text-xs text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">
                {overview.draft_count}
              </div>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-500">
                {overview.blocked_count}
              </div>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">
                {overview.failed_count}
              </div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{overview.channels_active}</div>
              <p className="text-xs text-muted-foreground">Channels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {Math.round(overview.avg_confidence * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Avg Conf</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="attempts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attempts" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Attempts
            {attempts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {attempts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Channels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attempts">
          <PostingAttemptTable
            attempts={attempts}
            onRetry={handleRetry}
            onViewDetails={id => console.log('View details:', id)}
          />
        </TabsContent>

        <TabsContent value="channels">
          <PostingChannelStatus
            channels={channels}
            onRefresh={loadDashboardData}
          />
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Phase 85 Mode:</strong> Draft mode is enabled by default. The posting
              engine creates drafts without actually publishing to social media platforms.
            </p>
            <p className="mt-2">
              All posting attempts are logged with full safety evaluations, truth notes,
              and confidence scores for transparency and audit purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
