'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StabilisationEvent } from '@/lib/intelligenceStabilisation';

export default function StabilisationPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<StabilisationEvent[]>([]);

  useEffect(() => {
 fetchData(); 
}, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}
      const response = await fetch('/api/intelligence/stabilisation-events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><Anchor className="h-8 w-8" />Intelligence Stabilisation</h1>
        <p className="text-muted-foreground mt-1">Monitor and correct system instability</p>
      </div>
      {events.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Anchor className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Stabilisation Events</h3><p className="text-muted-foreground">No instability patterns have been detected.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{event.detectedPattern.type}</CardTitle>
                  <Badge variant={event.status === 'resolved' ? 'default' : 'destructive'}>{event.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{event.detectedPattern.description}</p>
                <div className="flex flex-wrap gap-1">{event.affectedEngines.map((eng, i) => <Badge key={i} variant="secondary" className="text-xs">{eng}</Badge>)}</div>
                {event.correctiveActions.length > 0 && (
                  <div><div className="text-sm font-medium mb-1 flex items-center gap-1"><Zap className="h-3 w-3" />Corrective Actions</div>{event.correctiveActions.map((action, i) => <div key={i} className="text-xs text-muted-foreground">• {action.action}: {action.expectedEffect}</div>)}</div>
                )}
                {event.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{event.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Stabilisation Protocol</div><p>Actions do not hide underlying volatility. Engine corrections logged and auditable. No corrective step fabricates stability where none exists.</p></div></div></CardContent></Card>
    </div>
  );
}
