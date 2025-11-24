'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shapes, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Pattern } from '@/lib/patternLibrary';

export default function PatternsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/patterns/library?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shapes className="h-8 w-8" />Pattern Library</h1>
        <p className="text-muted-foreground mt-1">Canonical library of successful and failed patterns</p>
      </div>
      {patterns.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Shapes className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Patterns</h3><p className="text-muted-foreground">No patterns have been recorded yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {patterns.map(pattern => (
            <Card key={pattern.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {pattern.isSuccess ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    {pattern.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{pattern.category}</Badge>
                    <Badge variant={pattern.isSuccess ? 'default' : 'destructive'}>{pattern.isSuccess ? 'Success' : 'Failed'}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{pattern.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>Used: {pattern.usageCount} times</span>
                  <span>Confidence: {(pattern.confidence * 100).toFixed(0)}%</span>
                </div>
                {pattern.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{pattern.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Pattern Library Constraints</div><p>Pattern success must include context. Failed patterns stored with reasons. No pattern marked universal.</p></div></div></CardContent></Card>
    </div>
  );
}
