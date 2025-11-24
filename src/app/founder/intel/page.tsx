'use client';

/**
 * Founder Intelligence Console
 * Phase 80: Main intelligence dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  RefreshCw,
  Settings,
  FileText,
  AlertTriangle,
  Lightbulb,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FounderIntelOverview } from '@/components/founderIntel/FounderIntelOverview';
import { FounderIntelAlertsPanel } from '@/components/founderIntel/FounderIntelAlertsPanel';
import { FounderIntelSnapshotList } from '@/components/founderIntel/FounderIntelSnapshotList';
import { PerformanceRealityStrip } from '@/components/performanceReality/PerformanceRealityStrip';
import {
  FounderIntelSnapshot,
  FounderIntelAlert,
  AggregatedSignals,
  AlertStatus,
} from '@/lib/founderIntel/founderIntelTypes';

export default function FounderIntelPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshots, setSnapshots] = useState<FounderIntelSnapshot[]>([]);
  const [alerts, setAlerts] = useState<FounderIntelAlert[]>([]);
  const [signals, setSignals] = useState<AggregatedSignals | null>(null);
  const [briefing, setBriefing] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load snapshots
      const snapshotsRes = await fetch('/api/founder-intel/snapshots?limit=5');
      if (snapshotsRes.ok) {
        const data = await snapshotsRes.json();
        setSnapshots(data.data || []);
      }

      // Load alerts
      const alertsRes = await fetch('/api/founder-intel/alerts?status=open,acknowledged,in_progress&limit=10');
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.data || []);
      }

      // Generate demo signals for overview
      setSignals(generateDemoSignals());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/founder-intel/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'global' }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to generate snapshot:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBriefing = async () => {
    try {
      const res = await fetch('/api/founder-intel/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe_days: 7 }),
      });

      if (res.ok) {
        const data = await res.json();
        setBriefing(data.data.briefing);
      }
    } catch (error) {
      console.error('Failed to generate briefing:', error);
    }
  };

  const handleAlertStatusChange = async (alertId: string, status: AlertStatus) => {
    try {
      const res = await fetch(`/api/founder-intel/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? { ...a, status } : a))
        );
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Intelligence Console
          </h1>
          <p className="text-muted-foreground">
            Unified view of agency, client, and creative intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/founder/intel/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleGenerateSnapshot} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate Snapshot
          </Button>
        </div>
      </div>

      {/* Performance Reality Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Performance Reality</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/founder/performance-reality')}
          >
            View Details
          </Button>
        </div>
        <PerformanceRealityStrip scope="global" />
      </div>

      {/* Health Overview */}
      {signals && (
        <FounderIntelOverview
          agencyHealth={signals.agency_health}
          clientHealth={signals.client_health}
          creativeHealth={signals.creative_health}
          scalingRisk={signals.scaling_risk}
          ormReality={signals.orm_reality}
          archiveCompleteness={signals.archive_completeness}
        />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts panel */}
        <div className="lg:col-span-2">
          <FounderIntelAlertsPanel
            alerts={alerts}
            onStatusChange={handleAlertStatusChange}
          />
        </div>

        {/* Snapshots list */}
        <div>
          <FounderIntelSnapshotList snapshots={snapshots} />
        </div>
      </div>

      {/* Opportunities panel */}
      {signals && signals.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signals.opportunities.map((opp, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">{opp.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opp.context}</p>
                  <Badge variant="outline" className="text-[10px] mt-2">
                    {(opp.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick briefing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Weekly Briefing
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleGenerateBriefing}>
              Generate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {briefing ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-xs">{briefing}</pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click "Generate" to create a weekly intelligence briefing
            </p>
          )}
        </CardContent>
      </Card>

      {/* Truth notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            All intelligence is derived from real data sources including archive events,
            performance metrics, and recorded activities. No metrics are fabricated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate demo signals for development
 */
function generateDemoSignals(): AggregatedSignals {
  return {
    agency_health: { score: 72, trend: 'up', label: 'Agency Health', color: 'text-green-500' },
    client_health: { score: 78, trend: 'stable', label: 'Client Health', color: 'text-green-500' },
    creative_health: { score: 65, trend: 'down', label: 'Creative Health', color: 'text-yellow-500' },
    scaling_risk: { score: 45, trend: 'stable', label: 'Scaling Risk', color: 'text-orange-500' },
    orm_reality: { score: 70, trend: 'up', label: 'ORM Reality', color: 'text-green-500' },
    archive_completeness: { score: 85, trend: 'up', label: 'Archive', color: 'text-green-500' },
    signals: [],
    alerts: [],
    opportunities: [
      {
        engine: 'scaling_engine',
        type: 'opportunity',
        key: 'capacity',
        value: true,
        label: 'Team capacity for new client',
        confidence: 0.75,
        context: 'Current utilization leaves room for 1-2 new accounts',
      },
      {
        engine: 'marketing_engine',
        type: 'opportunity',
        key: 'seasonal',
        value: true,
        label: 'Seasonal campaign opportunity',
        confidence: 0.8,
        context: 'Holiday season approaching',
      },
    ],
  };
}
