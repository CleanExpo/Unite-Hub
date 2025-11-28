'use client';

/**
 * Weekly Founder Digest Page
 *
 * Displays weekly business summaries including:
 * - Executive summary with AI insights
 * - Wins and achievements
 * - Risks requiring attention
 * - Opportunities identified
 * - Action recommendations
 * - Momentum snapshot
 * - Key metrics comparison
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Target,
  Activity,
  BarChart3,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';

interface DigestWin {
  title: string;
  description: string;
  impact: string;
  linkedContactId?: string;
}

interface DigestRisk {
  title: string;
  severity: string;
  description: string;
  recommendedAction: string;
}

interface DigestOpportunity {
  title: string;
  potentialValue: number;
  description: string;
  nextStep: string;
}

interface DigestRecommendation {
  priority: number;
  title: string;
  reasoning: string;
  expectedOutcome: string;
}

interface MomentumSnapshot {
  overall: number;
  marketing: number;
  sales: number;
  delivery: number;
  product: number;
  clients: number;
  engineering: number;
  finance: number;
}

interface KeyMetrics {
  newLeads: number;
  newLeadsChange: number;
  dealsWon: number;
  dealsWonChange: number;
  revenue: number;
  revenueChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
}

interface WeeklyDigest {
  id: string;
  weekStart: string;
  weekEnd: string;
  executiveSummary: string;
  wins: DigestWin[];
  risks: DigestRisk[];
  opportunities: DigestOpportunity[];
  recommendations: DigestRecommendation[];
  momentumSnapshot: MomentumSnapshot;
  keyMetrics: KeyMetrics;
  generatedAt: string;
}

export default function WeeklyDigestPage() {
  const { session, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [digests, setDigests] = useState<WeeklyDigest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const workspaceId = currentOrganization?.org_id;
  const currentDigest = digests[currentIndex];

  const fetchDigests = async () => {
    if (!session?.access_token || !workspaceId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/founder/memory/weekly-digest?workspaceId=${workspaceId}&limit=12`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setDigests(data.digests || []);
      }
    } catch (error) {
      console.error('Failed to fetch digests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDigest = async () => {
    if (!session?.access_token || !workspaceId) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/founder/memory/weekly-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();
      if (data.success) {
        setDigests([data.digest, ...digests]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to generate digest:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchDigests();
  }, [session, workspaceId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  const getMomentumColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading digests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/founder/cognitive-twin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cognitive Twin
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Weekly Founder Digest</h1>
              <p className="text-muted-foreground">
                AI-powered business summaries delivered weekly
              </p>
            </div>
          </div>
          <button
            onClick={generateDigest}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate New Digest
          </button>
        </div>
      </div>

      {digests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h2 className="mt-4 text-xl font-semibold">No Digests Yet</h2>
          <p className="mt-2 text-muted-foreground">
            Generate your first weekly digest to get an AI-powered summary of your business.
          </p>
          <button
            onClick={generateDigest}
            disabled={generating}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate First Digest
          </button>
        </div>
      ) : (
        <>
          {/* Digest Navigation */}
          <div className="mb-6 flex items-center justify-between rounded-lg border bg-card p-4">
            <button
              onClick={() => setCurrentIndex(Math.min(currentIndex + 1, digests.length - 1))}
              disabled={currentIndex >= digests.length - 1}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Older
            </button>
            <div className="text-center">
              <p className="font-medium">
                Week of {formatDate(currentDigest.weekStart)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentDigest.weekStart)} - {formatDate(currentDigest.weekEnd)}
              </p>
            </div>
            <button
              onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
              disabled={currentIndex <= 0}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Newer
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Executive Summary */}
          <div className="mb-6 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Executive Summary
            </h2>
            <p className="text-lg leading-relaxed">{currentDigest.executiveSummary}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Generated {formatDate(currentDigest.generatedAt)}
            </div>
          </div>

          {/* Key Metrics */}
          {currentDigest.keyMetrics && (
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{currentDigest.keyMetrics.newLeads}</p>
                <p className={`text-sm ${getChangeColor(currentDigest.keyMetrics.newLeadsChange)}`}>
                  {currentDigest.keyMetrics.newLeadsChange > 0 ? '+' : ''}
                  {currentDigest.keyMetrics.newLeadsChange}% vs last week
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Deals Won</p>
                <p className="text-2xl font-bold">{currentDigest.keyMetrics.dealsWon}</p>
                <p className={`text-sm ${getChangeColor(currentDigest.keyMetrics.dealsWonChange)}`}>
                  {currentDigest.keyMetrics.dealsWonChange > 0 ? '+' : ''}
                  {currentDigest.keyMetrics.dealsWonChange}% vs last week
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(currentDigest.keyMetrics.revenue)}</p>
                <p className={`text-sm ${getChangeColor(currentDigest.keyMetrics.revenueChange)}`}>
                  {currentDigest.keyMetrics.revenueChange > 0 ? '+' : ''}
                  {currentDigest.keyMetrics.revenueChange}% vs last week
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{currentDigest.keyMetrics.avgResponseTime}h</p>
                <p className={`text-sm ${getChangeColor(-currentDigest.keyMetrics.responseTimeChange)}`}>
                  {currentDigest.keyMetrics.responseTimeChange > 0 ? '+' : ''}
                  {currentDigest.keyMetrics.responseTimeChange}% vs last week
                </p>
              </div>
            </div>
          )}

          {/* Momentum Snapshot */}
          {currentDigest.momentumSnapshot && (
            <div className="mb-6 rounded-xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                Momentum Snapshot
                <span className="ml-auto text-2xl font-bold">
                  {currentDigest.momentumSnapshot.overall}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-7">
                {Object.entries(currentDigest.momentumSnapshot)
                  .filter(([key]) => key !== 'overall')
                  .map(([domain, score]) => (
                    <div key={domain} className="text-center">
                      <div className="mx-auto mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${getMomentumColor(score as number)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-xs capitalize text-muted-foreground">{domain}</p>
                      <p className="font-medium">{score as number}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Wins */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Wins This Week ({currentDigest.wins?.length || 0})
              </h2>
              {currentDigest.wins?.length > 0 ? (
                <div className="space-y-4">
                  {currentDigest.wins.map((win, i) => (
                    <div key={i} className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                      <p className="font-medium text-green-800 dark:text-green-200">{win.title}</p>
                      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                        {win.description}
                      </p>
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Impact: {win.impact}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No wins recorded this week</p>
              )}
            </div>

            {/* Risks */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Risks to Address ({currentDigest.risks?.length || 0})
              </h2>
              {currentDigest.risks?.length > 0 ? (
                <div className="space-y-4">
                  {currentDigest.risks.map((risk, i) => (
                    <div key={i} className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-red-800 dark:text-red-200">{risk.title}</p>
                        <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs text-red-800 dark:bg-red-800 dark:text-red-200">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {risk.description}
                      </p>
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Action: {risk.recommendedAction}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No significant risks identified</p>
              )}
            </div>

            {/* Opportunities */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Lightbulb className="h-5 w-5 text-green-500" />
                Opportunities ({currentDigest.opportunities?.length || 0})
              </h2>
              {currentDigest.opportunities?.length > 0 ? (
                <div className="space-y-4">
                  {currentDigest.opportunities.map((opp, i) => (
                    <div key={i} className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-blue-800 dark:text-blue-200">{opp.title}</p>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {formatCurrency(opp.potentialValue)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        {opp.description}
                      </p>
                      <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Next: {opp.nextStep}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No new opportunities identified</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Target className="h-5 w-5 text-purple-500" />
                Recommendations ({currentDigest.recommendations?.length || 0})
              </h2>
              {currentDigest.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {currentDigest.recommendations
                    .sort((a, b) => a.priority - b.priority)
                    .map((rec, i) => (
                      <div key={i} className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                            {rec.priority}
                          </span>
                          <div>
                            <p className="font-medium text-purple-800 dark:text-purple-200">
                              {rec.title}
                            </p>
                            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                              {rec.reasoning}
                            </p>
                            <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                              Expected: {rec.expectedOutcome}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific recommendations this week</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
