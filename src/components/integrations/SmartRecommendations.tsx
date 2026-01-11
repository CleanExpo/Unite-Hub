'use client';

/**
 * Smart Integration Recommendations
 * Suggests which integrations to connect based on business type
 * Pattern 3: "I don't know what's required vs optional" (3 users)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

export type BusinessType = 'small_business' | 'agency' | 'enterprise';

export interface IntegrationRecommendation {
  integrationKey: string;
  integrationName: string;
  priority: 'required' | 'recommended' | 'optional';
  reason: string;
  connected: boolean;
}

export interface SmartRecommendationsProps {
  businessType: BusinessType;
  recommendations: IntegrationRecommendation[];
  onConnectAll?: () => void;
  onCustomize?: () => void;
}

export function SmartRecommendations({
  businessType,
  recommendations,
  onConnectAll,
  onCustomize,
}: SmartRecommendationsProps) {
  const businessTypeLabels = {
    small_business: 'Small Business',
    agency: 'Marketing Agency',
    enterprise: 'Enterprise',
  };

  const requiredAndRecommended = recommendations.filter(
    r => r.priority === 'required' || r.priority === 'recommended'
  );

  const allConnected = requiredAndRecommended.every(r => r.connected);

  return (
    <Card className="border-accent-500/20 bg-accent-500/5">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-accent-500" />
          <CardTitle className="text-lg">Recommended for You</CardTitle>
        </div>
        <CardDescription>
          Based on your business type: <strong>{businessTypeLabels[businessType]}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendations List */}
        <div className="space-y-3">
          {requiredAndRecommended.map((rec) => (
            <div
              key={rec.integrationKey}
              className="flex items-start gap-3 p-3 rounded-lg bg-bg-card border border-border-base"
            >
              <div className="flex-shrink-0 mt-0.5">
                {rec.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-text-tertiary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium text-text-primary">
                    {rec.integrationName}
                  </div>
                  {rec.priority === 'required' && (
                    <Badge variant="destructive" className="text-xs">
                      REQUIRED
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-text-secondary">{rec.reason}</div>
              </div>
              {rec.connected && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Connected
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* CTAs */}
        {!allConnected && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onConnectAll}
              className="flex-1"
            >
              Connect Recommended
            </Button>
            <Button
              variant="outline"
              onClick={onCustomize}
              className="flex-1"
            >
              Customize
            </Button>
          </div>
        )}

        {allConnected && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="font-medium text-green-900 dark:text-green-100">
              All Recommended Integrations Connected!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              You're set up for success
            </p>
          </div>
        )}

        {/* Confidence Messaging */}
        <div className="bg-bg-raised rounded-lg p-4 border border-border-base">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Don't worry:</strong> You can add more integrations anytime.
            Start with these {requiredAndRecommended.length} for now, and expand later as you grow.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
