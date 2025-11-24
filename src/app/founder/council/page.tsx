'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface CouncilSession {
  id: string;
  tenantId: string;
  topic: string;
  context: Record<string, unknown>;
  participatingAgents: string[];
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function CouncilPage() {
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/council?tenantId=current', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
      setLoading(false);
    }

    fetchSessions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voting': return 'secondary';
      case 'arbitration': return 'warning';
      case 'resolved': return 'default';
      case 'escalated': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Multi-Agent Council Orchestrator</h1>
        <Badge variant="outline">Phase 144</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> All agent votes logged with confidence bands.
          No silent override of dissenting opinions. Dissent summaries preserved in final recommendations.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Council Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground">No council sessions</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{session.topic}</p>
                    <Badge variant={getStatusColor(session.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Agents: {session.participatingAgents.join(', ')}</p>
                    <p className="text-muted-foreground">
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                    {session.resolvedAt && (
                      <p className="text-muted-foreground">
                        Resolved: {new Date(session.resolvedAt).toLocaleString()}
                      </p>
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
