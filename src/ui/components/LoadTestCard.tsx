'use client';

/**
 * Load Test Card
 * Phase 65: Display load test results
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

interface LoadTestCardProps {
  id: string;
  scenario: string;
  status: 'pending' | 'running' | 'completed' | 'aborted' | 'failed';
  started_at: string;
  completed_at?: string;
  total_requests: number;
  error_rate: number;
  avg_response_time: number;
  requests_per_second: number;
  bottlenecks: string[];
  onView?: () => void;
  onRerun?: () => void;
}

export function LoadTestCard({
  id,
  scenario,
  status,
  started_at,
  completed_at,
  total_requests,
  error_rate,
  avg_response_time,
  requests_per_second,
  bottlenecks,
  onView,
  onRerun,
}: LoadTestCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          icon: <CheckCircle2 className="h-3 w-3" />,
          text: 'Completed',
        };
      case 'running':
        return {
          color: 'bg-blue-500',
          icon: <Activity className="h-3 w-3 animate-pulse" />,
          text: 'Running',
        };
      case 'aborted':
        return {
          color: 'bg-orange-500',
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Aborted',
        };
      case 'failed':
        return {
          color: 'bg-red-500',
          icon: <XCircle className="h-3 w-3" />,
          text: 'Failed',
        };
      default:
        return {
          color: 'bg-gray-500',
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const formatScenario = (s: string) => {
    return s
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

  const getErrorRateColor = (rate: number) => {
    if (rate >= 0.05) {
return 'text-red-500';
}
    if (rate >= 0.02) {
return 'text-orange-500';
}
    if (rate >= 0.01) {
return 'text-yellow-500';
}
    return 'text-green-500';
  };

  const getResponseTimeColor = (time: number) => {
    if (time >= 500) {
return 'text-red-500';
}
    if (time >= 300) {
return 'text-orange-500';
}
    if (time >= 200) {
return 'text-yellow-500';
}
    return 'text-green-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm font-medium">
              {formatScenario(scenario)}
            </CardTitle>
          </div>
          <Badge className={`${statusConfig.color} gap-1`}>
            {statusConfig.icon}
            {statusConfig.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Requests</div>
            <div className="font-bold">{total_requests.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">RPS</div>
            <div className="font-bold">{requests_per_second}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Avg Response</div>
            <div className={`font-bold ${getResponseTimeColor(avg_response_time)}`}>
              {avg_response_time}ms
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Error Rate</div>
            <div className={`font-bold ${getErrorRateColor(error_rate)}`}>
              {(error_rate * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Error rate progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Error Threshold</span>
            <span>{(error_rate * 100).toFixed(1)}% / 5%</span>
          </div>
          <Progress
            value={Math.min(100, (error_rate / 0.05) * 100)}
            className={`h-1 ${error_rate > 0.05 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
          />
        </div>

        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Bottlenecks</div>
            <div className="flex flex-wrap gap-1">
              {bottlenecks.slice(0, 2).map((bottleneck, i) => (
                <Badge key={i} variant="outline" className="text-xs text-orange-500">
                  {bottleneck.length > 30 ? bottleneck.slice(0, 30) + '...' : bottleneck}
                </Badge>
              ))}
              {bottlenecks.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{bottlenecks.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

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
            {onRerun && status !== 'running' && (
              <button
                onClick={onRerun}
                className="text-xs text-violet-500 hover:underline"
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

export default LoadTestCard;
