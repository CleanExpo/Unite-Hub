'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AutonomousAdjustment } from '@/lib/evolution/adjustmentEngine';

export default function AdjustmentsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AutonomousAdjustment[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/evolution/adjustments/logs?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Wrench className="h-8 w-8" />Autonomous Adjustments</h1>
        <p className="text-muted-foreground mt-1">Low-risk micro-adjustments under strict guardrails</p>
      </div>
      {logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Adjustments</h3><p className="text-muted-foreground">No autonomous adjustments have been executed yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {log.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : log.status === 'vetoed' ? <XCircle className="h-4 w-4 text-red-500" /> : null}
                    {log.adjustmentType}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={log.riskLevel === 'minimal' ? 'secondary' : 'outline'}>{log.riskLevel}</Badge>
                    <Badge variant={log.status === 'completed' ? 'default' : log.status === 'vetoed' ? 'destructive' : 'secondary'}>{log.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Target: {log.targetEntity}</div>
                {log.vetoedBy && <div className="text-sm text-red-600 mt-1">Vetoed by: {log.vetoedBy}</div>}
                <div className="text-xs text-muted-foreground mt-2">Safety checks: {log.safetyChecksPassed.join(', ')}</div>
                {log.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{log.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Forbidden Changes</div><p>Schema changes, feature modification, cross-region transfer, compliance settings, and major policy changes are strictly prohibited.</p></div></div></CardContent></Card>
    </div>
  );
}
