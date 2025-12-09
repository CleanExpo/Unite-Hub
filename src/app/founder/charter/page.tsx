'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface GovernanceCharter {
  id: string;
  version: string;
  charterDocument: Record<string, unknown>;
  autonomyRules: Record<string, unknown>;
  crossTenantRules: Record<string, unknown>;
  emergencyStopConditions: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt?: string;
}

export default function CharterPage() {
  const [charter, setCharter] = useState<GovernanceCharter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCharter() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/governance/charter', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCharter(data.charter);
      }
      setLoading(false);
    }

    fetchCharter();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Global Agent Governance Charter</h1>
        <Badge variant="outline">Phase 150</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Only humans may modify the governance charter.
          Versioning required for every update. All compliance checks logged against active charter version.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Active Charter</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading charter...</p>
          ) : !charter ? (
            <p className="text-muted-foreground">No active charter configured</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-lg">Version {charter.version}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(charter.createdAt).toLocaleString()}
                  </p>
                  {charter.activatedAt && (
                    <p className="text-sm text-muted-foreground">
                      Activated: {new Date(charter.activatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Badge variant={charter.isActive ? 'default' : 'secondary'}>
                  {charter.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Autonomy Rules</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(charter.autonomyRules).length} rules defined
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Cross-Tenant Rules</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(charter.crossTenantRules).length} rules defined
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Emergency Stop Conditions</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(charter.emergencyStopConditions).length} conditions defined
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">Charter Document</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(charter.charterDocument).length} sections
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
