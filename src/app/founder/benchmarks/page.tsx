'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface BenchmarkBand {
  id: string;
  metricName: string;
  cohortId?: string;
  p25Value: number;
  p50Value: number;
  p75Value: number;
  p90Value: number;
  sampleSize: number;
  confidence: number;
  calculatedAt: string;
}

export default function BenchmarksPage() {
  const [bands, setBands] = useState<BenchmarkBand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBands() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/cross-tenant/benchmarks', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBands(data.bands || []);
      }
      setLoading(false);
    }

    fetchBands();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cross-Tenant Benchmark Engine</h1>
        <Badge variant="outline">Phase 143</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Benchmarks show percentile bands only. No absolute numbers exposed.
          Benchmarks disabled when cohort too small to preserve anonymity.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Benchmark Percentile Bands</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading benchmarks...</p>
          ) : bands.length === 0 ? (
            <p className="text-muted-foreground">No benchmarks available</p>
          ) : (
            <div className="space-y-4">
              {bands.map((band) => (
                <div key={band.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-medium">{band.metricName}</p>
                    <Badge variant="outline">n={band.sampleSize}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">P25</p>
                      <p>{band.p25Value.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">P50</p>
                      <p>{band.p50Value.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">P75</p>
                      <p>{band.p75Value.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">P90</p>
                      <p>{band.p90Value.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {(band.confidence * 100).toFixed(0)}%
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
