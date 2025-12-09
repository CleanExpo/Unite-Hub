'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { EvolutionTask } from '@/lib/evolution/kernel';

export default function EvolutionKernelPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<EvolutionTask[]>([]);

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
      const response = await fetch(`/api/evolution/kernel/tasks?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
 console.error('Failed:', error); 
} finally {
 setLoading(false); 
}
  };

  const runKernel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) {
return;
}
      await fetch('/api/evolution/kernel/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenantId: currentOrganization.org_id })
      });
      fetchData();
    } catch (error) {
 console.error('Failed:', error); 
}
  };

  if (loading) {
return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
}

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Cpu className="h-8 w-8" />Evolution Kernel</h1>
          <p className="text-muted-foreground mt-1">Daily system-wide intelligence scan</p>
        </div>
        <Button onClick={runKernel}><Play className="h-4 w-4 mr-2" />Run Kernel</Button>
      </div>
      {tasks.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Evolution Tasks</h3><p className="text-muted-foreground">Run the kernel to generate micro-evolution tasks.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{task.description}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={task.priority === 'critical' ? 'destructive' : task.priority === 'high' ? 'default' : 'secondary'}>{task.priority}</Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Type: {task.taskType}</span>
                  <span>Confidence: {(task.confidence * 100).toFixed(0)}%</span>
                  {task.requiresApproval && <Badge variant="outline" className="text-xs">Requires Approval</Badge>}
                </div>
                {task.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{task.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Evolution Constraints</div><p>No structural changes. No feature modifications. No cross-region transfers. Founder approval required for critical tasks.</p></div></div></CardContent></Card>
    </div>
  );
}
