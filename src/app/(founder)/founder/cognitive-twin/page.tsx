'use client';

/**
 * Founder Cognitive Twin Dashboard
 *
 * Main dashboard for the Founder Cognitive Twin engine showing:
 * - Momentum scores across 7 business domains
 * - Top opportunities and risks
 * - Cross-client patterns
 * - Next action recommendations
 * - Quick access to forecasts, scenarios, and weekly digests
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  Calendar,
  ArrowRight,
  RefreshCw,
  Loader2,
  Activity,
  Shield,
  Sparkles,
  Clock,
  ChevronRight,
  BarChart3,
  Zap,
} from 'lucide-react';
import { MomentumRadar } from '@/components/founder-memory/MomentumRadar';
import { OpportunityCard } from '@/components/founder-memory/OpportunityCard';
import { RiskCard } from '@/components/founder-memory/RiskCard';
import { NextActionCard } from '@/components/founder-memory/NextActionCard';
import { PatternCard } from '@/components/founder-memory/PatternCard';
import { OverloadIndicator } from '@/components/founder-memory/OverloadIndicator';

type TrendDirection = 'up' | 'down' | 'stable';

interface MomentumData {
  overallScore: number;
  scores: {
    marketing: { score: number; trend: TrendDirection };
    sales: { score: number; trend: TrendDirection };
    delivery: { score: number; trend: TrendDirection };
    product: { score: number; trend: TrendDirection };
    clients: { score: number; trend: TrendDirection };
    engineering: { score: number; trend: TrendDirection };
    finance: { score: number; trend: TrendDirection };
  };
}

interface Opportunity {
  id: string;
  category: string;
  title: string;
  description: string;
  potentialValue: number;
  confidenceScore: number;
  urgencyScore: number;
  status: string;
}

interface Risk {
  id: string;
  category: string;
  title: string;
  description: string;
  riskScore: number;
  severityScore: number;
  mitigationStatus: string;
}

interface NextAction {
  id: string;
  category: string;
  urgency: string;
  title: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  estimatedEffort: string;
}

interface Pattern {
  id: string;
  patternType: string;
  title: string;
  description: string;
  strengthScore: number;
  recurrenceCount: number;
}

interface OverloadAnalysis {
  overallSeverity: string;
  overallScore: number;
  recommendations: string[];
}

export default function CognitiveTwinDashboardPage() {
  const { session, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [overload, setOverload] = useState<OverloadAnalysis | null>(null);
  const [lastDigest, setLastDigest] = useState<{ id: string; weekStart: string } | null>(null);

  const workspaceId = currentOrganization?.org_id;

  const fetchData = async (isRefresh = false) => {
    if (!session?.access_token || !workspaceId) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };

      // Fetch all data in parallel
      const [
        momentumRes,
        opportunitiesRes,
        risksRes,
        actionsRes,
        patternsRes,
        overloadRes,
        digestRes,
      ] = await Promise.all([
        fetch(`/api/founder/memory/momentum?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/founder/memory/opportunities?workspaceId=${workspaceId}&limit=5`, { headers }),
        fetch(`/api/founder/memory/risks?workspaceId=${workspaceId}&limit=5`, { headers }),
        fetch(`/api/founder/memory/next-actions?workspaceId=${workspaceId}&limit=5`, { headers }),
        fetch(`/api/founder/memory/patterns?workspaceId=${workspaceId}&limit=5`, { headers }),
        fetch(`/api/founder/memory/overload?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/founder/memory/weekly-digest?workspaceId=${workspaceId}&limit=1`, { headers }),
      ]);

      const [momentumData, opportunitiesData, risksData, actionsData, patternsData, overloadData, digestData] =
        await Promise.all([
          momentumRes.json(),
          opportunitiesRes.json(),
          risksRes.json(),
          actionsRes.json(),
          patternsRes.json(),
          overloadRes.json(),
          digestRes.json(),
        ]);

      if (momentumData.success && momentumData.momentum) {
        setMomentum(momentumData.momentum);
      }
      if (opportunitiesData.success) {
        setOpportunities(opportunitiesData.opportunities || []);
      }
      if (risksData.success) {
        setRisks(risksData.risks || []);
      }
      if (actionsData.success) {
        setNextActions(actionsData.actions || []);
      }
      if (patternsData.success) {
        setPatterns(patternsData.patterns || []);
      }
      if (overloadData.success && overloadData.analysis) {
        setOverload(overloadData.analysis);
      }
      if (digestData.success && digestData.digests?.[0]) {
        setLastDigest(digestData.digests[0]);
      }
    } catch (error) {
      console.error('Failed to fetch cognitive twin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, workspaceId]);

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your Cognitive Twin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Cognitive Twin</h1>
            <p className="text-muted-foreground">
              Your AI-powered business intelligence assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overload Warning */}
      {overload && overload.overallSeverity !== 'none' && (
        <OverloadIndicator analysis={overload} className="mb-6" />
      )}

      {/* Quick Links */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/founder/cognitive-twin/weekly-digest"
          className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-muted-foreground">
                {lastDigest ? `Last: ${new Date(lastDigest.weekStart).toLocaleDateString()}` : 'Generate your first digest'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/founder/cognitive-twin/decision-scenarios"
          className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Decision Simulator</p>
              <p className="text-sm text-muted-foreground">Test strategic moves</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/founder/cognitive-twin/forecast"
          className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Strategic Forecasts</p>
              <p className="text-sm text-muted-foreground">6W, 12W, 1Y projections</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Momentum */}
        <div className="lg:col-span-1">
          {/* Overall Momentum */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                Business Momentum
              </h2>
              {momentum && (
                <span className={`text-3xl font-bold ${getScoreColor(momentum.overallScore)}`}>
                  {momentum.overallScore}
                </span>
              )}
            </div>

            {momentum ? (
              <>
                <MomentumRadar scores={momentum.scores} />
                <div className="mt-4 space-y-2">
                  {Object.entries(momentum.scores).map(([domain, data]) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">{domain}</span>
                      <div className="flex items-center gap-2">
                        <span className={getScoreColor(data.score)}>{data.score}</span>
                        {getTrendIcon(data.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No momentum data yet</p>
                <p className="text-sm">Data will appear as activity is tracked</p>
              </div>
            )}
          </div>

          {/* Cross-Client Patterns */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Patterns Detected
              </h2>
              <span className="text-sm text-muted-foreground">{patterns.length} found</span>
            </div>
            {patterns.length > 0 ? (
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <PatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Sparkles className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No patterns detected yet</p>
                <p className="text-sm">Patterns emerge as more data is collected</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Actions & Opportunities */}
        <div className="lg:col-span-1">
          {/* Next Actions */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Zap className="h-5 w-5 text-yellow-500" />
                What to Do Next
              </h2>
              <Link
                href="/founder/cognitive-twin/next-actions"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {nextActions.length > 0 ? (
              <div className="space-y-3">
                {nextActions.slice(0, 3).map((action) => (
                  <NextActionCard key={action.id} action={action} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Zap className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No recommendations yet</p>
                <p className="text-sm">Actions will be suggested as data grows</p>
              </div>
            )}
          </div>

          {/* Top Opportunities */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Lightbulb className="h-5 w-5 text-green-500" />
                Top Opportunities
              </h2>
              <Link
                href="/founder/cognitive-twin/opportunities"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.slice(0, 3).map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Lightbulb className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No opportunities identified yet</p>
                <p className="text-sm">Keep engaging with clients to find opportunities</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Risks */}
        <div className="lg:col-span-1">
          {/* Top Risks */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 text-red-500" />
                Risk Register
              </h2>
              <Link
                href="/founder/cognitive-twin/risks"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {risks.length > 0 ? (
              <div className="space-y-3">
                {risks.map((risk) => (
                  <RiskCard key={risk.id} risk={risk} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Shield className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No risks identified</p>
                <p className="text-sm">Risks are detected from client sentiment and activity</p>
              </div>
            )}
          </div>

          {/* AI Insights CTA */}
          <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <Brain className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Cognitive Twin continuously analyzes your business data to provide
              actionable insights, predict outcomes, and help you make better decisions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                Cross-client patterns
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                Strategic forecasts
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                Decision simulation
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                Overload detection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
