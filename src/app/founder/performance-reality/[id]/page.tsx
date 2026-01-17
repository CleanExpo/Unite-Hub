'use client';

/**
 * Performance Reality Snapshot Detail
 * Phase 81: View single snapshot details
 */

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AttributionBreakdownCard } from '@/components/performanceReality/AttributionBreakdownCard';
import { FalseSignalWarning } from '@/components/performanceReality/FalseSignalWarning';
import { ExternalContextCard } from '@/components/performanceReality/ExternalContextCard';
import { PerformanceRealitySnapshot } from '@/lib/performanceReality';

export default function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PerformanceRealitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSnapshot();
  }, [id]);

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/performance-reality/snapshots/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.data);
      }
    } catch (error) {
      console.error('Failed to load snapshot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Snapshot not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const scoreDelta = snapshot.true_score - snapshot.perceived_score;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Reality Snapshot
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date(snapshot.created_at).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {snapshot.scope}
        </Badge>
      </div>

      {/* Score summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {Math.round(snapshot.perceived_score)}
              </p>
              <p className="text-sm text-muted-foreground">Perceived Score</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {Math.round(snapshot.true_score)}
              </p>
              <p className="text-sm text-muted-foreground">True Score</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className={`text-3xl font-bold ${
                scoreDelta > 0 ? 'text-success-500' : scoreDelta < 0 ? 'text-error-500' : ''
              }`}>
                {scoreDelta > 0 ? '+' : ''}{Math.round(scoreDelta * 10) / 10}
              </p>
              <p className="text-sm text-muted-foreground">Difference</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">
                {snapshot.confidence_low}-{snapshot.confidence_high}
              </p>
              <p className="text-sm text-muted-foreground">Confidence Band</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttributionBreakdownCard breakdown={snapshot.attribution_breakdown} />
        <ExternalContextCard context={snapshot.external_context} />
      </div>

      {/* False signal warning */}
      <FalseSignalWarning
        falsePositiveRisk={snapshot.false_positive_risk}
        falseNegativeRisk={snapshot.false_negative_risk}
        perceivedScore={snapshot.perceived_score}
        trueScore={snapshot.true_score}
      />

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Analysis Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Data Completeness</p>
              <p className="font-medium">
                {Math.round(snapshot.data_completeness * 100)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Model Version</p>
              <p className="font-medium">{snapshot.model_version}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeframe</p>
              <p className="font-medium">
                {new Date(snapshot.timeframe_start).toLocaleDateString('en-AU')} -{' '}
                {new Date(snapshot.timeframe_end).toLocaleDateString('en-AU')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Primary Driver</p>
              <p className="font-medium capitalize">
                {snapshot.attribution_breakdown.primary_driver.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Truth notice */}
      <Card className="border-info-500/30 bg-info-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-info-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            This analysis is based on {Math.round(snapshot.data_completeness * 100)}%
            of expected data sources. The confidence band ({snapshot.confidence_low}-{snapshot.confidence_high})
            reflects uncertainty in the estimate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
