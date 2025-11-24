'use client';

/**
 * Founder Intel Overview
 * Phase 80: Top-level health snapshot tiles
 */

import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Users,
  Palette,
  Scale,
  Gauge,
  Archive,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { HealthMetric } from '@/lib/founderIntel/founderIntelTypes';

interface FounderIntelOverviewProps {
  agencyHealth: HealthMetric;
  clientHealth: HealthMetric;
  creativeHealth: HealthMetric;
  scalingRisk: HealthMetric;
  ormReality: HealthMetric;
  archiveCompleteness: HealthMetric;
  className?: string;
}

export function FounderIntelOverview({
  agencyHealth,
  clientHealth,
  creativeHealth,
  scalingRisk,
  ormReality,
  archiveCompleteness,
  className = '',
}: FounderIntelOverviewProps) {
  const metrics = [
    { metric: agencyHealth, icon: Building2, label: 'Agency Health' },
    { metric: clientHealth, icon: Users, label: 'Client Health' },
    { metric: creativeHealth, icon: Palette, label: 'Creative Health' },
    { metric: scalingRisk, icon: Scale, label: 'Scaling Risk' },
    { metric: ormReality, icon: Gauge, label: 'ORM Reality' },
    { metric: archiveCompleteness, icon: Archive, label: 'Archive' },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {metrics.map(({ metric, icon: Icon, label }) => (
        <Card key={label}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <TrendIndicator trend={metric.trend} />
            </div>
            <p className={`text-2xl font-bold ${metric.color}`}>
              {metric.score}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

/**
 * Compact overview for smaller spaces
 */
export function FounderIntelOverviewCompact({
  agencyHealth,
  clientHealth,
  creativeHealth,
}: {
  agencyHealth: HealthMetric;
  clientHealth: HealthMetric;
  creativeHealth: HealthMetric;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-center">
        <p className={`text-lg font-bold ${agencyHealth.color}`}>
          {agencyHealth.score}%
        </p>
        <p className="text-[10px] text-muted-foreground">Agency</p>
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold ${clientHealth.color}`}>
          {clientHealth.score}%
        </p>
        <p className="text-[10px] text-muted-foreground">Client</p>
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold ${creativeHealth.color}`}>
          {creativeHealth.score}%
        </p>
        <p className="text-[10px] text-muted-foreground">Creative</p>
      </div>
    </div>
  );
}

export default FounderIntelOverview;
