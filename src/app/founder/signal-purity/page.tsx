'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Filter, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PuritySnapshot } from '@/lib/signalPurity';

export default function SignalPurityPage() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<PuritySnapshot[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/signal-purity/snapshots', {
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
          <Filter className="h-8 w-8" />
          Signal Purity Engine
        </h1>
        <p className="text-muted-foreground mt-1">
          Noise filtering and bias detection for all engine signals
        </p>
      </div>

      {snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Purity Snapshots</h3>
            <p className="text-muted-foreground">
              Signal purity analysis has not been performed yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{snapshot.sourceEngine}</CardTitle>
                  <Badge variant={snapshot.purityScore >= 0.7 ? 'default' : 'destructive'}>
                    {(snapshot.purityScore * 100).toFixed(0)}% pure
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Purity Score</span>
                    <span>{(snapshot.purityScore * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={snapshot.purityScore * 100} className="h-2" />
                </div>

                {snapshot.noiseFactors.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Noise Factors</div>
                    {snapshot.noiseFactors.map((factor, i) => (
                      <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <Shield className="h-3 w-3 mt-1" />
                        <span>{factor.description} ({factor.type})</span>
                      </div>
                    ))}
                  </div>
                )}

                {snapshot.biasFlags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Bias Flags</div>
                    {snapshot.biasFlags.map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{flag.type}</Badge>
                        <span className="text-sm text-muted-foreground">{flag.description}</span>
                      </div>
                    ))}
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

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Purity Analysis Notice</div>
              <p>
                Purity scores indicate signal cleanliness but cannot guarantee
                absence of all noise or bias. Low purity signals should reduce
                confidence in downstream decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
