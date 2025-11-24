'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface BoundaryCrossing {
  id: string;
  tenantId: string;
  dataType: string;
  targetScope: string;
  wasApproved: boolean;
  validationDetails: Record<string, unknown>;
  crossedAt: string;
}

export default function BoundaryPage() {
  const [crossings, setCrossings] = useState<BoundaryCrossing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCrossings() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/cross-tenant/boundary?tenantId=current', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCrossings(data.crossings || []);
      }
      setLoading(false);
    }

    fetchCrossings();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Intelligence Boundary Engine</h1>
        <Badge variant="outline">Phase 141</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Boundary crossings logged based on detected data flows.
          Strict no-identifiable-data across tenants. Anonymisation required before all sharing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Recent Boundary Crossings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading boundary crossings...</p>
          ) : crossings.length === 0 ? (
            <p className="text-muted-foreground">No boundary crossings recorded</p>
          ) : (
            <div className="space-y-4">
              {crossings.map((crossing) => (
                <div key={crossing.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{crossing.dataType}</p>
                      <p className="text-sm text-muted-foreground">Target: {crossing.targetScope}</p>
                    </div>
                    <Badge variant={crossing.wasApproved ? 'default' : 'destructive'}>
                      {crossing.wasApproved ? 'Approved' : 'Blocked'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(crossing.crossedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
