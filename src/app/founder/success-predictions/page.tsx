'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SuccessPrediction } from '@/lib/successPredictor';

export default function SuccessPredictionsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<SuccessPrediction[]>([]);

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

      const response = await fetch(`/api/predictions/success?tenantId=${currentOrganization?.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || []);
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
          <LineChart className="h-8 w-8" />
          Success Predictions
        </h1>
        <p className="text-muted-foreground mt-1">
          Probabilistic success likelihood across domains
        </p>
      </div>

      {predictions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Predictions</h3>
            <p className="text-muted-foreground">
              Success predictions have not been generated yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {predictions.map(prediction => (
            <Card key={prediction.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">{prediction.domain}</CardTitle>
                  <Badge variant="outline">
                    {prediction.horizonDays}-day horizon
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold">
                    {(prediction.successProbability * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Success Probability
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Range: {(prediction.predictionPayload.range.low * 100).toFixed(0)}% - {(prediction.predictionPayload.range.high * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="space-y-2">
                  {prediction.predictionPayload.factors.map((factor, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{factor.name.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {(factor.contribution * 100).toFixed(0)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(factor.dataQuality * 100).toFixed(0)}% data
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {prediction.predictionPayload.caveats.length > 0 && (
                  <div className="bg-muted/50 rounded p-3">
                    <div className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Caveats
                    </div>
                    <ul className="space-y-1">
                      {prediction.predictionPayload.caveats.map((caveat, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {caveat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confidence</span>
                    <span>{(prediction.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={prediction.confidence * 100} className="h-1.5" />
                </div>

                {prediction.uncertaintyNotes && (
                  <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                    {prediction.uncertaintyNotes}
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
              <div className="font-medium mb-1">Prediction Disclaimer</div>
              <p>
                Predictions are explicitly probabilistic, not guarantees.
                Higher horizons mean higher uncertainty. These are advisory
                only and should not be treated as deterministic outcomes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
