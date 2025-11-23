'use client';

/**
 * Chaos Test Card
 * Phase 65: Display chaos test events and recovery
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Activity,
  Shield,
} from 'lucide-react';

interface ChaosTestCardProps {
  id: string;
  fault: string;
  mode: 'safe' | 'aggressive' | 'extreme';
  status: 'pending' | 'active' | 'paused' | 'completed' | 'aborted';
  started_at: string;
  completed_at?: string;
  peak_response_time: number;
  error_rate_increase: number;
  recovery_time_seconds: number;
  cascading_failures: number;
  fully_recovered: boolean;
  circuit_breakers_activated: number;
  onView?: () => void;
  onRerun?: () => void;
}

export function ChaosTestCard({
  id,
  fault,
  mode,
  status,
  started_at,
  completed_at,
  peak_response_time,
  error_rate_increase,
  recovery_time_seconds,
  cascading_failures,
  fully_recovered,
  circuit_breakers_activated,
  onView,
  onRerun,
}: ChaosTestCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          color: fully_recovered ? 'bg-green-500' : 'bg-orange-500',
          icon: fully_recovered ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />,
          text: fully_recovered ? 'Recovered' : 'Partial',
        };
      case 'active':
        return {
          color: 'bg-red-500',
          icon: <Flame className="h-3 w-3 animate-pulse" />,
          text: 'Active',
        };
      case 'paused':
        return {
          color: 'bg-yellow-500',
          icon: <Pause className="h-3 w-3" />,
          text: 'Paused',
        };
      case 'aborted':
        return {
          color: 'bg-red-500',
          icon: <XCircle className="h-3 w-3" />,
          text: 'Aborted',
        };
      default:
        return {
          color: 'bg-gray-500',
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending',
        };
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'extreme':
        return { color: 'bg-red-500', text: 'Extreme' };
      case 'aggressive':
        return { color: 'bg-orange-500', text: 'Aggressive' };
      default:
        return { color: 'bg-green-500', text: 'Safe' };
    }
  };

  const statusConfig = getStatusConfig();
  const modeConfig = getModeConfig();

  const formatFault = (f: string) => {
    return f
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-medium">
              {formatFault(fault)}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge className={modeConfig.color}>{modeConfig.text}</Badge>
            <Badge className={`${statusConfig.color} gap-1`}>
              {statusConfig.icon}
              {statusConfig.text}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Peak Response</div>
            <div className={`font-bold ${peak_response_time > 1000 ? 'text-red-500' : peak_response_time > 500 ? 'text-orange-500' : 'text-yellow-500'}`}>
              {peak_response_time}ms
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Error Increase</div>
            <div className={`font-bold ${error_rate_increase > 0.1 ? 'text-red-500' : error_rate_increase > 0.05 ? 'text-orange-500' : 'text-yellow-500'}`}>
              +{(error_rate_increase * 100).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Recovery Time</div>
            <div className={`font-bold ${recovery_time_seconds > 60 ? 'text-red-500' : recovery_time_seconds > 30 ? 'text-orange-500' : 'text-green-500'}`}>
              {recovery_time_seconds}s
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Cascades</div>
            <div className={`font-bold ${cascading_failures > 2 ? 'text-red-500' : cascading_failures > 0 ? 'text-orange-500' : 'text-green-500'}`}>
              {cascading_failures}
            </div>
          </div>
        </div>

        {/* Circuit breakers */}
        {circuit_breakers_activated > 0 && (
          <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>{circuit_breakers_activated} circuit breaker(s) activated</span>
          </div>
        )}

        {/* Recovery status */}
        <div className={`text-xs p-2 rounded ${fully_recovered ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
          {fully_recovered
            ? '✓ System fully recovered'
            : '⚠ Manual intervention may be required'}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(started_at)}
          </div>
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={onView}
                className="text-xs text-blue-500 hover:underline"
              >
                Details
              </button>
            )}
            {onRerun && status !== 'active' && (
              <button
                onClick={onRerun}
                className="text-xs text-red-500 hover:underline"
              >
                Rerun
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChaosTestCard;
