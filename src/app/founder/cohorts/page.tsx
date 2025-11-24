'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseBrowser } from '@/lib/supabase';

interface TenantCohort {
  id: string;
  cohortLabel: string;
  description?: string;
  memberCount: number;
  minMembersRequired: number;
  similarityIndex?: number;
  isActive: boolean;
  createdAt: string;
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<TenantCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCohorts() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/cross-tenant/cohorts', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
      }
      setLoading(false);
    }

    fetchCohorts();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Cohort Intelligence Engine</h1>
        <Badge variant="outline">Phase 147</Badge>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Truth Layer Notice:</strong> Cohorts cluster similar tenants without revealing individual members.
          Minimum member requirements prevent de-anonymisation.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Active Cohorts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading cohorts...</p>
          ) : cohorts.length === 0 ? (
            <p className="text-muted-foreground">No cohorts available</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cohorts.map((cohort) => (
                <div key={cohort.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{cohort.cohortLabel}</p>
                    <Badge variant={cohort.isActive ? 'default' : 'secondary'}>
                      {cohort.memberCount} members
                    </Badge>
                  </div>
                  {cohort.description && (
                    <p className="text-sm text-muted-foreground mb-2">{cohort.description}</p>
                  )}
                  <div className="text-sm space-y-1">
                    <p>Min required: {cohort.minMembersRequired}</p>
                    {cohort.similarityIndex && (
                      <p>Similarity: {(cohort.similarityIndex * 100).toFixed(0)}%</p>
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
