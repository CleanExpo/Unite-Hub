'use client';

/**
 * Rollback Table
 * Phase 87: Display rollback actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
} from 'lucide-react';

interface RollbackResult {
  id: string;
  createdAt: string;
  channel: string;
  status: string;
  externalPostId?: string;
  errorMessage?: string;
  reason: string;
  completedAt?: string;
}

interface RollbackTableProps {
  rollbacks: RollbackResult[];
  className?: string;
}

const channelColors: Record<string, string> = {
  fb: 'bg-blue-500',
  ig: 'bg-pink-500',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-500',
  gmb: 'bg-green-500',
  reddit: 'bg-orange-500',
  email: 'bg-gray-500',
  x: 'bg-black',
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  success: { icon: CheckCircle, color: 'text-green-500', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  not_supported: { icon: Ban, color: 'text-gray-500', label: 'Not Supported' },
};

export function RollbackTable({ rollbacks, className = '' }: RollbackTableProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (rollbacks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Rollbacks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No rollbacks yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Rollbacks
          <Badge variant="secondary" className="ml-auto">
            {rollbacks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {rollbacks.map(rollback => {
            const statusInfo = statusConfig[rollback.status] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={rollback.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <Badge className={channelColors[rollback.channel] || 'bg-gray-500'}>
                      {rollback.channel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(rollback.createdAt)}
                  </span>
                </div>

                {/* Post ID */}
                {rollback.externalPostId && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Post ID: {rollback.externalPostId.substring(0, 20)}...
                  </div>
                )}

                {/* Reason */}
                <div className="mt-2 text-xs text-muted-foreground">
                  Reason: {rollback.reason}
                </div>

                {/* Error message */}
                {rollback.errorMessage && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{rollback.errorMessage}</span>
                  </div>
                )}

                {/* Completion time */}
                {rollback.completedAt && (
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Completed: {formatTime(rollback.completedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
