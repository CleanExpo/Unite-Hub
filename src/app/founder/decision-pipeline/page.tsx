'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Workflow, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PipelineSnapshot } from '@/lib/loadAwarePipeline';

export default function DecisionPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<PipelineSnapshot[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/decisions/pipeline', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Workflow className="h-8 w-8" />
          Decision Pipeline
        </h1>
        <p className="text-muted-foreground mt-1">
          Load-aware decision flow management
        </p>
      </div>

      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pipeline Snapshots</h3>
            <p className="text-muted-foreground">
              Decision pipeline analysis has not been performed yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pipeline Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(snapshot.loadState).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key} Load</span>
                        <span>{((value as number) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={(value as number) * 100}
                        className={`h-1.5 ${(value as number) >= 0.8 ? '[&>div]:bg-error-500' : (value as number) >= 0.6 ? '[&>div]:bg-warning-500' : ''}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-lg font-bold">{snapshot.decisionVolume.pending}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-lg font-bold">{snapshot.decisionVolume.processing}</div>
                    <div className="text-xs text-muted-foreground">Processing</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-lg font-bold">{snapshot.decisionVolume.completed}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-lg font-bold text-error-600">{snapshot.decisionVolume.dropped}</div>
                    <div className="text-xs text-muted-foreground">Dropped</div>
                  </div>
                </div>

                {snapshot.throttlingRecommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1 mb-2">
                      <Zap className="h-4 w-4" />
                      Throttling Recommendations
                    </div>
                    <ul className="space-y-1">
                      {snapshot.throttlingRecommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {snapshot.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {snapshot.uncertaintyNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="text-sm text-warning-800 dark:text-warning-200">
              <div className="font-medium mb-1">Pipeline Transparency</div>
              <p>
                All throttling and dropped decisions are visible here.
                Load-driven behavior changes are transparent to founders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
