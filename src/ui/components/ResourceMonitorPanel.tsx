'use client';

/**
 * Resource Monitor Panel
 * Phase 58: Display comprehensive resource utilization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Database,
  Cpu,
  HardDrive,
  Layers,
  Image,
} from 'lucide-react';

interface ResourceMetrics {
  ai_token_usage: number;
  ai_token_limit: number;
  bandwidth_mb: number;
  storage_mb: number;
  queue_depth: number;
  cron_load: number;
  visual_job_count: number;
  visual_job_risk_score: number;
}

interface ResourceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change_percent: number;
}

interface ResourceMonitorPanelProps {
  metrics: ResourceMetrics;
  trends: ResourceTrend[];
  onViewDetails?: () => void;
}

export function ResourceMonitorPanel({
  metrics,
  trends,
  onViewDetails,
}: ResourceMonitorPanelProps) {
  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-green-500" />;
      case 'stable':
        return <ArrowRight className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 90) {
return 'bg-red-500';
}
    if (percent >= 70) {
return 'bg-yellow-500';
}
    return 'bg-green-500';
  };

  const tokenPercent = (metrics.ai_token_usage / metrics.ai_token_limit) * 100;
  const queuePercent = Math.min((metrics.queue_depth / 100) * 100, 100);
  const visualRiskPercent = metrics.visual_job_risk_score * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Resource Monitor
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Tokens */}
        <ResourceBar
          icon={<Cpu className="h-4 w-4" />}
          label="AI Tokens"
          value={metrics.ai_token_usage.toLocaleString()}
          max={metrics.ai_token_limit.toLocaleString()}
          percent={tokenPercent}
          trend={trends.find(t => t.metric === 'ai_tokens')}
        />

        {/* Storage */}
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Storage</span>
          </div>
          <div className="flex items-center gap-2">
            {trends.find(t => t.metric === 'storage') &&
              getTrendIcon(trends.find(t => t.metric === 'storage')!.direction)}
            <span className="font-medium">{metrics.storage_mb} MB</span>
          </div>
        </div>

        {/* Queue Depth */}
        <ResourceBar
          icon={<Layers className="h-4 w-4" />}
          label="Job Queue"
          value={metrics.queue_depth.toString()}
          max="100"
          percent={queuePercent}
          trend={trends.find(t => t.metric === 'queue_depth')}
        />

        {/* Visual Jobs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Visual Jobs</span>
            </div>
            <Badge variant={visualRiskPercent > 60 ? 'destructive' : 'secondary'}>
              {metrics.visual_job_count} active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Risk Score</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getStatusColor(visualRiskPercent)} transition-all`}
                style={{ width: `${visualRiskPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium">{visualRiskPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Cron Load */}
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Cron Load</span>
          </div>
          <span className={`font-medium ${
            metrics.cron_load > 0.7 ? 'text-yellow-500' :
            metrics.cron_load > 0.9 ? 'text-red-500' : ''
          }`}>
            {(metrics.cron_load * 100).toFixed(0)}%
          </span>
        </div>

        {/* Bandwidth */}
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Bandwidth</span>
          </div>
          <span className="font-medium">{metrics.bandwidth_mb} MB</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceBar({
  icon,
  label,
  value,
  max,
  percent,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  max: string;
  percent: number;
  trend?: ResourceTrend;
}) {
  const getBarColor = (percent: number) => {
    if (percent >= 90) {
return 'bg-red-500';
}
    if (percent >= 70) {
return 'bg-yellow-500';
}
    return 'bg-green-500';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-green-500" />;
      case 'stable':
        return <ArrowRight className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {trend && getTrendIcon(trend.direction)}
          <span className="text-sm font-medium">
            {value} / {max}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(percent)} transition-all`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default ResourceMonitorPanel;
