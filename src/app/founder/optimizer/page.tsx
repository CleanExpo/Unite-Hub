'use client';

/**
 * Execution Optimizer Dashboard
 * Real-time monitoring and control of workflow execution optimization
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizerStatusPanel, type OptimizerStatusData } from '@/components/optimizer/OptimizerStatusPanel';
import { AdaptationTimeline, type ProfileHistoryItem } from '@/components/optimizer/AdaptationTimeline';
import { OptimizedStepPreview } from '@/components/optimizer/OptimizedStepPreview';
import { OptimizerStatsPanel, type OptimizationPattern, type DailyMetric } from '@/components/optimizer/OptimizerStatsPanel';
import { AlertCircle, RefreshCw, Zap, Settings } from 'lucide-react';

interface OptimizationRun {
  optimizationId: string;
  workflowId: string;
  parallelismLevel: number;
  riskScore: number;
  expectedDuration: number;
  expectedCost: number;
  contextSizeAdjustment: number;
  selectedAgents: Array<{ stepId: string; agent: string }>;
  stepOrdering: string[];
  appliedSuccessfully: boolean;
}

interface AdaptationProfile {
  profileId: string;
  profileName: string;
  adaptationScore: number;
  resourceCostEstimate: number;
  resourceDurationEstimate: number;
  adaptations: {
    parallelismReduction: number;
    reasoningTokenReduction: number;
    contextSizeReduction: number;
    agentSwitchRecommendations: string[];
    orderingOptimizations: string[];
  };
  explainabilityNotes: string;
  createdAt: string;
}

export default function OptimizerPage() {
  const { currentOrganization, session } = useAuth();
  const [statusData, setStatusData] = useState<OptimizerStatusData | null>(null);
  const [profileHistory, setProfileHistory] = useState<ProfileHistoryItem[]>([]);
  const [patterns, setPatterns] = useState<OptimizationPattern[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyMetric[]>([]);
  const [lastRun, setLastRun] = useState<OptimizationRun | null>(null);
  const [currentProfile, setCurrentProfile] = useState<AdaptationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const workspaceId = currentOrganization?.org_id;

  const fetchOptimizerStatus = async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      setRefreshing(true);
      const response = await fetch(`/api/optimizer/status?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();

      setStatusData(data.status && data.metrics ? data : null);
      setPatterns(data.patterns || []);
      setDailyTrends(data.trends?.dailyMetrics || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch optimizer status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAdaptationProfile = async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch(`/api/optimizer/profile?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();

      setCurrentProfile(data.currentProfile);
      setProfileHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch adaptation profile:', err);
    }
  };

  useEffect(() => {
    if (!workspaceId || !session?.access_token) return;

    setLoading(true);
    Promise.all([fetchOptimizerStatus(), fetchAdaptationProfile()]).then(() => {
      setLoading(false);
    });

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchOptimizerStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [workspaceId, session?.access_token]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-gray-700 dark:text-gray-300">Please log in to access the optimizer</p>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-gray-700 dark:text-gray-300">No workspace selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Execution Optimizer</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Real-time workflow optimization and adaptation
                </p>
              </div>
            </div>
            <button
              onClick={fetchOptimizerStatus}
              disabled={refreshing}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Status & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <OptimizerStatusPanel
                data={statusData || undefined}
                loading={loading}
                onRefresh={fetchOptimizerStatus}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <OptimizerStatsPanel
                patterns={patterns}
                dailyTrends={dailyTrends}
                totalOptimizations={statusData?.status?.totalOptimizationsRun || 0}
                loading={loading}
              />
            </div>
          </div>

          {/* Center Column - Optimization Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Profile */}
            {currentProfile && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Profile</h2>
                </div>

                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Profile Name</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {currentProfile.profileName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Adaptation Score</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {currentProfile.adaptationScore}/100
                      </p>
                    </div>
                  </div>

                  {/* Resource Estimates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Cost Estimate</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${currentProfile.resourceCostEstimate.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Duration Est.</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(currentProfile.resourceDurationEstimate)}ms
                      </p>
                    </div>
                  </div>

                  {/* Adaptations Applied */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Adaptations Applied</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Parallelism</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {currentProfile.adaptations.parallelismReduction > 0 ? '+' : ''}
                          {currentProfile.adaptations.parallelismReduction}%
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Reasoning Tokens</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {currentProfile.adaptations.reasoningTokenReduction > 0 ? '+' : ''}
                          {currentProfile.adaptations.reasoningTokenReduction}%
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Context Size</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {currentProfile.adaptations.contextSizeReduction > 0 ? '+' : ''}
                          {currentProfile.adaptations.contextSizeReduction}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Explainability */}
                  {currentProfile.explainabilityNotes && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Explanation
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {currentProfile.explainabilityNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optimized Steps Preview */}
            {lastRun && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <OptimizedStepPreview
                  selectedAgents={lastRun.selectedAgents}
                  parallelismLevel={lastRun.parallelismLevel}
                  riskScore={lastRun.riskScore}
                  stepOrdering={lastRun.stepOrdering}
                />
              </div>
            )}

            {/* Profile History Timeline */}
            {profileHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <AdaptationTimeline history={profileHistory} loading={loading} />
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-white">Loading optimizer data...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
