'use client';

/**
 * External Context Card
 * Phase 81: Shows external signals affecting performance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Cloud,
  Building,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { ExternalContext, ExternalSignalSummary } from '@/lib/performanceReality';

interface ExternalContextCardProps {
  context: ExternalContext;
  className?: string;
}

export function ExternalContextCard({
  context,
  className = '',
}: ExternalContextCardProps) {
  if (context.total_signals === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            No significant external factors detected
          </p>
        </CardContent>
      </Card>
    );
  }

  const impactColor = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    mixed: 'text-yellow-500',
    neutral: 'text-muted-foreground',
  }[context.overall_impact];

  const ImpactIcon = {
    positive: TrendingUp,
    negative: TrendingDown,
    mixed: Minus,
    neutral: Minus,
  }[context.overall_impact];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">External Context</CardTitle>
          <div className="flex items-center gap-1">
            <ImpactIcon className={`h-3 w-3 ${impactColor}`} />
            <span className={`text-xs capitalize ${impactColor}`}>
              {context.overall_impact} impact
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {context.signals.map((signal, idx) => (
          <SignalRow key={idx} signal={signal} />
        ))}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Total magnitude: {context.total_magnitude.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalRow({ signal }: { signal: ExternalSignalSummary }) {
  const TypeIcon = {
    holiday: Calendar,
    weather: Cloud,
    industry_event: Building,
    platform_issue: Globe,
    economic: TrendingUp,
  }[signal.type] || Globe;

  const impactColor = signal.impact === 'higher_engagement'
    ? 'text-green-500'
    : signal.impact === 'lower_engagement'
    ? 'text-red-500'
    : 'text-yellow-500';

  const impactLabel = signal.impact === 'higher_engagement'
    ? 'Boost'
    : signal.impact === 'lower_engagement'
    ? 'Reduce'
    : 'Mixed';

  return (
    <div className="flex items-start justify-between gap-2 p-2 bg-muted/50 rounded-lg">
      <div className="flex items-start gap-2">
        <TypeIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium">{signal.name}</p>
          <p className="text-[10px] text-muted-foreground">{signal.dates}</p>
        </div>
      </div>
      <Badge variant="outline" className={`text-[10px] ${impactColor}`}>
        {impactLabel} ({(signal.magnitude * 100).toFixed(0)}%)
      </Badge>
    </div>
  );
}
