'use client';

/**
 * Performance Reality Console
 * Phase 81: Main performance reality dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  RefreshCw,
  Settings,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PerformanceRealityStrip } from '@/components/performanceReality/PerformanceRealityStrip';
import { AttributionBreakdownCard } from '@/components/performanceReality/AttributionBreakdownCard';
import { FalseSignalWarning } from '@/components/performanceReality/FalseSignalWarning';
import { ExternalContextCard } from '@/components/performanceReality/ExternalContextCard';
import { PerformanceRealitySnapshotList } from '@/components/performanceReality/PerformanceRealitySnapshotList';
import {
  PerformanceRealitySnapshot,
  RealityScope,
} from '@/lib/performanceReality';

export default function PerformanceRealityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshots, setSnapshots] = useState<PerformanceRealitySnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<PerformanceRealitySnapshot | null>(null);
  const [selectedScope, setSelectedScope] = useState<RealityScope>('global');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load snapshots
      const res = await fetch('/api/performance-reality/snapshots?limit=10');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.data || []);
        if (data.data && data.data.length > 0) {
          setLatestSnapshot(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/performance-reality/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: selectedScope }),
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
              <Activity className="h-6 w-6" />
              Performance Reality
            </h1>
            <p className="text-muted-foreground">
              Understand the gap between perceived and true performance
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {(['global', 'client', 'channel', 'campaign'] as RealityScope[]).map((scope) => (
              <Button
                key={scope}
                variant={selectedScope === scope ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedScope(scope)}
                className="capitalize"
              >
                {scope}
              </Button>
            ))}
          </div>
          <Button onClick={handleGenerateSnapshot} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate
          </Button>
        </div>
      </div>

      {/* Reality Strip */}
      <PerformanceRealityStrip scope={selectedScope} />

      {/* Main content */}
      {latestSnapshot ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Attribution */}
          <div className="lg:col-span-2 space-y-6">
            <AttributionBreakdownCard breakdown={latestSnapshot.attribution_breakdown} />

            <FalseSignalWarning
              falsePositiveRisk={latestSnapshot.false_positive_risk}
              falseNegativeRisk={latestSnapshot.false_negative_risk}
              perceivedScore={latestSnapshot.perceived_score}
              trueScore={latestSnapshot.true_score}
            />

            {/* Score comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Score Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {Math.round(latestSnapshot.perceived_score)}
                    </p>
                    <p className="text-xs text-muted-foreground">Perceived</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(latestSnapshot.true_score)}
                    </p>
                    <p className="text-xs text-muted-foreground">True</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {latestSnapshot.confidence_low}-{latestSnapshot.confidence_high}
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence Band</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Completeness</span>
                    <span>{Math.round(latestSnapshot.data_completeness * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Model Version</span>
                    <span>{latestSnapshot.model_version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - External & History */}
          <div className="space-y-6">
            <ExternalContextCard context={latestSnapshot.external_context} />
            <PerformanceRealitySnapshotList snapshots={snapshots} />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No snapshots yet. Click "Generate" to create your first performance reality analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Truth notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Performance Reality analysis is based on available data from archive events,
            campaigns, and external signals. Confidence bands reflect uncertainty from
            incomplete data. No metrics are fabricated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
