'use client';

/**
 * Client Email Summary Header
 *
 * Summary header showing counts, last contact date, and a short LLM-generated
 * briefing for upcoming meetings.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Lightbulb,
  Clock,
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingBriefing {
  clientName: string;
  relationshipDuration: string;
  lastContactAt: string | null;
  communicationFrequency: string;
  overallSentiment: string;
  engagementScore: number;
  keyTopics: string[];
  talkingPoints: string[];
  riskIndicators: string[];
  opportunitySignals: string[];
  suggestedActions: string[];
}

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
  insights?: {
    summary: string;
    keyTopics: string[];
    suggestedActions: string[];
    riskIndicators: string[];
    opportunitySignals: string[];
  };
}

interface ClientEmailSummaryHeaderProps {
  clientId: string;
  className?: string;
  showBriefing?: boolean;
  meetingContext?: string;
  compact?: boolean;
}

export function ClientEmailSummaryHeader({
  clientId,
  className,
  showBriefing = true,
  meetingContext,
  compact = false,
}: ClientEmailSummaryHeaderProps) {
  const { currentOrganization, session } = useAuth();
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [briefing, setBriefing] = useState<MeetingBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);

  const workspaceId = currentOrganization?.org_id;

  const fetchSummary = async (refresh = false) => {
    if (!workspaceId || !session?.access_token) return;

    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ workspaceId });
      if (meetingContext) params.set('meetingContext', meetingContext);

      const response = await fetch(
        `/api/email-intel/client/${clientId}/summary?${params}`,
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
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setBriefing(data.meetingBriefing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [clientId, workspaceId, session?.access_token, meetingContext]);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return TrendingUp;
    if (score < -0.3) return AlertTriangle;
    return TrendingUp;
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn('rounded-lg border bg-muted/50 p-4', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-5 w-5" />
          <span className="text-sm">No email history with this client.</span>
        </div>
      </div>
    );
  }

  const SentimentIcon = getSentimentIcon(summary.averageSentiment);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span>{summary.totalMessages} emails</span>
        </div>
        <div className="flex items-center gap-1">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <span>{summary.pendingIdeas} pending</span>
        </div>
        <div className={cn('flex items-center gap-1', getSentimentColor(summary.averageSentiment))}>
          <SentimentIcon className="h-4 w-4" />
          <span>{briefing?.overallSentiment || 'Neutral'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-xs">Threads</span>
          </div>
          <div className="mt-1 text-xl font-bold">{summary.totalThreads}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Messages</span>
          </div>
          <div className="mt-1 text-xl font-bold">{summary.totalMessages}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs">Pending Actions</span>
          </div>
          <div className="mt-1 text-xl font-bold">{summary.pendingIdeas}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-xs">Engagement</span>
          </div>
          <div className="mt-1 text-xl font-bold">{summary.engagementScore}%</div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {summary.lastEmailAt && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last contact: {new Date(summary.lastEmailAt).toLocaleDateString()}</span>
          </div>
        )}
        {briefing?.relationshipDuration && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{briefing.relationshipDuration} relationship</span>
          </div>
        )}
        <div className={cn('flex items-center gap-1', getSentimentColor(summary.averageSentiment))}>
          <SentimentIcon className="h-4 w-4" />
          <span>{briefing?.overallSentiment || 'Neutral'} sentiment</span>
        </div>
        <button
          onClick={() => fetchSummary(true)}
          disabled={isRefreshing}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Meeting Briefing */}
      {showBriefing && briefing && (
        <div className="rounded-lg border bg-card">
          <button
            onClick={() => setIsBriefingExpanded(!isBriefingExpanded)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Meeting Briefing</span>
            </div>
            {isBriefingExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {isBriefingExpanded && (
            <div className="space-y-4 border-t px-4 pb-4 pt-2">
              {/* AI Summary */}
              {summary.insights?.summary && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Overview
                  </span>
                  <p className="mt-1 text-sm">{summary.insights.summary}</p>
                </div>
              )}

              {/* Key Topics */}
              {briefing.keyTopics.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Key Topics
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {briefing.keyTopics.map((topic, i) => (
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

              {/* Talking Points */}
              {briefing.talkingPoints.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Talking Points
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.talkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {briefing.opportunitySignals.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Opportunities
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.opportunitySignals.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {briefing.riskIndicators.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Risks to Address
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.riskIndicators.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Actions */}
              {briefing.suggestedActions.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Suggested Actions
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="h-4 w-4 shrink-0 text-primary" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientEmailSummaryHeader;
