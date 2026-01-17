'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, AlertTriangle, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { FranchiseOpportunity } from '@/lib/franchiseOpportunities';

export default function FranchiseOpportunitiesPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<FranchiseOpportunity[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) {
return;
}

      const response = await fetch(`/api/franchise/opportunities?parentAgencyId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Franchise Opportunities
        </h1>
        <p className="text-muted-foreground mt-1">
          Propagate opportunities to child agencies and regions
        </p>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Franchise Opportunities</h3>
            <p className="text-muted-foreground">
              No opportunities have been identified for propagation yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map(opportunity => (
            <Card key={opportunity.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{opportunity.opportunityPayload.title}</CardTitle>
                  <Badge variant="outline">{opportunity.scope}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {opportunity.opportunityPayload.description}
                </p>

                <div className="bg-muted/50 rounded p-3">
                  <div className="text-xs font-medium mb-1">Expected Impact</div>
                  <p className="text-sm">{opportunity.opportunityPayload.expectedImpact}</p>
                </div>

                {opportunity.opportunityPayload.actionItems.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Action Items
                    </div>
                    <ul className="space-y-1">
                      {opportunity.opportunityPayload.actionItems.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Targets: {opportunity.targetRegions.length} regions, {opportunity.targetAgencies.length} agencies
                  </span>
                  {opportunity.propagatedAt && (
                    <Badge variant="secondary">
                      Propagated {new Date(opportunity.propagatedAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span>{(opportunity.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={opportunity.confidence * 100} className="h-1.5" />
                </div>

                {opportunity.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {opportunity.uncertaintyNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="text-sm text-warning-800 dark:text-warning-200">
              <div className="font-medium mb-1">Franchise Propagation Guidelines</div>
              <p>
                Franchise-level insights must not overstate probable impact.
                Child agencies see confidence and uncertainty explicitly.
                No top-down mandates without clear advisory language.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
