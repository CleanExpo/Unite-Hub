'use client';

/**
 * Production Job Timeline Component
 * Phase 50: Displays job status history timeline
 */

import { Badge } from '@/components/ui/badge';
import {
  Clock, CheckCircle, AlertTriangle, XCircle, Play, FileText, RotateCcw, Eye
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  notes?: string;
  userId?: string;
}

interface ProductionJobTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

export function ProductionJobTimeline({
  events,
  currentStatus,
}: ProductionJobTimelineProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: Clock, color: 'text-gray-500', label: 'Pending' },
      queued: { icon: Clock, color: 'text-blue-500', label: 'Queued' },
      processing: { icon: Play, color: 'text-purple-500', label: 'Processing' },
      draft: { icon: FileText, color: 'text-amber-500', label: 'Draft Created' },
      review: { icon: Eye, color: 'text-orange-500', label: 'In Review' },
      revision: { icon: RotateCcw, color: 'text-yellow-500', label: 'Revision Requested' },
      approved: { icon: CheckCircle, color: 'text-green-500', label: 'Approved' },
      completed: { icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
      cancelled: { icon: XCircle, color: 'text-gray-500', label: 'Cancelled' },
      failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
    };
    return configs[status] || configs.pending;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = getStatusConfig(event.status);
        const Icon = config.icon;
        const isLast = index === events.length - 1;
        const isCurrent = event.status === currentStatus;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div className={`p-1.5 rounded-full ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              {!isLast && (
                <div className="w-0.5 h-full bg-muted mt-1" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={`font-medium text-sm ${isCurrent ? config.color : 'text-foreground'}`}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              {event.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProductionJobTimeline;
