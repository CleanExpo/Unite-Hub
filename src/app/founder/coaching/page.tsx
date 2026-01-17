'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { CoachingPrompt } from '@/lib/coaching/operator';

export default function CoachingPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<CoachingPrompt[]>([]);

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
      const response = await fetch(`/api/coaching/operator/prompts?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
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
        <h1 className="text-3xl font-bold flex items-center gap-2"><Lightbulb className="h-8 w-8" />Operator Coaching</h1>
        <p className="text-muted-foreground mt-1">Real-time coaching prompts based on live dashboards</p>
      </div>
      {prompts.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Active Coaching</h3><p className="text-muted-foreground">No coaching prompts available right now.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {prompts.map(prompt => (
            <Card key={prompt.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{prompt.promptType}</CardTitle>
                  <Badge variant={prompt.promptType === 'warning' ? 'destructive' : prompt.promptType === 'opportunity' ? 'default' : 'secondary'}>{prompt.promptType}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{prompt.message}</p>
                {prompt.actionRecommended && <p className="text-sm text-primary mt-2">→ {prompt.actionRecommended}</p>}
                <div className="text-xs text-muted-foreground mt-2">
                  Triggered by: {prompt.contextDashboards.join(', ') || 'system'}
                </div>
                <div className="text-xs text-muted-foreground">Confidence: {(prompt.confidence * 100).toFixed(0)}%</div>
                {prompt.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{prompt.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" /><div className="text-sm text-warning-800 dark:text-warning-200"><div className="font-medium mb-1">Coaching Guidelines</div><p>Suggestions labeled as such. No guaranteed outcomes. References which dashboards triggered advice.</p></div></div></CardContent></Card>
    </div>
  );
}
