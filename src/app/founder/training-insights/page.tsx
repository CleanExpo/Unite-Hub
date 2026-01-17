'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TrainingInsight } from '@/lib/trainingInsights';

export default function TrainingInsightsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<TrainingInsight[]>([]);

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
      const response = await fetch(`/api/training/insights?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8" />Human Training Insights</h1>
        <p className="text-muted-foreground mt-1">Recommended training topics based on intelligence signals</p>
      </div>
      {insights.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Training Insights</h3><p className="text-muted-foreground">No training recommendations have been generated yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {insights.map(insight => (
            <Card key={insight.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{insight.topic}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={insight.priority === 'critical' ? 'destructive' : insight.priority === 'high' ? 'default' : 'secondary'}>{insight.priority}</Badge>
                    <Badge variant="outline">{insight.audienceType}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {insight.capabilityGap && <p className="text-sm text-muted-foreground mb-2">Gap: {insight.capabilityGap}</p>}
                <div className="text-xs text-muted-foreground">Confidence: {(insight.confidence * 100).toFixed(0)}%</div>
                {insight.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{insight.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" /><div className="text-sm text-warning-800 dark:text-warning-200"><div className="font-medium mb-1">Training Guidelines</div><p>No blame language. Focus on capability gaps not fault. All training topics must be signal-backed.</p></div></div></CardContent></Card>
    </div>
  );
}
