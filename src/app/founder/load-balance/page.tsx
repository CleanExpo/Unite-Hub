'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LoadSnapshot } from '@/lib/loadBalancer';

export default function LoadBalancerPage() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<LoadSnapshot[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/load/snapshots', {
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

  const getLoadColor = (load: number) => {
    if (load >= 0.8) return 'text-red-600';
    if (load >= 0.6) return 'text-amber-600';
    return 'text-green-600';
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
          <Scale className="h-8 w-8" />
          Cognitive Load Balancer
        </h1>
        <p className="text-muted-foreground mt-1">
          Region and tenant-aware load distribution
        </p>
      </div>

      {/* Snapshots */}
      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Load Snapshots</h3>
            <p className="text-muted-foreground">
              Cognitive load balancing has not generated any snapshots yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getLoadColor(snapshot.overallLoad)}`}>
                      {(snapshot.overallLoad * 100).toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground font-normal">overall load</span>
                  </CardTitle>
                  <Badge variant={snapshot.overallLoad >= 0.8 ? 'destructive' : 'outline'}>
                    {snapshot.overallLoad >= 0.8 ? 'High' : snapshot.overallLoad >= 0.6 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Load Vector */}
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(snapshot.loadVector).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        <span>{((value as number) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={(value as number) * 100}
                        className={`h-1.5 ${(value as number) >= 0.8 ? '[&>div]:bg-red-500' : (value as number) >= 0.6 ? '[&>div]:bg-amber-500' : ''}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {snapshot.recommendedActions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      Recommended Actions
                    </div>
                    <ul className="space-y-1">
                      {snapshot.recommendedActions.map((action, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                          {action}
                        </li>
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

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Load Estimation Notice</div>
              <p>
                Load metrics are estimates based on available signals. Actual
                system performance may vary. Recommendations should be validated
                against real-world conditions before implementation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
