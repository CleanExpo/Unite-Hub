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
    if (score > 0.3) return '#00FF88';
    if (score < -0.3) return '#FF4444';
    return '#FFB800';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return TrendingUp;
    if (score < -0.3) return AlertTriangle;
    return TrendingUp;
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn('rounded-sm border bg-white/[0.02] border-white/[0.06] p-4', className)}>
        <div className="flex items-center gap-2 text-white/30">
          <Mail className="h-5 w-5" />
          <span className="text-sm font-mono">No email history with this client.</span>
        </div>
      </div>
    );
  }

  const SentimentIcon = getSentimentIcon(summary.averageSentiment);
  const sentimentColor = getSentimentColor(summary.averageSentiment);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        <div className="flex items-center gap-1 font-mono text-white/40">
          <MessageSquare className="h-4 w-4" />
          <span>{summary.totalMessages} emails</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-white/40">
          <Lightbulb className="h-4 w-4" />
          <span>{summary.pendingIdeas} pending</span>
        </div>
        <div className="flex items-center gap-1 font-mono" style={{ color: sentimentColor }}>
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
        {[
          { icon: Mail,         label: 'Threads',         value: summary.totalThreads },
          { icon: MessageSquare,label: 'Messages',         value: summary.totalMessages },
          { icon: Lightbulb,    label: 'Pending Actions',  value: summary.pendingIdeas },
          { icon: Target,       label: 'Engagement',       value: `${summary.engagementScore}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-sm bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-white/30">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-mono">{label}</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {summary.lastEmailAt && (
          <div className="flex items-center gap-1 font-mono text-white/30">
            <Clock className="h-4 w-4" />
            <span>Last contact: {new Date(summary.lastEmailAt).toLocaleDateString()}</span>
          </div>
        )}
        {briefing?.relationshipDuration && (
          <div className="flex items-center gap-1 font-mono text-white/30">
            <Calendar className="h-4 w-4" />
            <span>{briefing.relationshipDuration} relationship</span>
          </div>
        )}
        <div className="flex items-center gap-1 font-mono" style={{ color: sentimentColor }}>
          <SentimentIcon className="h-4 w-4" />
          <span>{briefing?.overallSentiment || 'Neutral'} sentiment</span>
        </div>
        <button
          onClick={() => fetchSummary(true)}
          disabled={isRefreshing}
          className="ml-auto inline-flex items-center gap-1 text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Meeting Briefing */}
      {showBriefing && briefing && (
        <div className="rounded-sm border bg-white/[0.02] border-white/[0.06]">
          <button
            onClick={() => setIsBriefingExpanded(!isBriefingExpanded)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: '#00F5FF' }} />
              <span className="font-mono font-medium text-white">Meeting Briefing</span>
            </div>
            {isBriefingExpanded ? (
              <ChevronUp className="h-5 w-5 text-white/30" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white/30" />
            )}
          </button>

          {isBriefingExpanded && (
            <div className="space-y-4 border-t border-white/[0.06] px-4 pb-4 pt-2">
              {/* AI Summary */}
              {summary.insights?.summary && (
                <div>
                  <span className="text-xs font-mono uppercase text-white/30">
                    Overview
                  </span>
                  <p className="mt-1 text-sm text-white/70">{summary.insights.summary}</p>
                </div>
              )}

              {/* Key Topics */}
              {briefing.keyTopics.length > 0 && (
                <div>
                  <span className="text-xs font-mono uppercase text-white/30">
                    Key Topics
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {briefing.keyTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="rounded-sm bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-xs font-mono text-white/60"
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
                  <span className="text-xs font-mono uppercase text-white/30">
                    Talking Points
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.talkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: '#00F5FF' }}>•</span>
                        <span className="text-white/70">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {briefing.opportunitySignals.length > 0 && (
                <div>
                  <span className="text-xs font-mono uppercase text-white/30">
                    Opportunities
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.opportunitySignals.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2" style={{ color: '#00FF88' }}>
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
                  <span className="text-xs font-mono uppercase text-white/30">
                    Risks to Address
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.riskIndicators.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2" style={{ color: '#FFB800' }}>
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
                  <span className="text-xs font-mono uppercase text-white/30">
                    Suggested Actions
                  </span>
                  <ul className="mt-1 space-y-1 text-sm">
                    {briefing.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="h-4 w-4 shrink-0" style={{ color: '#00F5FF' }} />
                        <span className="text-white/70">{action}</span>
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
