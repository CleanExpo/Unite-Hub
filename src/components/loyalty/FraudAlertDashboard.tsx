'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, User, Calendar } from 'lucide-react';

interface FraudAlert {
  id: string;
  referrerId: string;
  referrerEmail?: string;
  referredEmail?: string;
  fraudScore: number;
  fraudSignals: Record<string, boolean>;
  eventType: string;
  createdAt: string;
  requiresReview: boolean;
}

interface FraudAlertDashboardProps {
  workspaceId: string;
  accessToken: string;
}

export function FraudAlertDashboard({
  workspaceId,
  accessToken,
}: FraudAlertDashboardProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'critical'>('high');

  useEffect(() => {
    fetchAlerts();
  }, [workspaceId, accessToken, filterLevel]);

  async function fetchAlerts() {
    try {
      const response = await fetch(
        `/api/loyalty/fraud/alerts?workspaceId=${workspaceId}&level=${filterLevel}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const getFraudLevelColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
    return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200';
  };

  const getFraudLevelLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 50) return 'High';
    return 'Medium';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">Loading fraud alerts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Fraud Detection Dashboard
            </CardTitle>
            <CardDescription>Review suspicious referral activity</CardDescription>
          </div>
          <Badge
            variant={alerts.length > 0 ? 'destructive' : 'default'}
            className={alerts.length > 0 ? 'bg-red-600' : 'bg-green-600'}
          >
            {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['all', 'high', 'critical'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`pb-2 px-1 capitalize transition-colors ${
                filterLevel === level
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {alerts.length === 0 ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
              No suspicious referral activity detected.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 ${
                  alert.fraudScore >= 80 ? 'border-red-500' : 'border-yellow-500'
                } bg-gray-50 dark:bg-gray-800 rounded-lg p-4`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {alert.referrerEmail || alert.referrerId}
                      </h3>
                      <Badge className={`${getFraudLevelColor(alert.fraudScore)}`}>
                        {getFraudLevelLabel(alert.fraudScore)}
                      </Badge>
                    </div>
                    {alert.referredEmail && (
                      <p className="text-sm text-muted-foreground">
                        Referenced by: {alert.referredEmail}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <span className="text-lg font-bold text-red-600">
                        {alert.fraudScore}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>

                {/* Fraud Signals */}
                {Object.keys(alert.fraudSignals).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Detected Signals:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(alert.fraudSignals)
                        .filter(([, value]) => value)
                        .map(([signal]) => (
                          <Badge
                            key={signal}
                            variant="secondary"
                            className="text-xs"
                          >
                            {signal.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                  {alert.requiresReview && (
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      Requires Review
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
