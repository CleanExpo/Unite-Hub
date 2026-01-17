'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cpu, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkloadSnapshot } from '@/lib/aiWorkloadGovernor';

export default function AIWorkloadPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<WorkloadSnapshot[]>([]);

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
      const response = await fetch(`/api/ai-workload/snapshots?tenantId=${currentOrganization.org_id}`, {
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><Cpu className="h-8 w-8" />AI Workload Governor</h1>
        <p className="text-muted-foreground mt-1">Control AI spend and workload per tenant</p>
      </div>
      {snapshots.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Workload Snapshots</h3><p className="text-muted-foreground">AI workload tracking has not generated any snapshots yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {snapshots.map(snapshot => (
            <Card key={snapshot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Budget: {snapshot.remainingBudgetUnits.toFixed(0)} units remaining</CardTitle>
                  <Badge variant={snapshot.remainingBudgetUnits < 100 ? 'destructive' : 'outline'}>
                    {snapshot.remainingBudgetUnits < 100 ? 'Low' : 'OK'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(snapshot.usageBreakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="capitalize">{key}</span><span>{(value as number).toFixed(0)} units</span></div>
                    <Progress value={Math.min(100, (value as number) / 10)} className="h-1.5" />
                  </div>
                ))}
                {snapshot.recommendations.length > 0 && (
                  <div className="mt-3"><div className="text-sm font-medium mb-1">Recommendations</div>{snapshot.recommendations.map((rec, i) => <div key={i} className="text-xs text-muted-foreground">• {rec}</div>)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" /><div className="text-sm text-warning-800 dark:text-warning-200"><div className="font-medium mb-1">Budget Transparency</div><p>Budget rules are visible to founders. No hidden throttling of critical safety flows. AI usage derived from real logs only.</p></div></div></CardContent></Card>
    </div>
  );
}
