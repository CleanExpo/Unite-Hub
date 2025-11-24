'use client';

/**
 * Execution History Table
 * Phase 87: Display posting execution results
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ExecutionResult {
  id: string;
  createdAt: string;
  channel: string;
  status: string;
  externalPostId?: string;
  externalUrl?: string;
  errorMessage?: string;
  retryCount: number;
  forcedBy?: string;
}

interface ExecutionHistoryTableProps {
  executions: ExecutionResult[];
  onRetry?: (executionId: string) => void;
  onRollback?: (executionId: string) => void;
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
  pending: { icon: Play, color: 'text-yellow-500', label: 'Pending' },
  success: { icon: CheckCircle, color: 'text-green-500', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  rolled_back: { icon: RotateCcw, color: 'text-blue-500', label: 'Rolled Back' },
};

export function ExecutionHistoryTable({
  executions,
  onRetry,
  onRollback,
  className = '',
}: ExecutionHistoryTableProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (executions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Play className="h-4 w-4" />
            Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No executions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Play className="h-4 w-4" />
          Execution History
          <Badge variant="secondary" className="ml-auto">
            {executions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {executions.map(execution => {
            const statusInfo = statusConfig[execution.status] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={execution.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <Badge className={channelColors[execution.channel] || 'bg-gray-500'}>
                      {execution.channel.toUpperCase()}
                    </Badge>
                    {execution.forcedBy && (
                      <Badge variant="outline" className="text-[10px]">
                        Forced
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(execution.createdAt)}
                  </span>
                </div>

                {/* Post ID and URL */}
                {execution.externalPostId && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Post ID: {execution.externalPostId.substring(0, 20)}...
                    {execution.externalUrl && (
                      <a
                        href={execution.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Error message */}
                {execution.errorMessage && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{execution.errorMessage}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-2 flex items-center gap-2">
                  {execution.status === 'failed' && execution.retryCount < 3 && onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(execution.id)}
                      className="h-6 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry ({3 - execution.retryCount} left)
                    </Button>
                  )}
                  {execution.status === 'success' && onRollback && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRollback(execution.id)}
                      className="h-6 text-xs text-red-500 hover:text-red-600"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
