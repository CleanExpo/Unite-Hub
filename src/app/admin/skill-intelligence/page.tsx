'use client';

/**
 * Skill Intelligence Dashboard
 * Admin UI visualizing all skill analytics from /reports
 */

import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

interface DashboardData {
  svie: any;
  drift: any;
  heatmap: any;
  appm: any;
  srre: any;
}

export default function SkillIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/skill-intelligence');
        if (!response.ok) throw new Error('Failed to load dashboard data');
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading skill intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-red-400 mb-2">Error Loading Dashboard</h2>
                <p className="text-red-300">{error || 'No data available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const svie = data.svie || {};
  const drift = data.drift || {};
  const heatmap = data.heatmap || {};
  const appm = data.appm || {};
  const srre = data.srre || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Skill Intelligence Dashboard
          </h1>
          <p className="text-text-secondary">
            Real-time analytics and recommendations for skill portfolio management
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Skills"
            value={svie.totalSkills || 0}
            icon={<Zap className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            label="Drift Issues"
            value={drift.issues?.length || 0}
            icon={<AlertTriangle className="w-6 h-6" />}
            color={drift.overallDriftScore > 50 ? 'red' : 'yellow'}
          />
          <StatCard
            label="Risk Score"
            value={appm.overallRiskScore || 0}
            subtitle="/100"
            icon={<AlertCircle className="w-6 h-6" />}
            color={appm.riskClassification === 'high-risk' ? 'red' : appm.riskClassification === 'medium-risk' ? 'yellow' : 'green'}
          />
          <StatCard
            label="Refactors Needed"
            value={srre.skillsRequiringRefactor || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* SVIE Summary */}
          <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Skill Value Intelligence (SVIE)
            </h2>
            {svie.summary && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-text-secondary">High Value Skills</span>
                  <span className="font-semibold text-accent-500">
                    {svie.summary.highValueSkills?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-text-secondary">Underutilized</span>
                  <span className="font-semibold text-yellow-500">
                    {svie.summary.underutilizedSkills?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-text-secondary">Poor Health</span>
                  <span className="font-semibold text-red-500">
                    {svie.summary.poorHealthSkills?.length || 0}
                  </span>
                </div>
              </div>
            )}
            {svie.insights && (
              <div className="mt-4 space-y-2 border-t border-border-subtle pt-4">
                {svie.insights.slice(0, 3).map((insight: string, i: number) => (
                  <p key={i} className="text-sm text-text-secondary">
                    • {insight}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* APPM Risk Summary */}
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Agent Performance Prediction
            </h2>
            <div className="space-y-3">
              <div className="text-center p-4 bg-slate-800 rounded">
                <div className="text-3xl font-bold text-accent-500 mb-2">
                  {appm.overallRiskScore || 0}
                </div>
                <div className={`text-sm font-semibold ${
                  appm.riskClassification === 'high-risk' ? 'text-red-500' :
                  appm.riskClassification === 'medium-risk' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {(appm.riskClassification || 'unknown').toUpperCase()}
                </div>
              </div>
              <div className="text-sm space-y-2">
                <p><span className="text-text-secondary">High Risk Skills:</span> <span className="font-semibold text-red-500">{appm.highRiskSkills?.length || 0}</span></p>
                <p><span className="text-text-secondary">Medium Risk Skills:</span> <span className="font-semibold text-yellow-500">{appm.mediumRiskSkills?.length || 0}</span></p>
                <p><span className="text-text-secondary">Low Risk Skills:</span> <span className="font-semibold text-green-500">{appm.lowRiskSkills?.length || 0}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Analysis */}
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Skill Heatmap Analysis
          </h2>
          {heatmap.zoneDistribution && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <HeatZoneCard
                zone="🔥 Super-Hot"
                count={heatmap.zoneDistribution.superhotCore || 0}
                color="red"
              />
              <HeatZoneCard
                zone="🟠 Hot Strategic"
                count={heatmap.zoneDistribution.hotStrategic || 0}
                color="orange"
              />
              <HeatZoneCard
                zone="🟡 Warm"
                count={heatmap.zoneDistribution.warmMaintained || 0}
                color="yellow"
              />
              <HeatZoneCard
                zone="🔵 Cool"
                count={heatmap.zoneDistribution.coolUnderutilized || 0}
                color="blue"
              />
              <HeatZoneCard
                zone="🟣 Frozen"
                count={heatmap.zoneDistribution.frozenDeprecated || 0}
                color="purple"
              />
            </div>
          )}
        </div>

        {/* Drift Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Drift Detection Summary
            </h2>
            {drift.driftByCategory && (
              <div className="space-y-2">
                {Object.entries(drift.driftByCategory).map(([category, count]: [string, any]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                    <span className="text-sm text-text-secondary">{category.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-accent-500">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {drift.criticalDrifts?.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded">
                <p className="text-sm text-red-400 font-semibold">
                  ⚠️ {drift.criticalDrifts.length} Critical Issue{drift.criticalDrifts.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* SRRE Summary */}
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Refactor Recommendations
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-text-secondary">Skills Needing Refactor</span>
                <span className="font-semibold text-accent-500">
                  {srre.skillsRequiringRefactor || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-text-secondary">Critical Refactors</span>
                <span className="font-semibold text-red-500">
                  {srre.criticalRefactors?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-text-secondary">High-ROI Opportunities</span>
                <span className="font-semibold text-yellow-500">
                  {srre.highROIRefactors?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                <span className="text-text-secondary">Est. Total Effort</span>
                <span className="font-semibold text-text-primary">
                  {Math.round(srre.estimatedTotalHours || 0)}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* APPM Insights */}
          {appm.insights && appm.insights.length > 0 && (
            <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent-500" />
                Performance Insights
              </h3>
              <div className="space-y-2">
                {appm.insights.map((insight: string, i: number) => (
                  <p key={i} className="text-sm text-text-secondary">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* SRRE Insights */}
          {srre.insights && srre.insights.length > 0 && (
            <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-500" />
                Refactoring Insights
              </h3>
              <div className="space-y-2">
                {srre.insights.map((insight: string, i: number) => (
                  <p key={i} className="text-sm text-text-secondary">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-accent-500/10 to-accent-500/5 border border-accent-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent-500" />
            Executive Recommendations
          </h3>
          <div className="space-y-3">
            {appm.recommendations?.slice(0, 2).map((rec: string, i: number) => (
              <div key={`appm-${i}`} className="text-sm text-text-secondary">
                • {rec}
              </div>
            ))}
            {srre.recommendations?.slice(0, 2).map((rec: string, i: number) => (
              <div key={`srre-${i}`} className="text-sm text-text-secondary">
                • {rec}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-text-secondary border-t border-border-subtle pt-6">
          <p>Dashboard last updated: {new Date().toLocaleString()}</p>
          <p className="mt-2 text-xs">
            All data is read-only and derived from analysis reports in <code className="bg-slate-800 px-2 py-1 rounded">/reports</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  subtitle,
  icon,
  color
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'yellow' | 'green' | 'orange';
}) {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-500/10',
    red: 'text-red-500 bg-red-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    green: 'text-green-500 bg-green-500/10',
    orange: 'text-orange-500 bg-orange-500/10'
  };

  return (
    <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
      <div className={`${colorMap[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-text-secondary text-sm mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-text-primary">{value}</p>
        {subtitle && <p className="text-text-secondary text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

/**
 * Heat Zone Card Component
 */
function HeatZoneCard({
  zone,
  count,
  color
}: {
  zone: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-lg p-4 text-center`}>
      <div className="text-2xl mb-2">{zone.split(' ')[0]}</div>
      <p className="text-xs text-text-secondary mb-2">{zone.split(' ').slice(1).join(' ')}</p>
      <p className="text-2xl font-bold text-text-primary">{count}</p>
    </div>
  );
}
