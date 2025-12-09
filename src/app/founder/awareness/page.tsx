'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertTriangle, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AwarenessSnapshot } from '@/lib/situationalAwareness';

export default function AwarenessPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<AwarenessSnapshot[]>([]);

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
      const response = await fetch(`/api/founder/awareness?tenantId=${currentOrganization.org_id}`, {
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><Eye className="h-8 w-8" />Situational Awareness</h1>
        <p className="text-muted-foreground mt-1">Time-bound snapshot of critical items</p>
      </div>
      {snapshots.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Awareness Snapshots</h3><p className="text-muted-foreground">Generate a situational awareness snapshot to see critical items.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{snapshot.awarenessPayload.summary}</CardTitle>
                  <Badge variant={snapshot.awarenessPayload.actionRequired ? 'destructive' : 'outline'}>{snapshot.timeWindow}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.awarenessPayload.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {item.type === 'risk' ? <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" /> : <Target className="h-4 w-4 text-green-600 mt-0.5" />}
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
                {snapshot.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{snapshot.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Awareness Filters</div><p>Focus filters are transparent. No important high-risk items are hidden. Some lower-priority items may be below visibility threshold.</p></div></div></CardContent></Card>
    </div>
  );
}
