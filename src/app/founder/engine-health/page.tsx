'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { EngineHealthSnapshot } from '@/lib/engineHealth';

export default function EngineHealthPage() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<EngineHealthSnapshot[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch('/api/engines/health', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Activity className="h-8 w-8" />Engine Health Monitor</h1>
        <p className="text-muted-foreground mt-1">Health status of all major engines</p>
      </div>
      {snapshots.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Health Snapshots</h3><p className="text-muted-foreground">Engine health monitoring has not generated any snapshots yet.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {snapshots.slice(0, 10).map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{snapshot.engineName}</CardTitle>
                  <div className="flex items-center gap-2">{getStatusIcon(snapshot.healthStatus)}<Badge variant={snapshot.healthStatus === 'healthy' ? 'default' : 'destructive'}>{snapshot.healthStatus}</Badge></div>
                </div>
              </CardHeader>
              <CardContent>
                {snapshot.anomalyFlags.length > 0 && snapshot.anomalyFlags.map((flag, i) => (
                  <div key={i} className="text-xs text-red-600 mb-1">⚠ {flag.description}</div>
                ))}
                {snapshot.uncertaintyNotes && <div className="text-xs text-muted-foreground italic mt-2">{snapshot.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Health Monitoring</div><p>Health statuses derived from measurable metrics. No engine marked healthy without data. All anomalies clearly flagged.</p></div></div></CardContent></Card>
    </div>
  );
}
