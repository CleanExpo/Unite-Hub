'use client';

/**
 * Client Email Thread List
 *
 * List of email threads for a client with last message preview and timestamp.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Mail,
  ChevronRight,
  Clock,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailThread {
  id: string;
  externalThreadId: string;
  subject: string;
  snippet: string;
  provider: 'google' | 'microsoft';
  messageCount: number;
  lastMessageAt: string;
  participants: Array<{ name: string; email: string }>;
}

interface ClientEmailThreadListProps {
  clientId: string;
  className?: string;
  onThreadSelect?: (thread: EmailThread) => void;
  selectedThreadId?: string;
  compact?: boolean;
  limit?: number;
}

export function ClientEmailThreadList({
  clientId,
  className,
  onThreadSelect,
  selectedThreadId,
  compact = false,
  limit = 20,
}: ClientEmailThreadListProps) {
  const { currentOrganization, session } = useAuth();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const workspaceId = currentOrganization?.org_id;

  const fetchThreads = async (refresh = false) => {
    if (!workspaceId || !session?.access_token) return;

    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/email-intel/client/${clientId}/threads?workspaceId=${workspaceId}&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      setThreads(data.threads || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [clientId, workspaceId, session?.access_token, page]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => fetchThreads(true)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No email threads found for this client.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-muted-foreground">
          {threads.length} thread{threads.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => fetchThreads(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Thread List */}
      <div className="space-y-1">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onThreadSelect?.(thread)}
            className={cn(
              'w-full text-left rounded-lg border p-3 transition-colors',
              'hover:bg-muted/50',
              selectedThreadId === thread.id && 'bg-muted border-primary',
              compact && 'p-2'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    'truncate font-medium',
                    compact ? 'text-sm' : 'text-base'
                  )}>
                    {thread.subject || '(No subject)'}
                  </h4>
                </div>
                {!compact && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {thread.snippet}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatDate(thread.lastMessageAt)}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {thread.messageCount}
                </div>
              </div>
            </div>
            {!compact && thread.participants.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                {thread.participants.slice(0, 3).map((p, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5">
                    {p.name || p.email}
                  </span>
                ))}
                {thread.participants.length > 3 && (
                  <span>+{thread.participants.length - 3} more</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded px-2 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded px-2 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ClientEmailThreadList;
