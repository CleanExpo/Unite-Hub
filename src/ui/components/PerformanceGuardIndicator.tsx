'use client';

/**
 * Performance Guard Indicator
 * Phase 58: Display system performance and tier status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Server,
  Zap,
} from 'lucide-react';

type ScalingTier = 'soft_launch' | 'hard_launch' | 'growth_phase';

interface PerformanceMetrics {
  response_time_avg_ms: number;
  error_rate_percent: number;
  queue_depth: number;
  active_jobs: number;
  cpu_usage_percent: number;
  memory_usage_percent: number;
}

interface PerformanceStatus {
  tier: ScalingTier;
  healthy: boolean;
  warnings: string[];
  metrics: PerformanceMetrics;
}

interface PerformanceGuardIndicatorProps {
  status: PerformanceStatus;
  onViewDetails?: () => void;
}

export function PerformanceGuardIndicator({
  status,
  onViewDetails,
}: PerformanceGuardIndicatorProps) {
  const getTierLabel = (tier: ScalingTier) => {
    switch (tier) {
      case 'soft_launch': return 'Soft Launch';
      case 'hard_launch': return 'Hard Launch';
      case 'growth_phase': return 'Growth';
      default: return tier;
    }
  };

  const getTierColor = (tier: ScalingTier) => {
    switch (tier) {
      case 'soft_launch': return 'bg-blue-500';
      case 'hard_launch': return 'bg-green-500';
      case 'growth_phase': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricStatus = (value: number, warning: number, critical: number) => {
    if (value >= critical) return 'critical';
    if (value >= warning) return 'warning';
    return 'healthy';
  };

  const responseStatus = getMetricStatus(status.metrics.response_time_avg_ms, 500, 2000);
  const errorStatus = getMetricStatus(status.metrics.error_rate_percent, 1, 5);
  const memoryStatus = getMetricStatus(status.metrics.memory_usage_percent, 70, 90);
  const queueStatus = getMetricStatus(status.metrics.queue_depth, 50, 200);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" />
            Performance Guard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getTierColor(status.tier)}>
              {getTierLabel(status.tier)}
            </Badge>
            {status.healthy ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            icon={<Zap className="h-3 w-3" />}
            label="Response"
            value={`${status.metrics.response_time_avg_ms}ms`}
            status={responseStatus}
          />
          <MetricBox
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Error Rate"
            value={`${status.metrics.error_rate_percent.toFixed(1)}%`}
            status={errorStatus}
          />
          <MetricBox
            icon={<Server className="h-3 w-3" />}
            label="Memory"
            value={`${status.metrics.memory_usage_percent}%`}
            status={memoryStatus}
          />
          <MetricBox
            icon={<Activity className="h-3 w-3" />}
            label="Queue"
            value={`${status.metrics.queue_depth}`}
            status={queueStatus}
          />
        </div>

        {/* Active Jobs */}
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground">Active Jobs</span>
          <span className="font-medium">{status.metrics.active_jobs}</span>
        </div>

        {/* Warnings */}
        {status.warnings.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {status.warnings.slice(0, 3).map((warning, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400"
              >
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
}) {
  const statusColors = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500',
  };

  return (
    <div className="p-2 bg-muted rounded-lg">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-medium ${statusColors[status]}`}>{value}</div>
    </div>
  );
}

export default PerformanceGuardIndicator;
