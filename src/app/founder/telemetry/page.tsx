'use client';

/**
 * Unite Stability Telemetry Console
 * Phase: D74 - Unite Stability Telemetry Engine
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  Camera,
  TrendingUp,
  Cpu,
  HardDrive,
} from 'lucide-react';

type TelemetrySeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface TelemetryEvent {
  id: string;
  component: string;
  severity: TelemetrySeverity;
  payload?: {
    message?: string;
    stack_trace?: string;
    metrics?: Record<string, number>;
    context?: Record<string, unknown>;
  };
  tenant_id?: string;
  recorded_at: string;
}

interface TelemetrySnapshot {
  id: string;
  state: {
    cpu_usage?: number;
    memory_usage?: number;
    active_tasks?: number;
    queue_depth?: number;
    error_rate?: number;
    uptime?: number;
  };
  metadata?: {
    trigger?: string;
    version?: string;
    environment?: string;
  };
  tenant_id?: string;
  captured_at: string;
}

interface EventStats {
  total_events: number;
  by_severity: Record<TelemetrySeverity, number>;
  by_component: Record<string, number>;
}

export default function TelemetryPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'snapshots' | 'stats'>('events');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'snapshots') {
      fetchSnapshots();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, severityFilter]);

  useEffect(() => {
    // Fetch latest snapshot for header
    fetchLatestSnapshot();
    const interval = setInterval(fetchLatestSnapshot, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const severityParam = severityFilter !== 'all' ? `&severity=${severityFilter}` : '';
      const response = await fetch(`/api/unite/telemetry/events?limit=100${severityParam}`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/telemetry/snapshot?limit=100');
      const data = await response.json();
      if (response.ok) {
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/telemetry/events?action=stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestSnapshot = async () => {
    try {
      const response = await fetch('/api/unite/telemetry/snapshot?action=latest');
      const data = await response.json();
      if (response.ok) {
        setLatestSnapshot(data.snapshot || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const captureSnapshot = async () => {
    try {
      await fetch('/api/unite/telemetry/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture',
          metadata: { trigger: 'manual' },
        }),
      });
      fetchSnapshots();
      fetchLatestSnapshot();
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: TelemetrySeverity) => {
    const icons = {
      debug: Info,
      info: Info,
      warning: AlertTriangle,
      error: AlertCircle,
      critical: AlertCircle,
    };
    return icons[severity] || Info;
  };

  const getSeverityColor = (severity: TelemetrySeverity) => {
    const colors = {
      debug: 'bg-bg-hover0/10 text-text-muted border-border/20',
      info: 'bg-info-500/10 text-info-400 border-info-500/20',
      warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      error: 'bg-error-500/10 text-error-400 border-error-500/20',
      critical: 'bg-error-500/10 text-error-400 border-error-500/20',
    };
    return colors[severity] || colors.info;
  };

  // Summary stats
  const totalEvents = events.length;
  const criticalEvents = events.filter((e) => e.severity === 'critical').length;
  const errorEvents = events.filter((e) => e.severity === 'error').length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Activity className="w-10 h-10 text-accent-500" />
            Stability Telemetry Engine
          </h1>
          <p className="text-text-secondary">
            Real-time system monitoring and event tracking
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Total Events</span>
              <Activity className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalEvents}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {criticalEvents + errorEvents} critical/errors
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">CPU Usage</span>
              <Cpu className="w-5 h-5 text-info-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {latestSnapshot?.state.cpu_usage || 0}
              <span className="text-sm text-text-tertiary ml-1">%</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">current</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Memory</span>
              <HardDrive className="w-5 h-5 text-success-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {latestSnapshot?.state.memory_usage || 0}
              <span className="text-sm text-text-tertiary ml-1">%</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">heap used</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Uptime</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {latestSnapshot?.state.uptime
                ? Math.floor(latestSnapshot.state.uptime / 60)
                : 0}
              <span className="text-sm text-text-tertiary ml-1">min</span>
            </div>
            <div className="text-xs text-text-tertiary mt-1">system uptime</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'events', label: 'Event Stream', icon: Activity },
            { key: 'snapshots', label: 'System Snapshots', icon: Camera },
            { key: 'stats', label: 'Statistics', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* Severity Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'debug', 'info', 'warning', 'error', 'critical'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    severityFilter === severity
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No telemetry events found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => {
                  const Icon = getSeverityIcon(event.severity);
                  return (
                    <div
                      key={event.id}
                      className={`p-4 bg-bg-card rounded-lg border ${getSeverityColor(
                        event.severity
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-text-primary">
                              {event.component}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded border ${getSeverityColor(
                                event.severity
                              )}`}
                            >
                              {event.severity}
                            </span>
                          </div>
                          {event.payload?.message && (
                            <p className="text-sm text-text-secondary mb-2">
                              {event.payload.message}
                            </p>
                          )}
                          <div className="text-xs text-text-tertiary">
                            {new Date(event.recorded_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Snapshots Tab */}
        {activeTab === 'snapshots' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-text-primary">System State Snapshots</h3>
              <Button onClick={captureSnapshot} className="bg-accent-500 hover:bg-accent-600">
                <Camera className="w-4 h-4 mr-2" />
                Capture Snapshot
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading snapshots...</div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Camera className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No snapshots captured yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="p-4 bg-bg-card rounded-lg border border-border-primary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-sm text-text-tertiary">
                        {new Date(snapshot.captured_at).toLocaleString()}
                      </div>
                      {snapshot.metadata?.trigger && (
                        <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                          {snapshot.metadata.trigger}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {snapshot.state.cpu_usage !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">CPU Usage</div>
                          <div className="text-lg font-medium text-text-primary">
                            {snapshot.state.cpu_usage}%
                          </div>
                        </div>
                      )}
                      {snapshot.state.memory_usage !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">Memory</div>
                          <div className="text-lg font-medium text-text-primary">
                            {snapshot.state.memory_usage}%
                          </div>
                        </div>
                      )}
                      {snapshot.state.active_tasks !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">Active Tasks</div>
                          <div className="text-lg font-medium text-text-primary">
                            {snapshot.state.active_tasks}
                          </div>
                        </div>
                      )}
                      {snapshot.state.queue_depth !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">Queue Depth</div>
                          <div className="text-lg font-medium text-text-primary">
                            {snapshot.state.queue_depth}
                          </div>
                        </div>
                      )}
                      {snapshot.state.error_rate !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">Error Rate</div>
                          <div className="text-lg font-medium text-text-primary">
                            {snapshot.state.error_rate}%
                          </div>
                        </div>
                      )}
                      {snapshot.state.uptime !== undefined && (
                        <div>
                          <div className="text-xs text-text-tertiary mb-1">Uptime</div>
                          <div className="text-lg font-medium text-text-primary">
                            {Math.floor(snapshot.state.uptime / 60)}m
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading statistics...</div>
            ) : !stats ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No statistics available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* By Severity */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Events by Severity</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.by_severity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              severity === 'critical' || severity === 'error'
                                ? 'bg-error-400'
                                : severity === 'warning'
                                ? 'bg-warning-400'
                                : 'bg-info-400'
                            }`}
                          />
                          <span className="text-text-primary capitalize">{severity}</span>
                        </div>
                        <span className="text-text-primary font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Component */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-medium text-text-primary mb-4">
                    Events by Component
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.by_component)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([component, count]) => (
                        <div key={component} className="flex items-center justify-between">
                          <span className="text-text-primary">{component}</span>
                          <span className="text-text-primary font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
