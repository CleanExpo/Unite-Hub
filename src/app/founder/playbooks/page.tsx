'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookMarked, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { IntelligencePlaybook } from '@/lib/playbookGenerator';

export default function PlaybooksPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playbooks, setPlaybooks] = useState<IntelligencePlaybook[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/playbooks/intelligence?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPlaybooks(data.playbooks || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookMarked className="h-8 w-8" />Intelligence Playbooks</h1>
        <p className="text-muted-foreground mt-1">Multi-step playbooks across engines</p>
      </div>
      {playbooks.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><BookMarked className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Playbooks</h3><p className="text-muted-foreground">No intelligence playbooks have been generated yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {playbooks.map(playbook => (
            <Card key={playbook.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{playbook.scope} Playbook</CardTitle>
                  <Badge variant="outline">{playbook.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {playbook.playbookSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 mt-0.5 ${step.isOptional ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div>
                      <div className="font-medium">{step.order}. {step.action} <Badge variant={step.riskLevel === 'high' ? 'destructive' : 'outline'} className="text-xs ml-1">{step.riskLevel}</Badge></div>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
                {playbook.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{playbook.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Playbook Guidelines</div><p>Steps marked optional vs critical. No step promises deterministic outcomes. All flows require risk and uncertainty annotations.</p></div></div></CardContent></Card>
    </div>
  );
}
