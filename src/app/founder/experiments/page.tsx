'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ExperimentSandbox } from '@/lib/experiments/sandbox';

export default function ExperimentsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sandboxes, setSandboxes] = useState<ExperimentSandbox[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/experiments/sandbox/results?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSandboxes(data.sandboxes || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FlaskConical className="h-8 w-8" />Experimentation Sandbox</h1>
        <p className="text-muted-foreground mt-1">Safe testing environment for evolution ideas</p>
      </div>
      {sandboxes.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Sandboxes</h3><p className="text-muted-foreground">No experiment sandboxes have been created yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sandboxes.map(sandbox => (
            <Card key={sandbox.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{sandbox.name}</CardTitle>
                  <Badge variant={sandbox.status === 'running' ? 'default' : sandbox.status === 'completed' ? 'secondary' : 'outline'}>{sandbox.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {sandbox.description && <p className="text-sm text-muted-foreground mb-2">{sandbox.description}</p>}
                <div className="text-xs text-muted-foreground">Created: {new Date(sandbox.createdAt).toLocaleDateString()}</div>
                {sandbox.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{sandbox.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Sandbox Constraints</div><p>No real clients in sandbox. Sandbox label required on all outputs. No metric mixing between sandbox and live.</p></div></div></CardContent></Card>
    </div>
  );
}
