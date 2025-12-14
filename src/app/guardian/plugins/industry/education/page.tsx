'use client';

/**
 * Campus Operations Dashboard
 * Displays operational disruption, environmental risk, and stability signals
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Users, Zap, Shield, Clock } from 'lucide-react';
import type { CampusOversightSnapshot } from '@/lib/guardian/plugins/industry-education-campus/types';
import { deriveCampusSignals } from '@/lib/guardian/plugins/industry-education-campus/signalService';
import { generateNarrative, formatNarrativeForUI } from '@/lib/guardian/plugins/narrativeService';

export default function CampusOperationsDashboard() {
  const [snapshot, setSnapshot] = useState<CampusOversightSnapshot | null>(null);
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate aggregate campus data
        const aggregateData = {
          incidents24h: 12,
          incidents7d: 65,
          incidents30d: 250,
          alerts24h: 18,
          alerts7d: 95,
          correlations24h: 2,
          facilityIssues24h: 3,
          facilityIssues7d: 15,
          afterhoursIncidents24h: 4,
          afterhoursIncidents7d: 25,
          avgResolutionTime: 4.2,
          escalations24h: 1,
          peakHourVolume: 8,
          currentRiskLabel: 'medium' as const,
          riskTrend: 'stable' as const,
          unresolved7d: 5,
          staffingLevel: 'normal' as const
        };

        const data = await deriveCampusSignals(aggregateData);
        setSnapshot(data);

        // Generate narrative summary
        const narrativeData = await generateNarrative('Campus Operations', {
          signalCount: data.signals.length,
          status: data.overview.responseStatus,
          warnings: data.warnings
        });
        setNarrative(formatNarrativeForUI(narrativeData));
      } catch (error) {
        console.error('Failed to load campus operations data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-text-secondary">
        Loading campus operations dashboard...
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-6 text-center text-text-secondary">
        Unable to load campus operations data
      </div>
    );
  }

  const riskColor =
    snapshot.overview.responseStatus === 'critical'
      ? 'text-red-600'
      : snapshot.overview.responseStatus === 'delayed'
        ? 'text-yellow-600'
        : 'text-green-600';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Campus Operations</h1>
            <p className="text-sm text-text-secondary mt-1">
              Generated {new Date(snapshot.generatedAt).toLocaleString()}
            </p>
          </div>
          <Shield className="h-8 w-8 text-accent-500" />
        </div>
      </div>

      {/* Executive Brief */}
      {narrative && (
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Executive Brief</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary font-medium">Incidents (24h)</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {snapshot.overview.totalIncidents24h}
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary font-medium">Escalations (24h)</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {Math.round(snapshot.overview.escalationRate)}%
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary font-medium">Response Time</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {snapshot.overview.responseStatus === 'on_track' ? '✓' : '⚠'}
              </p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary font-medium">Env. Status</p>
              <p className={`text-2xl font-bold mt-1 ${
                snapshot.overview.environmentalStatus === 'normal' ? 'text-green-600' :
                snapshot.overview.environmentalStatus === 'elevated' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {snapshot.overview.environmentalStatus === 'normal' ? 'OK' :
                 snapshot.overview.environmentalStatus === 'elevated' ? '⚠' : '🔴'}
              </p>
            </div>
            <Zap className="h-5 w-5 text-accent-500" />
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {snapshot.overview.responseStatus === 'critical' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Critical Response Latency</h3>
              <p className="text-sm text-red-800 mt-1">
                Average resolution time exceeds 10 days. Immediate resource review recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signals Table */}
      {snapshot.signals.length > 0 ? (
        <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border-subtle">
            <h2 className="font-semibold text-text-primary">Campus Operations Signals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Signal</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Count</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.signals.map((signal, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {signal.key.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          signal.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : signal.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {signal.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{signal.count}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                      {signal.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-subtle rounded-lg p-4 text-center text-text-secondary">
          No signals detected. Campus operations appear stable.
        </div>
      )}

      {/* Warnings */}
      {snapshot.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Data Gaps</h3>
          <ul className="space-y-1">
            {snapshot.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Resources */}
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
        <h3 className="font-semibold text-text-primary mb-3">Related Resources</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>
            <a href="#" className="text-accent-500 hover:underline">
              Campus Safety Protocols
            </a>
          </li>
          <li>
            <a href="#" className="text-accent-500 hover:underline">
              Incident Response Procedures
            </a>
          </li>
          <li>
            <a href="#" className="text-accent-500 hover:underline">
              Facilities Management Contact
            </a>
          </li>
        </ul>
      </div>

      {/* Disclaimer Footer */}
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-xs text-text-secondary">
        <p>{snapshot.disclaimer}</p>
      </div>
    </div>
  );
}
