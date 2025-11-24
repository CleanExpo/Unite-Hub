'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { EvolutionSchedule } from '@/lib/evolution/planner';

export default function EvolutionPlannerPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<EvolutionSchedule[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/evolution/planner/schedule?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="h-8 w-8" />Evolution Planner</h1>
        <p className="text-muted-foreground mt-1">Schedule micro-evolution tasks into weekly cycles</p>
      </div>
      {schedules.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Schedules</h3><p className="text-muted-foreground">No evolution cycles have been scheduled yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {schedules.map(schedule => (
            <Card key={schedule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{schedule.cycleStart} to {schedule.cycleEnd}</CardTitle>
                  <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>{schedule.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span>Tasks: {schedule.completedTasks}/{schedule.totalTasks}</span>
                  <span className="text-muted-foreground">Confidence: {(schedule.confidence * 100).toFixed(0)}%</span>
                </div>
                {schedule.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{schedule.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Planning Constraints</div><p>Load-aware scheduling. Priority harmonizer integration. No metric manipulation allowed.</p></div></div></CardContent></Card>
    </div>
  );
}
