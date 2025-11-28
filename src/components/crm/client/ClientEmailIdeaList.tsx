'use client';

/**
 * Client Email Idea List
 *
 * List of extracted ideas grouped by category (ideas, concerns, opportunities, tasks).
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Calendar,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailIdea {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  dueDate: string | null;
  confidence: number;
  createdAt: string;
  messageId: string;
}

interface ClientEmailIdeaListProps {
  clientId: string;
  className?: string;
  onIdeaSelect?: (idea: EmailIdea) => void;
  onStatusChange?: (ideaId: string, status: string) => void;
  groupByType?: boolean;
  showFilters?: boolean;
  limit?: number;
}

const typeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  action_item: { icon: CheckSquare, label: 'Action Items', color: 'text-blue-500' },
  meeting_request: { icon: Calendar, label: 'Meeting Requests', color: 'text-purple-500' },
  deadline: { icon: Clock, label: 'Deadlines', color: 'text-red-500' },
  follow_up: { icon: MessageSquare, label: 'Follow-ups', color: 'text-amber-500' },
  opportunity: { icon: TrendingUp, label: 'Opportunities', color: 'text-green-500' },
  concern: { icon: AlertTriangle, label: 'Concerns', color: 'text-orange-500' },
  feedback: { icon: MessageSquare, label: 'Feedback', color: 'text-cyan-500' },
  question: { icon: HelpCircle, label: 'Questions', color: 'text-violet-500' },
  decision_needed: { icon: Lightbulb, label: 'Decisions Needed', color: 'text-pink-500' },
};

const priorityConfig: Record<string, { color: string; bgColor: string }> = {
  urgent: { color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  high: { color: 'text-orange-700', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  medium: { color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

export function ClientEmailIdeaList({
  clientId,
  className,
  onIdeaSelect,
  onStatusChange,
  groupByType = true,
  showFilters = true,
  limit = 50,
}: ClientEmailIdeaListProps) {
  const { currentOrganization, session } = useAuth();
  const [ideas, setIdeas] = useState<EmailIdea[]>([]);
  const [grouped, setGrouped] = useState<Record<string, EmailIdea[]>>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const workspaceId = currentOrganization?.org_id;

  const fetchIdeas = async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        limit: String(limit),
      });
      if (filterType) params.set('category', filterType);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);

      const response = await fetch(
        `/api/email-intel/client/${clientId}/ideas?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      setGrouped(data.grouped || {});
      setStats(data.stats || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [clientId, workspaceId, session?.access_token, filterType, filterPriority, filterStatus]);

  const handleStatusChange = async (ideaId: string, newStatus: string) => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch(`/api/email-intel/client/${clientId}/ideas`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId, ideaId, status: newStatus }),
      });

      if (response.ok) {
        setIdeas((prev) =>
          prev.map((i) => (i.id === ideaId ? { ...i, status: newStatus as EmailIdea['status'] } : i))
        );
        onStatusChange?.(ideaId, newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
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
      </div>
    );
  }

  const renderIdea = (idea: EmailIdea) => {
    const config = typeConfig[idea.type] || typeConfig.action_item;
    const Icon = config.icon;
    const priorityStyle = priorityConfig[idea.priority] || priorityConfig.medium;

    return (
      <div
        key={idea.id}
        className={cn(
          'group flex items-start justify-between rounded-lg border p-3',
          'hover:bg-muted/50 transition-colors cursor-pointer',
          idea.status === 'completed' && 'opacity-60'
        )}
        onClick={() => onIdeaSelect?.(idea)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.color)} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                priorityStyle.bgColor,
                priorityStyle.color
              )}>
                {idea.priority}
              </span>
              {idea.dueDate && (
                <span className={cn(
                  'text-xs',
                  isOverdue(idea.dueDate, idea.status) ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  Due {formatDate(idea.dueDate)}
                </span>
              )}
            </div>
            <p className={cn(
              'text-sm font-medium',
              idea.status === 'completed' && 'line-through'
            )}>
              {idea.title}
            </p>
            {idea.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {idea.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(
              idea.id,
              idea.status === 'completed' ? 'pending' : 'completed'
            );
          }}
          className={cn(
            'shrink-0 rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-muted',
            idea.status === 'completed' ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
          )}
          title={idea.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
          <select
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">All Types</option>
            {Object.entries(typeConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* Stats */}
      {stats.total !== undefined && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{stats.total} total</span>
          {stats.overdue > 0 && (
            <span className="text-red-600">{stats.overdue} overdue</span>
          )}
          {stats.urgent > 0 && (
            <span className="text-orange-600">{stats.urgent} urgent</span>
          )}
        </div>
      )}

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="py-8 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No ideas found matching your filters.
          </p>
        </div>
      ) : groupByType ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, typeIdeas]) => {
            if (!typeIdeas || typeIdeas.length === 0) return null;
            const config = typeConfig[type] || typeConfig.action_item;
            const Icon = config.icon;

            return (
              <div key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <h3 className="text-sm font-semibold">{config.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    ({typeIdeas.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {typeIdeas.map(renderIdea)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list
        <div className="space-y-2">
          {ideas.map(renderIdea)}
        </div>
      )}
    </div>
  );
}

export default ClientEmailIdeaList;
