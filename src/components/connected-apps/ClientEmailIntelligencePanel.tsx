'use client';

/**
 * Client Email Intelligence Panel
 *
 * Panel component for displaying email intelligence for a CRM client.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailSummary {
  clientId: string;
  clientName: string;
  totalThreads: number;
  totalMessages: number;
  totalIdeas: number;
  pendingIdeas: number;
  averageSentiment: number;
  lastEmailAt: string | null;
  engagementScore: number;
}

interface CommunicationInsights {
  summary: string;
  keyTopics: string[];
  recentActivity: string;
  suggestedActions: string[];
  riskIndicators: string[];
  opportunitySignals: string[];
}

interface EmailIdea {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  confidence: number;
  createdAt: string;
}

interface ClientEmailIntelligencePanelProps {
  clientId: string;
  className?: string;
  compact?: boolean;
}

export function ClientEmailIntelligencePanel({
  clientId,
  className,
  compact = false,
}: ClientEmailIntelligencePanelProps) {
  const { currentOrganization, session } = useAuth();
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [insights, setInsights] = useState<CommunicationInsights | null>(null);
  const [ideas, setIdeas] = useState<EmailIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'ideas'])
  );

  const workspaceId = currentOrganization?.org_id;

  const fetchData = async (refresh = false) => {
    if (!workspaceId || !session?.access_token) return;

    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/email-intel/client/${clientId}?workspaceId=${workspaceId}&includeInsights=true`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setSummary(null);
          return;
        }
        throw new Error('Failed to fetch email intelligence');
      }

      const data = await response.json();
      setSummary(data.summary);
      setInsights(data.insights);

      // Fetch ideas separately
      const ideasResponse = await fetch(
        `/api/email-intel/ideas?workspaceId=${workspaceId}&clientId=${clientId}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (ideasResponse.ok) {
        const ideasData = await ideasResponse.json();
        setIdeas(ideasData.ideas || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId, workspaceId, session?.access_token]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleUpdateIdeaStatus = async (ideaId: string, status: string) => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch('/api/email-intel/ideas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId, ideaId, status }),
      });

      if (response.ok) {
        setIdeas((prev) =>
          prev.map((i) => (i.id === ideaId ? { ...i, status } : i))
        );
      }
    } catch (err) {
      console.error('Failed to update idea:', err);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary || summary.totalThreads === 0) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-5 w-5" />
          <span>No email communication history with this client.</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{summary.totalMessages} emails</span>
          </div>
          <span
            className={cn(
              'text-sm font-medium',
              getSentimentColor(summary.averageSentiment)
            )}
          >
            {getSentimentLabel(summary.averageSentiment)}
          </span>
        </div>
        {summary.pendingIdeas > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Lightbulb className="h-4 w-4" />
            <span>{summary.pendingIdeas} pending actions</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Intelligence</h3>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Messages</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.totalMessages}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs">Pending Actions</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.pendingIdeas}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Engagement</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{summary.engagementScore}%</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Last Contact</span>
          </div>
          <div className="mt-1 text-sm font-medium">
            {summary.lastEmailAt
              ? new Date(summary.lastEmailAt).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="rounded-lg border bg-card">
          <button
            onClick={() => toggleSection('insights')}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="font-medium">AI Communication Insights</span>
            {expandedSections.has('insights') ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.has('insights') && (
            <div className="space-y-4 border-t px-4 pb-4 pt-2">
              <p className="text-sm text-muted-foreground">{insights.summary}</p>

              {insights.keyTopics.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Key Topics
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {insights.keyTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {insights.suggestedActions.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Suggested Actions
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {insights.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.riskIndicators.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Risk Indicators
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {insights.riskIndicators.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Ideas */}
      {ideas.length > 0 && (
        <div className="rounded-lg border bg-card">
          <button
            onClick={() => toggleSection('ideas')}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="font-medium">
              Pending Actions ({ideas.filter((i) => i.status !== 'completed').length})
            </span>
            {expandedSections.has('ideas') ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.has('ideas') && (
            <div className="space-y-2 border-t p-4">
              {ideas
                .filter((i) => i.status !== 'completed' && i.status !== 'dismissed')
                .slice(0, 5)
                .map((idea) => (
                  <div
                    key={idea.id}
                    className="flex items-start justify-between rounded-md bg-muted/50 p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            getPriorityColor(idea.priority)
                          )}
                        >
                          {idea.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {idea.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{idea.title}</p>
                      {idea.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(idea.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUpdateIdeaStatus(idea.id, 'completed')}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-green-600"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientEmailIntelligencePanel;
