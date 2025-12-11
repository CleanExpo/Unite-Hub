'use client';

/**
 * Guardian QA & Drift Dashboard
 * Displays: QA schedules, baselines, and drift reports
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface QaSchedule {
  id: string;
  name: string;
  description?: string;
  schedule_cron: string;
  is_active: boolean;
  pack_id: string;
  chaos_profile_id?: string;
  simulate_playbooks: boolean;
  last_run_at?: string;
}

interface QaBaseline {
  id: string;
  name: string;
  scope: string;
  source_type: string;
  captured_at: string;
  is_reference: boolean;
  metrics: Record<string, unknown>;
}

interface QaDriftReport {
  id: string;
  schedule_id?: string;
  baseline_id: string;
  created_at: string;
  severity: 'info' | 'warning' | 'critical';
  summary: {
    flags: string[];
  };
}

export default function QaDashboard() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState<QaSchedule[]>([]);
  const [baselines, setBaselines] = useState<QaBaseline[]>([]);
  const [driftReports, setDriftReports] = useState<QaDriftReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSchedule, setSelectedSchedule] = useState<QaSchedule | null>(null);
  const [selectedReport, setSelectedReport] = useState<QaDriftReport | null>(null);

  // Load schedules
  useEffect(() => {
    if (!workspaceId) {
return;
}
    loadSchedules();
  }, [workspaceId, activeTab]);

  // Load baselines
  useEffect(() => {
    if (!workspaceId || activeTab !== 'baselines') {
return;
}
    loadBaselines();
  }, [workspaceId, activeTab]);

  // Load drift reports
  useEffect(() => {
    if (!workspaceId || activeTab !== 'drift') {
return;
}
    loadDriftReports();
  }, [workspaceId, activeTab]);

  async function loadSchedules() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/guardian/admin/qa/schedules?workspaceId=${workspaceId}&isActive=true`
      );
      if (!res.ok) {
throw new Error('Failed to load schedules');
}
      const data = await res.json();
      setSchedules(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  async function loadBaselines() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardian/admin/qa/baselines?workspaceId=${workspaceId}`);
      if (!res.ok) {
throw new Error('Failed to load baselines');
}
      const data = await res.json();
      setBaselines(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load baselines');
    } finally {
      setLoading(false);
    }
  }

  async function loadDriftReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardian/admin/qa/drift?workspaceId=${workspaceId}&limit=20`);
      if (!res.ok) {
throw new Error('Failed to load drift reports');
}
      const data = await res.json();
      setDriftReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drift reports');
    } finally {
      setLoading(false);
    }
  }

  async function runScheduleNow(scheduleId: string) {
    try {
      const res = await fetch(
        `/api/guardian/admin/qa/schedules/${scheduleId}/run?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          body: JSON.stringify({ actorId: 'manual_trigger' }),
        }
      );
      if (!res.ok) {
throw new Error('Failed to run schedule');
}
      // Reload schedules and reports
      loadSchedules();
      loadDriftReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run schedule');
    }
  }

  async function markBaselineAsReference(baselineId: string) {
    try {
      const res = await fetch(
        `/api/guardian/admin/qa/baselines/${baselineId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ is_reference: true }),
        }
      );
      if (!res.ok) {
throw new Error('Failed to update baseline');
}
      loadBaselines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update baseline');
    }
  }

  return (
    <div className="p-6 bg-bg-primary min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Guardian QA & Drift Monitor</h1>
          <p className="text-text-secondary">Manage QA schedules, baselines, and drift detection</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-border-subtle">
          {['schedules', 'baselines', 'drift'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-accent-500 text-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-text-secondary mt-2">Loading...</p>
          </div>
        )}

        {/* QA Schedules Tab */}
        {activeTab === 'schedules' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">QA Schedules</h2>
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No active schedules</div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-bg-card border border-border-subtle rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedSchedule(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{schedule.name}</h3>
                        {schedule.description && (
                          <p className="text-sm text-text-secondary mt-1">{schedule.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                          <span>Cron: <code className="bg-bg-primary px-2 py-1 rounded">{schedule.schedule_cron}</code></span>
                          {schedule.last_run_at && (
                            <span>Last run: {new Date(schedule.last_run_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runScheduleNow(schedule.id);
                        }}
                        className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 transition-colors"
                      >
                        Run Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Baselines Tab */}
        {activeTab === 'baselines' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Baselines</h2>
            {baselines.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No baselines</div>
            ) : (
              <div className="space-y-4">
                {baselines.map((baseline) => (
                  <div
                    key={baseline.id}
                    className="p-4 bg-bg-card border border-border-subtle rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">{baseline.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                          <span>Scope: {baseline.scope}</span>
                          <span>Type: {baseline.source_type}</span>
                          <span>Created: {new Date(baseline.captured_at).toLocaleString()}</span>
                          {baseline.is_reference && (
                            <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded">
                              Reference
                            </span>
                          )}
                        </div>
                      </div>
                      {!baseline.is_reference && (
                        <button
                          onClick={() => markBaselineAsReference(baseline.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                        >
                          Mark as Reference
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drift Reports Tab */}
        {activeTab === 'drift' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Drift Reports</h2>
            {driftReports.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No drift reports</div>
            ) : (
              <div className="space-y-4">
                {driftReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-bg-card border border-border-subtle rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              report.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : report.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {report.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>
                        {report.summary?.flags && report.summary.flags.length > 0 && (
                          <ul className="text-sm text-text-secondary mt-2">
                            {report.summary.flags.slice(0, 2).map((flag, idx) => (
                              <li key={idx}>• {flag}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <span className="text-text-secondary">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected schedule/report detail */}
        {selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-bg-card rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                {selectedSchedule.name}
              </h2>
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                <p>
                  <strong>Cron:</strong> {selectedSchedule.schedule_cron}
                </p>
                <p>
                  <strong>Pack ID:</strong> {selectedSchedule.pack_id}
                </p>
                <p>
                  <strong>Active:</strong> {selectedSchedule.is_active ? 'Yes' : 'No'}
                </p>
                {selectedSchedule.last_run_at && (
                  <p>
                    <strong>Last run:</strong> {new Date(selectedSchedule.last_run_at).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-bg-card rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Drift Report</h2>
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                <p>
                  <strong>Severity:</strong> {selectedReport.severity}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(selectedReport.created_at).toLocaleString()}
                </p>
                {selectedReport.summary?.flags && selectedReport.summary.flags.length > 0 && (
                  <div>
                    <strong>Flags:</strong>
                    <ul className="ml-4 mt-2">
                      {selectedReport.summary.flags.map((flag, idx) => (
                        <li key={idx}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
