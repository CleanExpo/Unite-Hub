'use client';

/**
 * MetricTile - Dashboard stat tile with trend indicator
 * Elite Command Centre component with glassmorphism
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import type { MetricTileProps } from '../types';

// Variant colour mappings
const VARIANT_COLOURS = {
  default: {
    bg: 'bg-card',
    border: 'border-border',
    icon: 'text-muted-foreground',
  },
  success: {
    bg: 'bg-success/5',
    border: 'border-success/20',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    icon: 'text-warning',
  },
  error: {
    bg: 'bg-error/5',
    border: 'border-error/20',
    icon: 'text-error',
  },
  info: {
    bg: 'bg-info/5',
    border: 'border-info/20',
    icon: 'text-info',
  },
} as const;

// Icon mapping
const METRIC_ICONS: Record<string, React.ElementType> = {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
};

const MetricTile = React.forwardRef<HTMLDivElement, MetricTileProps>(
  (
    { label, value, change, trend = 'neutral', icon = 'Activity', variant = 'default', className },
    ref
  ) => {
    const colours = VARIANT_COLOURS[variant];
    const Icon = METRIC_ICONS[icon] ?? Activity;

    // Trend icon and colour
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColour =
      trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground';

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl border p-4',
          'backdrop-blur-sm transition-all duration-200',
          'hover:shadow-md',
          colours.bg,
          colours.border,
          className
        )}
      >
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-current to-transparent" />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Header with icon */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </span>
            <Icon size={16} className={colours.icon} />
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{value}</span>

            {/* Trend indicator */}
            {change !== undefined && (
              <div className={cn('flex items-center gap-0.5 text-xs', trendColour)}>
                <TrendIcon size={12} />
                <span className="font-medium tabular-nums">
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MetricTile.displayName = 'MetricTile';

export { MetricTile };
