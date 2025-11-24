'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Roadmap } from '@/lib/roadmap';

export default function RoadmapPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/roadmap/list?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRoadmaps(data.roadmaps || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Map className="h-8 w-8" />Long-Horizon Roadmaps</h1>
        <p className="text-muted-foreground mt-1">3-12 month advisory roadmaps</p>
      </div>
      {roadmaps.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Roadmaps</h3><p className="text-muted-foreground">No roadmaps have been generated yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {roadmaps.map(roadmap => (
            <Card key={roadmap.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{roadmap.name}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{roadmap.horizonMonths} months</Badge>
                    <Badge variant="outline">{roadmap.status}</Badge>
                    {roadmap.isAdvisory && <Badge variant="outline">Advisory</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">{roadmap.startDate} → {roadmap.endDate}</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Milestones: {roadmap.milestones.length}</span>
                  <span>Confidence: {(roadmap.confidence * 100).toFixed(0)}%</span>
                </div>
                {roadmap.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{roadmap.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Roadmap Guidelines</div><p>All roadmaps marked advisory. Uncertainty increases with horizon length. Must respect budget and workload limits.</p></div></div></CardContent></Card>
    </div>
  );
}
