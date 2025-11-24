'use client';

/**
 * Orchestration Schedule Table
 * Phase 84: View planned schedules by channel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface Schedule {
  id: string;
  channel: string;
  scheduled_for: string;
  status: string;
  risk_level: string;
  priority: number;
  content_preview?: {
    title?: string;
  };
  blocked_reason?: string;
}

interface OrchestrationScheduleTableProps {
  schedules: Schedule[];
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export function OrchestrationScheduleTable({
  schedules,
  onApprove,
  onCancel,
  className = '',
}: OrchestrationScheduleTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'blocked':
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'ready':
      case 'executing':
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'blocked':
      case 'failed':
        return 'text-red-500 bg-red-500/10';
      case 'ready':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (schedules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No scheduled posts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Scheduled Posts
          <Badge variant="secondary" className="ml-auto">
            {schedules.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(schedule.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {schedule.channel.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      {schedule.content_preview?.title || 'Untitled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatTime(schedule.scheduled_for)}</span>
                    <span className={getRiskColor(schedule.risk_level)}>
                      {schedule.risk_level} risk
                    </span>
                  </div>
                  {schedule.blocked_reason && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertTriangle className="h-3 w-3" />
                      {schedule.blocked_reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${getStatusColor(schedule.status)}`}>
                  {schedule.status}
                </Badge>

                {schedule.status === 'pending' && onApprove && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onApprove(schedule.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}

                {['pending', 'ready'].includes(schedule.status) && onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-500"
                    onClick={() => onCancel(schedule.id)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
