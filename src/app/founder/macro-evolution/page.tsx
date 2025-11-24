'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface MacroProposal {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  scope: string;
  affectedEngines: string[];
  status: string;
  confidence: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export default function MacroEvolutionPage() {
  const [proposals, setProposals] = useState<MacroProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProposals() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/evolution/macro?tenantId=current', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);
      }
      setLoading(false);
    }

    fetchProposals();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'secondary';
      case 'under_review': return 'warning';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'executed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Extended Evolution Layer v2 (Macro)</h1>
        <Badge variant="outline">Phase 146</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Macro proposals require thorough human review before execution.
          All proposals include risk matrices and Truth Layer validation results.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Evolution Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading proposals...</p>
          ) : proposals.length === 0 ? (
            <p className="text-muted-foreground">No proposals submitted</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-sm text-muted-foreground">Scope: {proposal.scope}</p>
                    </div>
                    <Badge variant={getStatusColor(proposal.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {proposal.status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{proposal.description}</p>
                  <div className="text-sm space-y-1">
                    <p>Engines: {proposal.affectedEngines.join(', ')}</p>
                    <p>Confidence: {(proposal.confidence * 100).toFixed(0)}%</p>
                    {proposal.uncertaintyNotes && (
                      <p className="text-muted-foreground text-xs">{proposal.uncertaintyNotes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
