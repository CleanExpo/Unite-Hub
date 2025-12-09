'use client';

/**
 * Unite Schema Drift Console
 * Phase: D77 - Unite Schema Drift & Auto-Migration Engine
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, GitCompare, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SchemaSnapshot {
  id: string;
  snapshot: {
    tables: Record<string, { columns: Record<string, unknown>; indexes: string[] }>;
    relationships: unknown[];
  };
  captured_at: string;
}

interface DriftReport {
  id: string;
  differences: {
    added_tables?: string[];
    removed_tables?: string[];
    modified_columns?: Array<{ table: string; column: string; old_type: string; new_type: string }>;
    index_changes?: Array<{ table: string; change: string; index: string }>;
  };
  recommended_actions?: {
    sql_statements: string[];
    risk_level: 'low' | 'medium' | 'high';
    rollback_plan: string[];
  };
  ai_reasoning?: {
    impact_assessment: string;
    breaking_changes: boolean;
    migration_strategy: string;
  };
  generated_at: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SchemaConsolePage() {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'reports'>('snapshots');
  const [snapshots, setSnapshots] = useState<SchemaSnapshot[]>([]);
  const [reports, setReports] = useState<DriftReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DriftReport | null>(null);

  // Fetch snapshots
  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/schema/snapshot');
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error('Fetch snapshots failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/schema/drift');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Fetch reports failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Capture snapshot
  const captureSnapshot = async () => {
    try {
      await fetch('/api/unite/schema/snapshot', { method: 'POST' });
      fetchSnapshots();
    } catch (error) {
      console.error('Capture snapshot failed:', error);
    }
  };

  // Detect drift
  const detectDrift = async (baseId: string, compareId: string) => {
    try {
      await fetch('/api/unite/schema/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_snapshot_id: baseId,
          compare_snapshot_id: compareId,
        }),
      });
      fetchReports();
    } catch (error) {
      console.error('Detect drift failed:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'snapshots') fetchSnapshots();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  // Risk badge
  const RiskBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
    const config = {
      low: 'text-green-400 bg-green-400/10',
      medium: 'text-yellow-400 bg-yellow-400/10',
      high: 'text-red-400 bg-red-400/10',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config[level]}`}>
        Risk: {level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Schema Drift</h1>
            <p className="text-text-secondary mt-1">Snapshot comparison + drift detection</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'snapshots' && (
              <Button
                onClick={captureSnapshot}
                className="bg-accent-500 hover:bg-accent-600 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            )}
            <Button
              onClick={() => (activeTab === 'snapshots' ? fetchSnapshots() : fetchReports())}
              variant="outline"
              className="border-border-primary text-text-primary hover:bg-bg-hover"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-primary">
          {(['snapshots', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
          </div>
        )}

        {/* Snapshots Tab */}
        {!loading && activeTab === 'snapshots' && (
          <div className="space-y-4">
            {snapshots.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <Camera className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No snapshots captured</p>
              </Card>
            ) : (
              snapshots.map((snapshot, idx) => (
                <Card key={snapshot.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Snapshot #{snapshots.length - idx}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {Object.keys(snapshot.snapshot.tables).length} tables
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(snapshot.captured_at).toLocaleString()}
                      </p>
                    </div>
                    {idx < snapshots.length - 1 && (
                      <Button
                        onClick={() => detectDrift(snapshots[idx + 1].id, snapshot.id)}
                        size="sm"
                        variant="outline"
                        className="border-border-primary text-text-primary hover:bg-bg-hover"
                      >
                        <GitCompare className="w-4 h-4 mr-1" />
                        Compare w/ prev
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {!loading && activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <GitCompare className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No drift reports</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {report.ai_reasoning?.breaking_changes ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        <h3 className="text-lg font-semibold text-text-primary">
                          {report.ai_reasoning?.breaking_changes ? 'Breaking Drift' : 'Safe Drift'}
                        </h3>
                        {report.recommended_actions && (
                          <RiskBadge level={report.recommended_actions.risk_level} />
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {new Date(report.generated_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setSelectedReport(selectedReport?.id === report.id ? null : report)
                      }
                      size="sm"
                      variant="outline"
                      className="border-border-primary text-text-primary hover:bg-bg-hover"
                    >
                      {selectedReport?.id === report.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-bg-primary p-3 rounded">
                      <p className="text-xs text-text-secondary">Added Tables</p>
                      <p className="text-lg font-semibold text-green-400 mt-1">
                        {report.differences.added_tables?.length || 0}
                      </p>
                    </div>
                    <div className="bg-bg-primary p-3 rounded">
                      <p className="text-xs text-text-secondary">Removed Tables</p>
                      <p className="text-lg font-semibold text-red-400 mt-1">
                        {report.differences.removed_tables?.length || 0}
                      </p>
                    </div>
                    <div className="bg-bg-primary p-3 rounded">
                      <p className="text-xs text-text-secondary">Modified Columns</p>
                      <p className="text-lg font-semibold text-yellow-400 mt-1">
                        {report.differences.modified_columns?.length || 0}
                      </p>
                    </div>
                    <div className="bg-bg-primary p-3 rounded">
                      <p className="text-xs text-text-secondary">Index Changes</p>
                      <p className="text-lg font-semibold text-blue-400 mt-1">
                        {report.differences.index_changes?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedReport?.id === report.id && (
                    <div className="pt-4 border-t border-border-primary space-y-3">
                      {report.ai_reasoning && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            AI Analysis
                          </h4>
                          <div className="bg-bg-primary p-3 rounded space-y-2">
                            <p className="text-sm text-text-secondary">
                              <strong>Impact:</strong> {report.ai_reasoning.impact_assessment}
                            </p>
                            <p className="text-sm text-text-secondary">
                              <strong>Strategy:</strong> {report.ai_reasoning.migration_strategy}
                            </p>
                          </div>
                        </div>
                      )}

                      {report.recommended_actions && report.recommended_actions.sql_statements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Recommended SQL
                          </h4>
                          <div className="bg-bg-primary p-3 rounded max-h-48 overflow-auto">
                            <pre className="text-xs text-text-secondary">
                              {report.recommended_actions.sql_statements.join(';\n\n')}
                            </pre>
                          </div>
                        </div>
                      )}

                      {report.recommended_actions && report.recommended_actions.rollback_plan.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Rollback Plan
                          </h4>
                          <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                            {report.recommended_actions.rollback_plan.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
