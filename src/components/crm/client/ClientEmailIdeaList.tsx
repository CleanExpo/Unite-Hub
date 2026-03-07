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
  action_item:      { icon: CheckSquare,    label: 'Action Items',      color: '#00F5FF' },
  meeting_request:  { icon: Calendar,       label: 'Meeting Requests',   color: '#FF00FF' },
  deadline:         { icon: Clock,          label: 'Deadlines',          color: '#FF4444' },
  follow_up:        { icon: MessageSquare,  label: 'Follow-ups',         color: '#FFB800' },
  opportunity:      { icon: TrendingUp,     label: 'Opportunities',      color: '#00FF88' },
  concern:          { icon: AlertTriangle,  label: 'Concerns',           color: '#FFB800' },
  feedback:         { icon: MessageSquare,  label: 'Feedback',           color: '#00F5FF' },
  question:         { icon: HelpCircle,     label: 'Questions',          color: '#FF00FF' },
  decision_needed:  { icon: Lightbulb,      label: 'Decisions Needed',   color: '#FFB800' },
};

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  urgent: { color: '#FF4444', bg: 'rgba(255,68,68,0.10)',   border: 'rgba(255,68,68,0.25)' },
  high:   { color: '#FFB800', bg: 'rgba(255,184,0,0.10)',   border: 'rgba(255,184,0,0.25)' },
  medium: { color: '#FFB800', bg: 'rgba(255,184,0,0.06)',   border: 'rgba(255,184,0,0.15)' },
  low:    { color: '#ffffff40', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
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
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <p className="text-sm font-mono" style={{ color: '#FF4444' }}>{error}</p>
      </div>
    );
  }

  const renderIdea = (idea: EmailIdea) => {
    const config = typeConfig[idea.type] || typeConfig.action_item;
    const Icon = config.icon;
    const pStyle = priorityConfig[idea.priority] || priorityConfig.medium;

    return (
      <div
        key={idea.id}
        className={cn(
          'group flex items-start justify-between rounded-sm border p-3',
          'bg-white/[0.02] border-white/[0.06]',
          'hover:bg-white/[0.04] hover:border-white/[0.10] transition-colors cursor-pointer',
          idea.status === 'completed' && 'opacity-60'
        )}
        onClick={() => onIdeaSelect?.(idea)}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: config.color }} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded-sm px-2 py-0.5 text-xs font-mono border"
                style={{ color: pStyle.color, backgroundColor: pStyle.bg, borderColor: pStyle.border }}
              >
                {idea.priority}
              </span>
              {idea.dueDate && (
                <span className={cn(
                  'text-xs font-mono',
                  isOverdue(idea.dueDate, idea.status) ? 'text-[#FF4444]' : 'text-white/30'
                )}>
                  Due {formatDate(idea.dueDate)}
                </span>
              )}
            </div>
            <p className={cn(
              'text-sm font-medium font-mono text-white',
              idea.status === 'completed' && 'line-through'
            )}>
              {idea.title}
            </p>
            {idea.description && (
              <p className="text-xs text-white/40 line-clamp-2">
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
            'shrink-0 rounded-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-white/[0.04]',
          )}
          style={{ color: idea.status === 'completed' ? '#00FF88' : 'rgba(255,255,255,0.3)' }}
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
          <Filter className="h-4 w-4 text-white/30" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-sm border bg-white/[0.03] border-white/[0.08] text-white px-2 py-1 text-sm font-mono"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
          <select
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="rounded-sm border bg-white/[0.03] border-white/[0.08] text-white px-2 py-1 text-sm font-mono"
          >
            <option value="">All Types</option>
            {Object.entries(typeConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={filterPriority || ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="rounded-sm border bg-white/[0.03] border-white/[0.08] text-white px-2 py-1 text-sm font-mono"
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
        <div className="flex flex-wrap gap-3 text-xs font-mono text-white/30">
          <span>{stats.total} total</span>
          {stats.overdue > 0 && (
            <span style={{ color: '#FF4444' }}>{stats.overdue} overdue</span>
          )}
          {stats.urgent > 0 && (
            <span style={{ color: '#FFB800' }}>{stats.urgent} urgent</span>
          )}
        </div>
      )}

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="py-8 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-2 text-sm font-mono text-white/30">
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
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                  <h3 className="text-sm font-semibold font-mono text-white">{config.label}</h3>
                  <span className="text-xs font-mono text-white/30">
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
