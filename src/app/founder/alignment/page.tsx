'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Compass,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AlignmentSnapshot } from '@/lib/alignmentEngine';

export default function AlignmentPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<AlignmentSnapshot | null>(null);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) {
return;
}

      const response = await fetch(`/api/alignment/snapshot?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSnapshot(data.snapshot);
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
          <Compass className="h-8 w-8" />
          Strategic Alignment
        </h1>
        <p className="text-muted-foreground mt-1">
          Global alignment measurement across all systems
        </p>
      </div>

      {!snapshot ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Compass className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Alignment Snapshot</h3>
            <p className="text-muted-foreground">
              Generate an alignment snapshot to see how your systems are aligned.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Alignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Alignment</span>
                <Badge variant={snapshot.overallAlignment >= 0.7 ? 'default' : 'destructive'}>
                  {(snapshot.overallAlignment * 100).toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={snapshot.overallAlignment * 100} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {(snapshot.confidence * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Alignment Vector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alignment Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(snapshot.alignmentVector).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span>{((value as number) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={(value as number) * 100}
                    className={`h-2 ${(value as number) < 0.6 ? '[&>div]:bg-amber-500' : ''}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Misalignment Flags */}
          {snapshot.misalignmentFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Misalignment Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {snapshot.misalignmentFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        flag.severity === 'high' ? 'text-red-600' :
                        flag.severity === 'medium' ? 'text-amber-600' : 'text-gray-600'
                      }`} />
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {flag.area.replace(/_/g, ' ')}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {flag.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {snapshot.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {snapshot.uncertaintyNotes && (
            <Card className="border-muted">
              <CardContent className="py-4">
                <div className="text-xs text-muted-foreground italic">
                  {snapshot.uncertaintyNotes}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Alignment Measurement Notice</div>
              <p>
                Alignment scores are derived from system signals and may not capture
                all strategic nuances. Misalignment flags should be investigated
                before taking corrective action. Local context matters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
