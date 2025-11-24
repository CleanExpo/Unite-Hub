'use client';

/**
 * Founder Scaling Console
 * Phase 86: Scaling mode control and capacity monitoring
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gauge,
  RefreshCw,
  Play,
  Settings,
  History,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { ScalingModeOverview } from '@/components/scalingMode/ScalingModeOverview';
import { ScalingHealthScoresPanel } from '@/components/scalingMode/ScalingHealthScoresPanel';
import { ScalingModeTimeline } from '@/components/scalingMode/ScalingModeTimeline';

const ENVIRONMENT = 'production';

interface ScalingOverview {
  environment: string;
  current_mode: string;
  active_clients: number;
  safe_capacity: number;
  utilisation_percent: number;
  health_score: number;
  recommendation: string;
  last_snapshot_at?: string;
  auto_mode_enabled: boolean;
}

interface ScalingSnapshot {
  id: string;
  created_at: string;
  current_mode: string;
  active_clients: number;
  safe_capacity: number;
  utilisation_ratio: number;
  infra_health_score: number;
  ai_cost_pressure_score: number;
  warning_density_score: number;
  churn_risk_score: number;
  overall_scaling_health_score: number;
  recommendation: string;
  summary_markdown: string;
}

export default function FounderScalingModePage() {
  const [overview, setOverview] = useState<ScalingOverview | null>(null);
  const [snapshots, setSnapshots] = useState<ScalingSnapshot[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, snapshotsRes, historyRes] = await Promise.all([
        fetch(`/api/scaling-mode/health?environment=${ENVIRONMENT}&type=overview`),
        fetch(`/api/scaling-mode/health?environment=${ENVIRONMENT}&limit=10`),
        fetch(`/api/scaling-mode/history?environment=${ENVIRONMENT}&limit=20`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }

      if (snapshotsRes.ok) {
        const data = await snapshotsRes.json();
        setSnapshots(data.data || []);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSnapshot = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/scaling-mode/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: ENVIRONMENT }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to generate snapshot:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAutoMode = async (enabled: boolean) => {
    try {
      await fetch('/api/scaling-mode/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: ENVIRONMENT,
          action: 'set_auto_mode',
          enabled,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to toggle auto mode:', error);
    }
  };

  const latestSnapshot = snapshots[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="h-6 w-6" />
            Scaling Mode Control
          </h1>
          <p className="text-muted-foreground">
            Capacity monitoring and scaling recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={generateSnapshot} disabled={isGenerating}>
            <Play className="h-4 w-4 mr-2" />
            Generate Snapshot
          </Button>
        </div>
      </div>

      {/* Auto Mode Control */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Auto Mode Switching</span>
              <Badge variant="outline" className="text-[10px]">
                {overview?.auto_mode_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Switch
              checked={overview?.auto_mode_enabled || false}
              onCheckedChange={toggleAutoMode}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            When enabled, the system can automatically recommend and apply safe scaling mode changes
            based on health scores and thresholds.
          </p>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      {overview && latestSnapshot && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScalingModeOverview
            currentMode={overview.current_mode}
            activeClients={overview.active_clients}
            safeCapacity={overview.safe_capacity}
            utilisationPercent={overview.utilisation_percent}
            recommendation={overview.recommendation}
          />

          <ScalingHealthScoresPanel
            infraHealth={latestSnapshot.infra_health_score}
            aiCostPressure={latestSnapshot.ai_cost_pressure_score}
            warningDensity={latestSnapshot.warning_density_score}
            churnRisk={latestSnapshot.churn_risk_score}
            overallHealth={latestSnapshot.overall_scaling_health_score}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Timeline
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {history.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Snapshots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <ScalingModeTimeline events={history} />
        </TabsContent>

        <TabsContent value="snapshots">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {snapshots.map(snapshot => (
                  <div
                    key={snapshot.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{snapshot.current_mode}</Badge>
                        <span className="text-sm font-medium">
                          Health: {snapshot.overall_scaling_health_score.toFixed(0)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(snapshot.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Clients: {snapshot.active_clients}/{snapshot.safe_capacity} |
                      Recommendation: {snapshot.recommendation}
                    </div>
                  </div>
                ))}

                {snapshots.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No snapshots yet. Click "Generate Snapshot" to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Phase 86:</strong> The Scaling Mode Control engine monitors capacity and
              recommends mode changes. It does not automatically block onboarding or posting
              yet - recommendations are advisory only.
            </p>
            <p className="mt-2">
              All metrics are derived from actual system telemetry. No numbers are estimated
              or projected by AI.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
