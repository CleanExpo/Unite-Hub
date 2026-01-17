'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  AlertTriangle,
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CognitiveSnapshot } from '@/lib/founderCognitiveMap';

export default function CognitiveMapPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<CognitiveSnapshot | null>(null);

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

      const response = await fetch(`/api/founder/cognitive-map?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSnapshot(data.snapshot);
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
          <Brain className="h-8 w-8" />
          Founder Cognitive Map
        </h1>
        <p className="text-muted-foreground mt-1">
          Full cognitive visualization of your business state
        </p>
      </div>

      {!snapshot ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cognitive Map</h3>
            <p className="text-muted-foreground">
              Generate a cognitive map to visualize your business state.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cognitive Health</span>
                <Badge variant={snapshot.overallHealth >= 0.7 ? 'default' : 'destructive'}>
                  {(snapshot.overallHealth * 100).toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={snapshot.overallHealth * 100} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {(snapshot.confidence * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Risk Zones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snapshot.riskZones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No significant risk zones identified</p>
                ) : (
                  <ul className="space-y-2">
                    {snapshot.riskZones.map((zone, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          zone.severity === 'high' ? 'text-error-600' :
                          zone.severity === 'medium' ? 'text-warning-600' : 'text-text-muted'
                        }`} />
                        <div>
                          <div className="text-sm font-medium">{zone.area}</div>
                          <p className="text-xs text-muted-foreground">{zone.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Opportunity Clusters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Opportunity Clusters
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snapshot.opportunityClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No opportunity clusters identified</p>
                ) : (
                  <ul className="space-y-2">
                    {snapshot.opportunityClusters.map((cluster, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 flex-shrink-0 text-success-600" />
                        <div>
                          <div className="text-sm font-medium">{cluster.area}</div>
                          <p className="text-xs text-muted-foreground">{cluster.description}</p>
                          <div className="text-xs mt-1">
                            Potential: {(cluster.potential * 100).toFixed(0)}%
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Focus Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Focus Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {snapshot.focusRecommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {snapshot.uncertaintyNotes && (
            <Card className="border-muted">
              <CardContent className="py-4">
                <div className="text-xs text-muted-foreground italic">
                  {snapshot.uncertaintyNotes}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Disclaimer */}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="text-sm text-warning-800 dark:text-warning-200">
              <div className="font-medium mb-1">Cognitive Map Limitations</div>
              <p>
                This visualization aggregates signals from multiple systems.
                Risk zones and opportunities are estimates based on available data.
                Strategic decisions should incorporate additional context and expert judgment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
