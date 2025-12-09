'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MarketBaseline, MarketTrend } from '@/lib/marketComparator';

export default function MarketPage() {
  const [loading, setLoading] = useState(true);
  const [baselines, setBaselines] = useState<MarketBaseline[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const [baselinesRes, trendsRes] = await Promise.all([
        fetch('/api/market/baselines', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/market/trends', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (baselinesRes.ok) {
        const data = await baselinesRes.json();
        setBaselines(data.baselines || []);
      }
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
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
          <BarChart3 className="h-8 w-8" />
          Market Comparator
        </h1>
        <p className="text-muted-foreground mt-1">
          Anonymized regional benchmarks and trends
        </p>
      </div>

      {/* Baselines */}
      <Card>
        <CardHeader>
          <CardTitle>Market Baselines</CardTitle>
        </CardHeader>
        <CardContent>
          {baselines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              No baselines available
            </div>
          ) : (
            <div className="space-y-4">
              {baselines.map(baseline => (
                <div key={baseline.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{baseline.metric}</span>
                    <span className="font-medium">{baseline.aggregatedValue.toFixed(2)}</span>
                  </div>
                  <Progress value={baseline.confidence * 100} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sample: {baseline.sampleSize}</span>
                    <span>Confidence: {(baseline.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Market Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              No trends available
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {trends.map(trend => (
                <Card key={trend.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{trend.trendType}</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(trend.direction)}
                        <Badge variant="outline">{trend.confidenceBand}</Badge>
                      </div>
                    </div>
                    {trend.uncertaintyNotes && (
                      <p className="text-xs text-muted-foreground italic">
                        {trend.uncertaintyNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Privacy Notice</div>
              <p>
                All data is anonymized and aggregated. No individual tenant
                information is exposed. Minimum sample sizes are enforced.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
