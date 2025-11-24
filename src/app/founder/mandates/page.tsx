'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface AgentMandate {
  id: string;
  tenantId: string;
  agentName: string;
  mandate: string;
  autonomyLevel: number;
  riskCaps: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export default function MandatesPage() {
  const [mandates, setMandates] = useState<AgentMandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMandates() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/agent-mandates?tenantId=current', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMandates(data.mandates || []);
      }
      setLoading(false);
    }

    fetchMandates();
  }, []);

  const getAutonomyLabel = (level: number) => {
    const labels = ['None', 'Minimal', 'Low', 'Medium', 'High', 'Full'];
    return labels[level] || 'Unknown';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent Role Profiles & Mandates</h1>
        <Badge variant="outline">Phase 145</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Agent mandates define autonomy levels (0-5) and risk caps.
          All actions validated against mandate constraints before execution.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Active Mandates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading mandates...</p>
          ) : mandates.length === 0 ? (
            <p className="text-muted-foreground">No mandates configured</p>
          ) : (
            <div className="space-y-4">
              {mandates.map((mandate) => (
                <div key={mandate.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{mandate.agentName}</p>
                    <Badge variant={mandate.isActive ? 'default' : 'secondary'}>
                      {mandate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{mandate.mandate}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Autonomy: {getAutonomyLabel(mandate.autonomyLevel)} ({mandate.autonomyLevel})</span>
                    <span>Risk Caps: {Object.keys(mandate.riskCaps).length} defined</span>
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
