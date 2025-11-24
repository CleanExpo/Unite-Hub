'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RegressionCheck } from '@/lib/evolution/qa';

export default function EvolutionQAPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<RegressionCheck[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/evolution/qa/history?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><TestTube className="h-8 w-8" />Evolution QA & Regression Guard</h1>
        <p className="text-muted-foreground mt-1">Validate evolution tasks don't degrade performance</p>
      </div>
      {history.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Regression Checks</h3><p className="text-muted-foreground">No QA checks have been run yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {history.map(check => (
            <Card key={check.id} className={check.blocked ? 'border-red-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {check.blocked ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    {check.checkType.replace('_', ' ')} Check
                  </CardTitle>
                  <Badge variant={check.blocked ? 'destructive' : check.coreKpisImpacted ? 'secondary' : 'default'}>
                    {check.blocked ? 'BLOCKED' : check.coreKpisImpacted ? 'Regressions' : 'Passed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {check.regressionsDetected.length > 0 && (
                  <div className="mb-2">
                    {check.regressionsDetected.map((r, i) => (
                      <div key={i} className="text-sm text-red-600">• {r}</div>
                    ))}
                  </div>
                )}
                {check.blockReason && <div className="text-sm text-red-600 font-medium">{check.blockReason}</div>}
                <div className="text-xs text-muted-foreground mt-2">Confidence: {(check.confidence * 100).toFixed(0)}%</div>
                {check.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{check.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">QA Constraints</div><p>No positive spin on regressions. Before/after metrics shown. Blocked if core KPIs drop beyond threshold.</p></div></div></CardContent></Card>
    </div>
  );
}
