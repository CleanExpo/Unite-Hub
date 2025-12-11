'use client';

/**
 * Guardian QA Coverage Map & Blind-Spot Detector Console
 * Visualize coverage index, detect blind spots, track trends
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface CoverageSnapshot {
  snapshotDate: string;
  rulesCoverage: number;
  playbooksCoverage: number;
  scenariosCoverage: number;
  regressionPacksCoverage: number;
  playbookSimsCoverage: number;
  drillsCoverage: number;
  overallCoverage: number;
  criticalBlindSpots: number;
  highBlindSpots: number;
  mediumBlindSpots: number;
}

interface BlindSpot {
  entityType: string;
  entityId: string;
  entityName: string;
  riskLevel: string;
  coverageScore: number;
  lastTestedAt?: string;
  consecutiveUncoveredDays?: number;
}

interface TrendPoint {
  snapshotDate: string;
  overallCoverage: number;
  criticalBlindSpots: number;
}

export default function QACoveragePage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [snapshot, setSnapshot] = useState<CoverageSnapshot | null>(null);
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    loadCoverageData();
  }, [workspaceId, riskFilter]);

  async function loadCoverageData() {
    setLoading(true);
    setError(null);
    try {
      // Load snapshot
      const snapshotRes = await fetch(`/api/guardian/admin/qa-coverage/snapshot?workspaceId=${workspaceId}`);
      if (!snapshotRes.ok) {
        throw new Error('Failed to load snapshot');
      }
      const snapshotData = await snapshotRes.json();
      setSnapshot(snapshotData.data?.snapshot || null);

      // Load blind spots
      const blindSpotsUrl = new URL(`/api/guardian/admin/qa-coverage/blind-spots`, window.location.origin);
      blindSpotsUrl.searchParams.set('workspaceId', workspaceId);
      if (riskFilter) {
        blindSpotsUrl.searchParams.set('riskLevel', riskFilter);
      }

      const blindSpotsRes = await fetch(blindSpotsUrl.toString());
      if (!blindSpotsRes.ok) {
        throw new Error('Failed to load blind spots');
      }
      const blindSpotsData = await blindSpotsRes.json();
      setBlindSpots(blindSpotsData.data?.blindSpots || []);

      // Load trend
      const trendRes = await fetch(`/api/guardian/admin/qa-coverage/trend?workspaceId=${workspaceId}&lookbackDays=30`);
      if (!trendRes.ok) {
        throw new Error('Failed to load trend');
      }
      const trendData = await trendRes.json();
      setTrend(trendData.data?.trend || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage data');
    } finally {
      setLoading(false);
    }
  }

  async function createSnapshot() {
    setLoading(true);
    try {
      const res = await fetch(`/api/guardian/admin/qa-coverage/snapshot?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to create snapshot');
      }
      await loadCoverageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snapshot');
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': {
        return 'bg-red-100 text-red-800';
      }
      case 'high': {
        return 'bg-orange-100 text-orange-800';
      }
      case 'medium': {
        return 'bg-yellow-100 text-yellow-800';
      }
      default: {
        return 'bg-green-100 text-green-800';
      }
    }
  }

  return (
    <div className="p-6 bg-bg-primary min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">QA Coverage Map</h1>
          <p className="text-text-secondary">Detect untested high-risk rules and playbooks</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Analytics Only:</strong> Coverage indices are read-only aggregations from Guardian I01-I07.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={createSnapshot}
            disabled={loading}
            className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Coverage Snapshot'}
          </button>
          <button
            onClick={loadCoverageData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && <div className="text-center py-12 text-text-secondary">Loading...</div>}

        {/* Tabs */}
        {!loading && snapshot && (
          <>
            <div className="flex gap-4 mb-6 border-b border-border-subtle">
              {['overview', 'blind-spots', 'trend'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-accent-500 text-accent-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'blind-spots' ? 'Blind Spots' : 'Trend'}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-bg-card border border-border-subtle rounded-lg">
                    <p className="text-sm text-text-secondary mb-2">Overall Coverage</p>
                    <p className="text-4xl font-bold text-text-primary">
                      {(snapshot.overallCoverage * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-6 bg-bg-card border border-border-subtle rounded-lg">
                    <p className="text-sm text-text-secondary mb-2">Critical Blind Spots</p>
                    <p className="text-4xl font-bold text-red-600">{snapshot.criticalBlindSpots}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Rules', value: snapshot.rulesCoverage },
                    { label: 'Playbooks', value: snapshot.playbooksCoverage },
                    { label: 'Scenarios', value: snapshot.scenariosCoverage },
                    { label: 'Regression Packs', value: snapshot.regressionPacksCoverage },
                    { label: 'Playbook Sims', value: snapshot.playbookSimsCoverage },
                    { label: 'Drills', value: snapshot.drillsCoverage },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-bg-card border border-border-subtle rounded-lg">
                      <p className="text-sm text-text-secondary mb-2">{item.label}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-green-600`}
                            style={{ width: `${item.value * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-primary">{(item.value * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blind Spots Tab */}
            {activeTab === 'blind-spots' && (
              <div>
                <div className="mb-4 flex gap-2">
                  {['low', 'medium', 'high', 'critical'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskFilter(riskFilter === level ? null : level)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        riskFilter === level
                          ? 'bg-accent-500 text-white'
                          : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>

                {blindSpots.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    {riskFilter ? `No ${riskFilter} blind spots detected` : 'No blind spots detected'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blindSpots.map((spot) => (
                      <div
                        key={`${spot.entityType}-${spot.entityId}`}
                        className="p-4 bg-bg-card border border-border-subtle rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{spot.entityName}</h3>
                            <p className="text-sm text-text-secondary mt-1">
                              Type: {spot.entityType} | Coverage: {(spot.coverageScore * 100).toFixed(0)}%
                            </p>
                            {spot.consecutiveUncoveredDays && (
                              <p className="text-sm text-red-600 mt-1">
                                Untested for {spot.consecutiveUncoveredDays} days
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded text-sm font-medium ${getRiskColor(spot.riskLevel)}`}>
                            {spot.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trend Tab */}
            {activeTab === 'trend' && (
              <div>
                <p className="text-sm text-text-secondary mb-4">30-day coverage trend</p>
                {trend.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">No trend data available</div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
                      <h3 className="font-semibold text-text-primary mb-4">Overall Coverage Trend</h3>
                      <div className="flex items-end justify-between h-40 gap-2">
                        {trend.map((point) => {
                          const maxCoverage = Math.max(...trend.map((t) => t.overallCoverage), 0.5);
                          const height = (point.overallCoverage / maxCoverage) * 100;
                          return (
                            <div
                              key={point.snapshotDate}
                              className="flex-1 flex flex-col items-center gap-2"
                              title={`${(point.overallCoverage * 100).toFixed(0)}% on ${new Date(point.snapshotDate).toLocaleDateString()}`}
                            >
                              <div
                                className="w-full bg-green-600 rounded-t"
                                style={{ height: `${height}%` }}
                              ></div>
                              <span className="text-xs text-text-secondary">
                                {new Date(point.snapshotDate).toLocaleDateString().split('/')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
                      <h3 className="font-semibold text-text-primary mb-4">Critical Blind Spots Trend</h3>
                      <div className="space-y-2">
                        {trend.map((point) => (
                          <div key={point.snapshotDate} className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">
                              {new Date(point.snapshotDate).toLocaleDateString()}
                            </span>
                            <span className="font-medium text-text-primary">{point.criticalBlindSpots} spots</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !snapshot && (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No coverage snapshot yet</p>
            <button
              onClick={createSnapshot}
              className="px-6 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
            >
              Create First Snapshot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
