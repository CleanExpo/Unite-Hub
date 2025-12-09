'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { NormalizationSnapshot } from '@/lib/performanceNormalizer';

export default function PerformanceNormalizationPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<NormalizationSnapshot[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
fetchData();
}
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}
      const response = await fetch(`/api/performance/normalized?tenantId=${currentOrganization?.org_id || ''}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
 console.error('Failed:', error); 
} finally {
 setLoading(false); 
}
  };

  if (loading) {
return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
}

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-8 w-8" />Performance Normalization</h1>
        <p className="text-muted-foreground mt-1">Normalized performance comparisons</p>
      </div>
      {snapshots.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Normalization Data</h3><p className="text-muted-foreground">Performance normalization has not been applied yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Scope: {snapshot.scope}</CardTitle>
                  <Badge variant="outline">Confidence: {(snapshot.confidence * 100).toFixed(0)}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-xs font-medium mb-2">Raw Metrics</div>{Object.entries(snapshot.rawMetrics).map(([k, v]) => <div key={k} className="text-xs text-muted-foreground">{k}: {(v as number).toFixed(2)}</div>)}</div>
                  <div><div className="text-xs font-medium mb-2">Adjusted Metrics</div>{Object.entries(snapshot.adjustedMetrics).map(([k, v]) => <div key={k} className="text-xs">{k}: {(v as number).toFixed(2)}</div>)}</div>
                </div>
                {snapshot.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{snapshot.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Normalization Transparency</div><p>Normalization does not fabricate better results. All adjustments transparent and reversible. Both raw and adjusted values shown.</p></div></div></CardContent></Card>
    </div>
  );
}
