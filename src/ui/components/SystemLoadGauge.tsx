'use client';

/**
 * System Load Gauge
 * Phase 62: Display system load and capacity
 */

import { Card, CardContent } from '@/components/ui/card';
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SystemLoadGaugeProps {
  current_load: number; // 0-100
  max_capacity: number;
  trend: 'up' | 'down' | 'stable';
  label?: string;
}

export function SystemLoadGauge({
  current_load,
  max_capacity,
  trend,
  label = 'System Load',
}: SystemLoadGaugeProps) {
  const percentage = Math.round((current_load / max_capacity) * 100);

  const getLoadColor = (pct: number) => {
    if (pct >= 90) return 'text-red-500';
    if (pct >= 70) return 'text-orange-500';
    if (pct >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getLoadBgColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-orange-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (pct: number) => {
    if (pct >= 90) return 'Critical';
    if (pct >= 70) return 'High';
    if (pct >= 50) return 'Moderate';
    return 'Normal';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {getTrendIcon()}
        </div>

        {/* Gauge visualization */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${getLoadBgColor(percentage)} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className={`text-2xl font-bold ${getLoadColor(percentage)}`}>
            {percentage}%
          </span>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {current_load} / {max_capacity}
            </div>
            <div className={`text-xs font-medium ${getLoadColor(percentage)}`}>
              {getStatusText(percentage)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemLoadGauge;
