'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileWarning, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Postmortem } from '@/lib/postmortem';

export default function PostmortemsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [postmortems, setPostmortems] = useState<Postmortem[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/postmortem/incidents?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPostmortems(data.postmortems || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileWarning className="h-8 w-8" />Incident Postmortems</h1>
        <p className="text-muted-foreground mt-1">Structured analysis of incidents and failures</p>
      </div>
      {postmortems.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Postmortems</h3><p className="text-muted-foreground">No incident postmortems have been created yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {postmortems.map(pm => (
            <Card key={pm.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pm.title}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{pm.incidentType.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{pm.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{pm.summary}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>Facts: {pm.facts.length}</span>
                  <span>Hypotheses: {pm.hypotheses.length}</span>
                  <span>Lessons: {pm.lessons.length}</span>
                  <span>Confidence: {(pm.confidence * 100).toFixed(0)}%</span>
                </div>
                {pm.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{pm.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Postmortem Guidelines</div><p>Facts separated from hypotheses. Blameless language required. Lessons link to patterns and training.</p></div></div></CardContent></Card>
    </div>
  );
}
