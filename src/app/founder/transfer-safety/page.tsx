'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TransferAssessment } from '@/lib/regionTransferSafety';

export default function TransferSafetyPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<TransferAssessment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/regions/transfer-safety', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
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
          <Shield className="h-8 w-8" />
          Region Transfer Safety
        </h1>
        <p className="text-muted-foreground mt-1">
          Validate cross-region pattern transfers
        </p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Transfer Assessments</h3>
            <p className="text-muted-foreground">
              No cross-region transfers have been assessed yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assessments.map(assessment => (
            <Card key={assessment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="font-mono text-sm">{assessment.sourceRegionId.slice(0, 8)}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-mono text-sm">{assessment.targetRegionId.slice(0, 8)}</span>
                  </CardTitle>
                  <Badge variant={assessment.riskAssessment.overallRisk === 'high' ? 'destructive' : 'outline'}>
                    {assessment.riskAssessment.overallRisk} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Transferability</span>
                      <span>{(assessment.transferabilityScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={assessment.transferabilityScore * 100} className="h-1.5" />
                  </div>
                  {assessment.culturalDistance !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Cultural Distance</span>
                        <span>{(assessment.culturalDistance * 100).toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={assessment.culturalDistance * 100}
                        className={`h-1.5 ${assessment.culturalDistance > 0.5 ? '[&>div]:bg-amber-500' : ''}`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={assessment.complianceCompatible ? 'default' : 'destructive'}>
                    {assessment.complianceCompatible ? 'Compliance Compatible' : 'Compliance Review Required'}
                  </Badge>
                </div>

                {assessment.riskAssessment.factors.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Risk Factors</div>
                    {assessment.riskAssessment.factors.map((factor, i) => (
                      <div key={i} className="text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{factor.category}</Badge>
                          <span className={factor.severity === 'high' ? 'text-red-600' : 'text-amber-600'}>
                            {factor.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                        <p className="text-xs text-muted-foreground">Mitigation: {factor.mitigation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {assessment.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {assessment.uncertaintyNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Transfer Safety Rules</div>
              <p>
                No cross-region assumption without penalty. Transferability is
                probabilistic, not guaranteed. Compliance and culture are always
                part of scoring.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
