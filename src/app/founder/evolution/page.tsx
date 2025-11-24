'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ReviewQueueItem } from '@/lib/evolution/console';

export default function EvolutionConsolePage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/evolution/console/review?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Eye className="h-8 w-8" />Evolution Console (HILEC)</h1>
        <p className="text-muted-foreground mt-1">Review, approve, or modify evolution tasks</p>
      </div>
      {queue.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><h3 className="text-lg font-medium mb-2">Queue Clear</h3><p className="text-muted-foreground">No tasks pending review.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {queue.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Task Review
                  </CardTitle>
                  <Badge variant={item.reviewPriority === 'urgent' ? 'destructive' : item.reviewPriority === 'high' ? 'default' : 'secondary'}>{item.reviewPriority}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  Confidence: {(item.confidenceBand.expected * 100).toFixed(0)}%
                  <span className="text-muted-foreground ml-2">
                    (range: {(item.confidenceBand.min * 100).toFixed(0)}%-{(item.confidenceBand.max * 100).toFixed(0)}%)
                  </span>
                </div>
                {item.deviationAlerts.length > 0 && (
                  <div className="text-sm text-amber-600">
                    Alerts: {item.deviationAlerts.join(', ')}
                  </div>
                )}
                {item.uncertaintyNotes && <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{item.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Review Guidelines</div><p>All tasks include confidence bands and uncertainty notes. Source traceability available. Deviation alerts shown for anomalies.</p></div></div></CardContent></Card>
    </div>
  );
}
