'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface LearningRun {
  id: string;
  runType: string;
  patternsCollected: number;
  benchmarksUpdated: number;
  cohortsProcessed: number;
  insightsDistributed: number;
  tibeValidationsPassed: number;
  tibeValidationsFailed: number;
  confidence: number;
  status: string;
  startedAt: string;
  completedAt?: string;
}

export default function LearningLoopPage() {
  const [runs, setRuns] = useState<LearningRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/cross-tenant/learning', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
      setLoading(false);
    }

    fetchRuns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'secondary';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Global Multi-Tenant Learning Loop</h1>
        <Badge variant="outline">Phase 148</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Learning loop results depend on cross-tenant data availability.
          All insights validated through TIBE before distribution to individual tenants.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Learning Loop Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading runs...</p>
          ) : runs.length === 0 ? (
            <p className="text-muted-foreground">No learning runs recorded</p>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <div key={run.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{run.runType} run</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(run.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {run.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Patterns: {run.patternsCollected}</div>
                    <div>Benchmarks: {run.benchmarksUpdated}</div>
                    <div>Cohorts: {run.cohortsProcessed}</div>
                    <div>Insights: {run.insightsDistributed}</div>
                    <div className="text-success-600">TIBE Pass: {run.tibeValidationsPassed}</div>
                    <div className="text-error-600">TIBE Fail: {run.tibeValidationsFailed}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {(run.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
