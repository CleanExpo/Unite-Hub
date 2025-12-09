'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RenderedInsight } from '@/lib/insightRenderer';

export default function InsightRendererPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<RenderedInsight[]>([]);

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
      const response = await fetch(`/api/insights/rendered?tenantId=${currentOrganization.org_id}`, {
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8" />Global Insight Renderer</h1>
        <p className="text-muted-foreground mt-1">Rendered insights for various audiences</p>
      </div>
      {insights.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Rendered Insights</h3><p className="text-muted-foreground">No insights have been rendered yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {insights.map(insight => (
            <Card key={insight.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{insight.insightPayload.title}</CardTitle>
                  <div className="flex gap-1"><Badge variant="outline">{insight.audienceType}</Badge><Badge variant="secondary">{insight.renderType}</Badge></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {insight.insightPayload.highlights.map((h, i) => <div key={i} className="text-sm text-green-600">✓ {h}</div>)}
                {insight.insightPayload.risks.map((r, i) => <div key={i} className="text-sm text-red-600">⚠ {r}</div>)}
                {insight.uncertaintyNotes && <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{insight.uncertaintyNotes}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Rendering Guidelines</div><p>Rendered outputs inherit uncertainty and confidence. No visual element hides critical risk. Summaries never claim more certainty than sources.</p></div></div></CardContent></Card>
    </div>
  );
}
