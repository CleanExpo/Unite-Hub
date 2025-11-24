'use client';

/**
 * Posting Attempt Table
 * Phase 85: Shows publish attempts, failures, truth notes
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface PostingAttempt {
  id: string;
  schedule_id: string;
  channel: string;
  attempted_at: string;
  status: string;
  error_message?: string;
  truth_notes?: string;
  confidence_score: number;
  platform_post_id?: string;
}

interface PostingAttemptTableProps {
  attempts: PostingAttempt[];
  onRetry?: (attemptId: string) => void;
  onViewDetails?: (attemptId: string) => void;
  className?: string;
}

export function PostingAttemptTable({
  attempts,
  onRetry,
  onViewDetails,
  className = '',
}: PostingAttemptTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'draft_created':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Send className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-500 bg-green-500/10';
      case 'draft_created':
        return 'text-blue-500 bg-blue-500/10';
      case 'blocked':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'failed':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (attempts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Send className="h-4 w-4" />
            Posting Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            No posting attempts yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Send className="h-4 w-4" />
          Posting Attempts
          <Badge variant="secondary" className="ml-auto">
            {attempts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {attempts.map(attempt => (
            <div
              key={attempt.id}
              className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(attempt.status)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {attempt.channel.toUpperCase()}
                    </Badge>
                    <Badge className={`text-[10px] ${getStatusColor(attempt.status)}`}>
                      {attempt.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatTime(attempt.attempted_at)}</span>
                    <span>•</span>
                    <span>{Math.round(attempt.confidence_score * 100)}% conf</span>
                  </div>

                  {attempt.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate max-w-[300px]">
                      {attempt.error_message}
                    </p>
                  )}

                  {attempt.truth_notes && (
                    <p className="text-[10px] text-blue-500 mt-1 truncate max-w-[300px]">
                      {attempt.truth_notes.split('\n')[0]}
                    </p>
                  )}

                  {attempt.platform_post_id && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ID: {attempt.platform_post_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onViewDetails && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onViewDetails(attempt.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}

                {attempt.status === 'failed' && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onRetry(attempt.id)}
                  >
                    <RefreshCw className="h-3 w-3" />
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
