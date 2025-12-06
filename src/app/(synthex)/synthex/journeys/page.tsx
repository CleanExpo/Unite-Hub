'use client';

/**
 * Synthex Journeys Page
 *
 * Displays customer journey analysis with cohorts, stage distribution,
 * and journey progression tracking.
 *
 * Phase: B14 - Cohort-Based Journey Analysis
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  Map,
  Clock,
  Zap,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
} from 'lucide-react';

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  avgScore: number;
  color: string | null;
}

interface Journey {
  id: string;
  contactId: string;
  currentStage: string;
  stageScore: number;
  totalScore: number;
  stagesVisited: string[];
  daysInCurrentStage: number;
  velocityScore: number | null;
  predictedNextStage: string | null;
  conversionProbability: number | null;
  isActive: boolean;
  completedAt: string | null;
  droppedAt: string | null;
  lastActivityAt: string;
  cohort?: Cohort;
}

interface Analytics {
  stageDistribution: Record<string, number>;
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  droppedJourneys: number;
  conversionRate: number | null;
  avgVelocityScore: number | null;
}

const STAGES = ['awareness', 'consideration', 'decision', 'retention', 'advocacy'];

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      // Load cohorts and journeys in parallel
      const [cohortsRes, journeysRes] = await Promise.all([
        fetch(`/api/synthex/cohorts?tenantId=${tenantId}`),
        fetch(
          `/api/synthex/journeys?tenantId=${tenantId}&includeAnalytics=true${
            selectedCohort ? `&cohortId=${selectedCohort}` : ''
          }`
        ),
      ]);

      const cohortsData = await cohortsRes.json();
      const journeysData = await journeysRes.json();

      if (!cohortsRes.ok) throw new Error(cohortsData.error);
      if (!journeysRes.ok) throw new Error(journeysData.error);

      setCohorts(cohortsData.cohorts || []);
      setJourneys(journeysData.journeys || []);
      setAnalytics(journeysData.analytics || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedCohort]);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId, selectedCohort, loadData]);

  const getStageBadgeColor = (stage: string) => {
    const colors: Record<string, string> = {
      awareness: 'bg-purple-500/20 text-purple-400',
      consideration: 'bg-blue-500/20 text-blue-400',
      decision: 'bg-yellow-500/20 text-yellow-400',
      retention: 'bg-green-500/20 text-green-400',
      advocacy: 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[stage] || 'bg-gray-700 text-gray-400';
  };

  const getStatusIcon = (journey: Journey) => {
    if (journey.completedAt) return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (journey.droppedAt) return <XCircle className="h-4 w-4 text-red-400" />;
    if (!journey.isActive) return <Pause className="h-4 w-4 text-gray-400" />;
    return <TrendingUp className="h-4 w-4 text-blue-400" />;
  };

  const getVelocityColor = (velocity: number | null) => {
    if (!velocity) return 'text-gray-400';
    if (velocity >= 0.7) return 'text-green-400';
    if (velocity >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Journey Analysis</h1>
            <p className="text-gray-500 mt-1">
              Track customer journeys through cohort-based stages
            </p>
          </div>
        </div>

        {/* Tenant ID Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Tenant ID..."
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>
              <Button
                onClick={loadData}
                disabled={loading || !tenantId}
                className="bg-gray-700 hover:bg-gray-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Load Journeys'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
            <p className="text-gray-500 mt-4">Loading journey data...</p>
          </div>
        )}

        {/* Cohort Filter */}
        {!loading && cohorts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCohort === null ? 'default' : 'outline'}
              onClick={() => setSelectedCohort(null)}
              className={
                selectedCohort === null
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'border-gray-600 text-gray-400'
              }
            >
              All Journeys
            </Button>
            {cohorts.map((cohort) => (
              <Button
                key={cohort.id}
                size="sm"
                variant={selectedCohort === cohort.id ? 'default' : 'outline'}
                onClick={() => setSelectedCohort(cohort.id)}
                className={
                  selectedCohort === cohort.id
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'border-gray-600 text-gray-400'
                }
              >
                {cohort.name} ({cohort.memberCount})
              </Button>
            ))}
          </div>
        )}

        {/* Analytics Summary */}
        {!loading && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">
                      {analytics.totalJourneys}
                    </p>
                    <p className="text-sm text-gray-500">Total Journeys</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">
                      {analytics.activeJourneys}
                    </p>
                    <p className="text-sm text-gray-500">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">
                      {analytics.completedJourneys}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">
                      {analytics.droppedJourneys}
                    </p>
                    <p className="text-sm text-gray-500">Dropped</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-gray-100">
                      {analytics.conversionRate
                        ? `${(analytics.conversionRate * 100).toFixed(1)}%`
                        : '—'}
                    </p>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stage Distribution */}
        {!loading && analytics && Object.keys(analytics.stageDistribution).length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Stage Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-32">
                {STAGES.map((stage) => {
                  const count = analytics.stageDistribution[stage] || 0;
                  const maxCount = Math.max(...Object.values(analytics.stageDistribution), 1);
                  const height = (count / maxCount) * 100;

                  return (
                    <div key={stage} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        <span className="text-sm font-bold text-gray-100 mb-1">
                          {count}
                        </span>
                        <div
                          className={`w-full rounded-t ${getStageBadgeColor(stage).replace('text-', 'bg-').replace('/20', '')}`}
                          style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-2 capitalize">
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && tenantId && journeys.length === 0 && (
          <div className="py-12 text-center">
            <Map className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Journeys Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Create journeys for contacts to track their progression through your funnel.
            </p>
          </div>
        )}

        {/* Journeys List */}
        {!loading && journeys.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Journeys ({journeys.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {journeys.map((journey) => {
                const isExpanded = expandedId === journey.id;

                return (
                  <Card key={journey.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(journey)}
                          <div>
                            <p className="text-sm text-gray-400">
                              Contact: {journey.contactId.slice(0, 8)}...
                            </p>
                            {journey.cohort && (
                              <p className="text-xs text-gray-500">
                                Cohort: {journey.cohort.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStageBadgeColor(journey.currentStage)}>
                          {journey.currentStage}
                        </Badge>
                      </div>

                      {/* Stage Progress */}
                      <div className="mb-4">
                        <div className="flex items-center gap-1">
                          {STAGES.map((stage, i) => {
                            const isVisited = journey.stagesVisited.includes(stage);
                            const isCurrent = journey.currentStage === stage;
                            return (
                              <div key={stage} className="flex items-center">
                                <div
                                  className={`h-2 flex-1 rounded ${
                                    isVisited || isCurrent
                                      ? isCurrent
                                        ? 'bg-orange-500'
                                        : 'bg-green-500'
                                      : 'bg-gray-700'
                                  }`}
                                  style={{ width: '40px' }}
                                />
                                {i < STAGES.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-gray-600 mx-1" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-2 bg-gray-900 rounded text-center">
                          <p className="text-xl font-bold text-gray-100">
                            {journey.totalScore}
                          </p>
                          <p className="text-xs text-gray-500">Total Score</p>
                        </div>
                        <div className="p-2 bg-gray-900 rounded text-center">
                          <p className="text-xl font-bold text-gray-100">
                            {journey.daysInCurrentStage}
                          </p>
                          <p className="text-xs text-gray-500">Days in Stage</p>
                        </div>
                        <div className="p-2 bg-gray-900 rounded text-center">
                          <p
                            className={`text-xl font-bold ${getVelocityColor(
                              journey.velocityScore
                            )}`}
                          >
                            {journey.velocityScore
                              ? journey.velocityScore.toFixed(2)
                              : '—'}
                          </p>
                          <p className="text-xs text-gray-500">Velocity</p>
                        </div>
                      </div>

                      {/* Expand/Collapse */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-400 hover:text-gray-100"
                        onClick={() => setExpandedId(isExpanded ? null : journey.id)}
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </Button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-gray-700 space-y-3 mt-4">
                          {/* Predictions */}
                          {journey.predictedNextStage && (
                            <div className="p-3 bg-gray-900 rounded">
                              <p className="text-xs text-gray-500 mb-1">
                                Predicted Next Stage
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={getStageBadgeColor(
                                    journey.predictedNextStage
                                  )}
                                >
                                  {journey.predictedNextStage}
                                </Badge>
                                {journey.conversionProbability && (
                                  <span className="text-sm text-green-400">
                                    {(journey.conversionProbability * 100).toFixed(0)}%
                                    probability
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stages Visited */}
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              Stages Visited
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {journey.stagesVisited.map((stage) => (
                                <Badge
                                  key={stage}
                                  className={getStageBadgeColor(stage)}
                                >
                                  {stage}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="text-xs text-gray-500">
                            <p>
                              Last activity:{' '}
                              {new Date(journey.lastActivityAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
