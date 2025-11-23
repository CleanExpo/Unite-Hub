'use client';

/**
 * Stability Indicator
 * Phase 65: Display system stability scores and trends
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  Database,
} from 'lucide-react';

interface StabilityIndicatorProps {
  title: string;
  score: number;
  trend?: 'improving' | 'stable' | 'degrading';
  type?: 'overall' | 'performance' | 'reliability' | 'resilience';
  subtitle?: string;
  showProgress?: boolean;
}

export function StabilityIndicator({
  title,
  score,
  trend = 'stable',
  type = 'overall',
  subtitle,
  showProgress = true,
}: StabilityIndicatorProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    if (s >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return '[&>div]:bg-green-500';
    if (s >= 60) return '[&>div]:bg-yellow-500';
    if (s >= 40) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'reliability':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'resilience':
        return <Activity className="h-4 w-4 text-violet-500" />;
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  const getGrade = (s: number) => {
    if (s >= 90) return 'A';
    if (s >= 80) return 'B';
    if (s >= 70) return 'C';
    if (s >= 60) return 'D';
    return 'F';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground capitalize">{trend}</span>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-lg text-muted-foreground mb-1">/100</span>
          <span className={`text-lg font-bold ml-auto ${getScoreColor(score)}`}>
            {getGrade(score)}
          </span>
        </div>

        {showProgress && (
          <Progress value={score} className={`h-2 ${getProgressColor(score)}`} />
        )}

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for grids
interface CompactStabilityProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
}

export function CompactStability({ label, score, icon }: CompactStabilityProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-500 bg-green-500/10';
    if (s >= 60) return 'text-yellow-500 bg-yellow-500/10';
    if (s >= 40) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  return (
    <div className={`p-3 rounded-lg ${getColor(score)}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{score}%</div>
    </div>
  );
}

// Heatmap cell
interface HeatmapCellProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function HeatmapCell({ value, label, size = 'md' }: HeatmapCellProps) {
  const getBackgroundColor = (v: number) => {
    if (v >= 90) return 'bg-green-500';
    if (v >= 80) return 'bg-green-400';
    if (v >= 70) return 'bg-yellow-400';
    if (v >= 60) return 'bg-yellow-500';
    if (v >= 50) return 'bg-orange-400';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(value)} rounded flex items-center justify-center text-white font-medium`}
      title={label ? `${label}: ${value}%` : `${value}%`}
    >
      {size !== 'sm' && value}
    </div>
  );
}

// Service health row
interface ServiceHealthRowProps {
  service: string;
  healthScore: number;
  responseTime: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export function ServiceHealthRow({
  service,
  healthScore,
  responseTime,
  errorRate,
  status,
}: ServiceHealthRowProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const formatService = (s: string) => {
    return s
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm">{formatService(service)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className={healthScore >= 80 ? 'text-green-500' : healthScore >= 60 ? 'text-yellow-500' : 'text-red-500'}>
          {healthScore}%
        </span>
        <span className={responseTime > 300 ? 'text-red-500' : responseTime > 200 ? 'text-yellow-500' : 'text-green-500'}>
          {responseTime}ms
        </span>
        <span className={errorRate > 0.02 ? 'text-red-500' : errorRate > 0.01 ? 'text-yellow-500' : 'text-green-500'}>
          {(errorRate * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default StabilityIndicator;
