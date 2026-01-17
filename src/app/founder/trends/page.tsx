'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { TemporalSnapshot } from '@/lib/temporalTrends';

export default function TrendsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TemporalSnapshot[]>([]);

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

      const response = await fetch(`/api/trends/temporal?tenantId=${currentOrganization?.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-error-600" />;
      default: return <Minus className="h-4 w-4 text-text-muted" />;
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
          <TrendingUp className="h-8 w-8" />
          Temporal Trends
        </h1>
        <p className="text-muted-foreground mt-1">
          Long-term, seasonal, and cyclical pattern analysis
        </p>
      </div>

      {trends.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Trend Analysis</h3>
            <p className="text-muted-foreground">
              Temporal trend analysis has not been performed yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trends.map(trend => (
            <Card key={trend.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Trend Analysis</CardTitle>
                  <Badge variant="outline">{trend.scope}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {trend.trendVectors.map((vector, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(vector.direction)}
                        <span className="text-sm capitalize">{vector.dimension}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{vector.dataPoints} points</span>
                        <span className="ml-2">{(vector.magnitude * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {trend.seasonalitySignals.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Seasonality</div>
                    {trend.seasonalitySignals.map((signal, i) => (
                      <div key={i} className="text-sm text-muted-foreground">
                        {signal.pattern}: {signal.periodDays}-day cycle, {(signal.strength * 100).toFixed(0)}% strength
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span>{(trend.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={trend.confidence * 100} className="h-1.5" />
                </div>

                {trend.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {trend.uncertaintyNotes}
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
              <div className="font-medium mb-1">Trend Limitations</div>
              <p>
                Trends are not extrapolated beyond data coverage. Seasonality
                requires minimum-horizon checks. Uncertainty grows with time
                horizon and is always visible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
