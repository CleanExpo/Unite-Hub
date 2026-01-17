'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Palette,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CreativeAdaptiveState, CreativeSuggestion } from '@/lib/adaptiveCreative';

export default function CreativeAdaptivePage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [state, setState] = useState<CreativeAdaptiveState | null>(null);
  const [suggestion, setSuggestion] = useState<CreativeSuggestion | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const { data: orgs } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (orgs && orgs.length > 0) {
        const tid = orgs[0].org_id;
        setTenantId(tid);

        const response = await fetch(`/api/creative/adaptive/state?tenantId=${tid}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setState(data.state);
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!tenantId) {
return;
}

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/creative/adaptive/suggest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to suggest:', error);
    } finally {
      setGenerating(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8" />
            Adaptive Creative
          </h1>
          <p className="text-muted-foreground mt-1">
            Self-adjusting creative intelligence
          </p>
        </div>
        <Button onClick={handleSuggest} disabled={generating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          Get Suggestion
        </Button>
      </div>

      {/* State */}
      {state ? (
        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fatigue Index</span>
                <span>{(state.fatigueIndex * 100).toFixed(0)}%</span>
              </div>
              <Progress
                value={state.fatigueIndex * 100}
                className={`h-2 ${state.fatigueIndex > 0.7 ? '[&>div]:bg-error-500' : ''}`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Style Bias</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(state.styleBias).map(([style, weight]) => (
                    <Badge key={style} variant="outline">
                      {style}: {((weight as number) * 100).toFixed(0)}%
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Method Weights</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(state.methodWeights).map(([method, weight]) => (
                    <Badge key={method} variant="secondary">
                      {method}: {((weight as number) * 100).toFixed(0)}%
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No State Available</h3>
            <p className="text-muted-foreground">
              Generate a suggestion to create initial state.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestion */}
      {suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning-500" />
              Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Method</div>
                <Badge>{suggestion.method}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Style</div>
                <Badge variant="outline">{suggestion.styleBias}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <span>{(suggestion.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Fatigue Adjustment</div>
              <p className="text-sm">{suggestion.fatigueAdjustment}</p>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Rationale</div>
              <p className="text-sm">{suggestion.rationale}</p>
            </div>

            <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
              {suggestion.uncertaintyNotes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="text-sm text-warning-800 dark:text-warning-200">
              <div className="font-medium mb-1">Advisory Only</div>
              <p>
                Creative suggestions are based on historical patterns.
                Actual audience response may vary.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
