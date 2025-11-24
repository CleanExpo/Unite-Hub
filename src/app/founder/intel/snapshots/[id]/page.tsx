'use client';

/**
 * Founder Intel Snapshot Detail
 * Phase 80: View single snapshot details
 */

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Calendar,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  FounderIntelSnapshot,
  getRiskLevelDisplay,
  getOpportunityLevelDisplay,
} from '@/lib/founderIntel/founderIntelTypes';
import { FounderIntelTruthBadge } from '@/components/founderIntel/FounderIntelTruthBadge';

export default function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<FounderIntelSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSnapshot();
  }, [id]);

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/founder-intel/snapshots/${id}`);
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

  const riskDisplay = getRiskLevelDisplay(snapshot.risk_level);
  const oppDisplay = getOpportunityLevelDisplay(snapshot.opportunity_level);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {snapshot.title}
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
        <FounderIntelTruthBadge
          confidenceScore={snapshot.confidence_score}
          completenessScore={snapshot.data_completeness_score}
        />
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={riskDisplay.color}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Risk: {riskDisplay.label}
        </Badge>
        {snapshot.opportunity_level !== 'none' && (
          <Badge variant="outline" className={oppDisplay.color}>
            <Lightbulb className="h-3 w-3 mr-1" />
            Opportunities: {oppDisplay.label}
          </Badge>
        )}
        <Badge variant="outline">{snapshot.scope}</Badge>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap text-sm bg-transparent p-0">
              {snapshot.summary_markdown}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {snapshot.intelligence_json && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(snapshot.intelligence_json.metrics || {}).map(
                ([key, value]) => (
                  <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{String(value)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeframe */}
      {snapshot.timeframe_start && snapshot.timeframe_end && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Timeframe:</strong>{' '}
              {new Date(snapshot.timeframe_start).toLocaleDateString('en-AU')} -{' '}
              {new Date(snapshot.timeframe_end).toLocaleDateString('en-AU')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data sources */}
      {snapshot.intelligence_json?.sources && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(snapshot.intelligence_json.sources as string[]).map((source) => (
                <Badge key={source} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
