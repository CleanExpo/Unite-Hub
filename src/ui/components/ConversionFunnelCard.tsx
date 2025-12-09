'use client';

/**
 * Conversion Funnel Card Component
 * Phase 52: Visualize landing page conversion funnel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface FunnelStep {
  name: string;
  count: number;
  conversionRate?: number;
  previousCount?: number;
}

interface ConversionFunnelCardProps {
  title?: string;
  steps: FunnelStep[];
  dateRange?: string;
  variant?: string;
}

export function ConversionFunnelCard({
  title = 'Conversion Funnel',
  steps,
  dateRange = 'Last 7 days',
  variant,
}: ConversionFunnelCardProps) {
  const getChangeIndicator = (current: number, previous?: number) => {
    if (!previous) {
return null;
}
    const change = ((current - previous) / previous) * 100;

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500 text-xs">
          <TrendingUp className="h-3 w-3" />
          +{change.toFixed(1)}%
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <TrendingDown className="h-3 w-3" />
          {change.toFixed(1)}%
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
        0%
      </div>
    );
  };

  const maxCount = Math.max(...steps.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {variant && (
              <Badge variant="outline" className="text-xs">
                {variant}
              </Badge>
            )}
            <Badge variant="secondary">{dateRange}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{step.name}</span>
                  {getChangeIndicator(step.count, step.previousCount)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{step.count.toLocaleString()}</span>
                  {step.conversionRate !== undefined && (
                    <Badge
                      variant={step.conversionRate >= 50 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {step.conversionRate.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress bar representing funnel width */}
              <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(step.count / maxCount) * 100}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {step.count.toLocaleString()}
                </div>
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall conversion rate */}
        {steps.length > 1 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Overall Conversion
              </span>
              <span className="text-lg font-bold">
                {((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {steps[0].name} → {steps[steps.length - 1].name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversionFunnelCard;
