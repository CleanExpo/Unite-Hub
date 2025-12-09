'use client';

/**
 * Capacity Status Bar
 * Phase 66: Visual bar for capacity utilization
 */

import { Progress } from '@/components/ui/progress';

interface CapacityStatusBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CapacityStatusBar({
  label,
  value,
  max,
  unit = '',
  thresholds = { warning: 75, critical: 90 },
  showPercentage = true,
  size = 'md',
}: CapacityStatusBarProps) {
  const percentage = Math.min(100, (value / max) * 100);

  const getStatus = (): 'healthy' | 'warning' | 'critical' => {
    if (percentage >= thresholds.critical) {
return 'critical';
}
    if (percentage >= thresholds.warning) {
return 'warning';
}
    return 'healthy';
  };

  const status = getStatus();

  const getColor = () => {
    switch (status) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'critical':
        return '[&>div]:bg-red-500';
      case 'warning':
        return '[&>div]:bg-yellow-500';
      default:
        return '[&>div]:bg-green-500';
    }
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const formatValue = (v: number) => {
    if (v >= 1000000) {
return `${(v / 1000000).toFixed(1)}M`;
}
    if (v >= 1000) {
return `${(v / 1000).toFixed(1)}K`;
}
    return v.toFixed(0);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getColor()}`}>
            {formatValue(value)}{unit && ` ${unit}`}
          </span>
          <span className="text-xs text-muted-foreground">
            / {formatValue(max)}{unit && ` ${unit}`}
          </span>
          {showPercentage && (
            <span className={`text-xs font-bold ${getColor()}`}>
              ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      </div>
      <Progress value={percentage} className={`${sizeClasses[size]} ${getProgressColor()}`} />
    </div>
  );
}

// Compact version for grids
interface CompactCapacityBarProps {
  label: string;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

export function CompactCapacityBar({ label, percentage, status }: CompactCapacityBarProps) {
  const getColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-yellow-500' : ''}>{percentage}%</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

// Multi-segment capacity bar
interface SegmentedCapacityBarProps {
  segments: {
    label: string;
    value: number;
    color: string;
  }[];
  total: number;
}

export function SegmentedCapacityBar({ segments, total }: SegmentedCapacityBarProps) {
  return (
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded-full overflow-hidden flex">
        {segments.map((segment, i) => (
          <div
            key={i}
            className={`h-full ${segment.color} transition-all`}
            style={{ width: `${(segment.value / total) * 100}%` }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${segment.color}`} />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CapacityStatusBar;
