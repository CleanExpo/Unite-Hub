'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CreativeRiskAssessment } from '@/lib/creativeRisk';

export default function CreativeRiskPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<CreativeRiskAssessment[]>([]);

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
      const response = await fetch(`/api/creative/risk?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
      }
    } catch (error) {
 console.error('Failed:', error); 
} finally {
 setLoading(false); 
}
  };

  if (loading) {
return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
}

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert className="h-8 w-8" />Creative Risk & Sensitivity</h1>
        <p className="text-muted-foreground mt-1">Assess creative content for risk and sensitivity</p>
      </div>
      {assessments.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Risk Assessments</h3><p className="text-muted-foreground">No creative risk assessments have been performed yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {assessments.map(assessment => (
            <Card key={assessment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{assessment.campaignRef.name}</CardTitle>
                  <Badge variant={assessment.riskProfile.overallRisk === 'high' ? 'destructive' : 'outline'}>{assessment.riskProfile.overallRisk} risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  {['complianceRisk', 'culturalRisk', 'brandRisk', 'timingRisk'].map(key => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="capitalize">{key.replace('Risk', '')}</span><span>{((assessment.riskProfile as Record<string, number>)[key] * 100).toFixed(0)}%</span></div>
                      <Progress value={(assessment.riskProfile as Record<string, number>)[key] * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
                {assessment.sensitivityFlags.map((flag, i) => (
                  <div key={i} className="text-xs"><Badge variant="outline" className="mr-1">{flag.category}</Badge>{flag.description}</div>
                ))}
                {assessment.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{assessment.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Risk Assessment Notice</div><p>Risk scores derived from rules and data patterns. System cannot claim zero risk. Cultural and legal variations baked into scoring.</p></div></div></CardContent></Card>
    </div>
  );
}
