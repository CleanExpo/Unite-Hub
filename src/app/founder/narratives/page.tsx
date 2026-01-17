'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { NarrativeSnapshot } from '@/lib/narrativeIntelligence';

export default function NarrativesPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [narratives, setNarratives] = useState<NarrativeSnapshot[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/narrative/snapshots?tenantId=${currentOrganization?.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNarratives(data.narratives || []);
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
          <BookOpen className="h-8 w-8" />
          Narrative Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Coherent stories explaining what is happening and why
        </p>
      </div>

      {narratives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Narratives</h3>
            <p className="text-muted-foreground">
              No narrative intelligence has been generated yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {narratives.map(narrative => (
            <Card key={narrative.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{narrative.storyBody.title}</CardTitle>
                  <Badge variant="outline">{narrative.scope}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{narrative.storyBody.summary}</p>

                {narrative.storyBody.segments.map((segment, i) => (
                  <div key={i} className="border-l-2 border-muted pl-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      {new Date(segment.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium">{segment.event}</div>
                    <p className="text-xs text-muted-foreground">{segment.significance}</p>
                  </div>
                ))}

                <div className="bg-muted/50 rounded p-3">
                  <div className="text-xs font-medium mb-1">Outlook</div>
                  <p className="text-sm text-muted-foreground">{narrative.storyBody.outlook}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span>{(narrative.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={narrative.confidence * 100} className="h-1.5" />
                </div>

                {narrative.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {narrative.uncertaintyNotes}
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
              <div className="font-medium mb-1">Narrative Integrity</div>
              <p>
                Narratives reference underlying signals and contain no invented
                events. All speculative language is marked as such. Events and
                significance are interpretations based on patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
