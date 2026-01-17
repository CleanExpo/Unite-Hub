'use client';

/**
 * Observability Timeline
 * Phase: D67 - Unite Observability & Event Timeline
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Info, XCircle, MessageSquare, Filter } from 'lucide-react';

interface Event {
  id: string;
  source: string;
  event_type_key: string;
  severity: string;
  message?: string;
  payload?: Record<string, unknown>;
  correlation_id?: string;
  occurred_at: string;
}

interface TimelineData {
  hour: string;
  total: number;
  errors: number;
  warnings: number;
  info: number;
}

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'events'>('timeline');
  const [events, setEvents] = useState<Event[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [hours, setHours] = useState(24);

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline();
    } else {
      fetchEvents();
    }
  }, [activeTab, severityFilter, hours]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/unite/events/timeline?hours=${hours}`);
      const data = await response.json();
      if (response.ok) {
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const severityParam = severityFilter !== 'all' ? `&severity=${severityFilter}` : '';
      const response = await fetch(`/api/unite/events/ingest?limit=100${severityParam}`);
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

  const getSeverityIcon = (severity: string) => {
    const icons: Record<string, React.ReactNode> = {
      critical: <XCircle className="w-5 h-5 text-error-500" />,
      error: <XCircle className="w-5 h-5 text-error-400" />,
      warning: <AlertTriangle className="w-5 h-5 text-warning-400" />,
      info: <Info className="w-5 h-5 text-info-400" />,
    };
    return icons[severity] || icons.info;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-error-500/10 text-error-400 border-error-500/20',
      error: 'bg-error-500/10 text-error-400 border-error-500/20',
      warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      info: 'bg-info-500/10 text-info-400 border-info-500/20',
    };
    return colors[severity] || colors.info;
  };

  // Calculate summary
  const totalEvents = events.length;
  const errorCount = events.filter((e) => e.severity === 'error' || e.severity === 'critical')
    .length;
  const warningCount = events.filter((e) => e.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-accent-500" />
              Observability Timeline
            </h1>
            <p className="text-text-secondary">Cross-system event tracking and correlation</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="px-4 py-2 bg-bg-card border border-border-primary rounded text-text-primary"
            >
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 3 days</option>
              <option value={168}>Last 7 days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Total Events</span>
              <Activity className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalEvents}</div>
            <div className="text-xs text-text-tertiary mt-1">Last {hours}h</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Errors</span>
              <XCircle className="w-5 h-5 text-error-400" />
            </div>
            <div className="text-3xl font-bold text-error-400">{errorCount}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {totalEvents > 0 ? ((errorCount / totalEvents) * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Warnings</span>
              <AlertTriangle className="w-5 h-5 text-warning-400" />
            </div>
            <div className="text-3xl font-bold text-warning-400">{warningCount}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {totalEvents > 0 ? ((warningCount / totalEvents) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'timeline', label: 'Timeline', icon: Activity },
            { key: 'events', label: 'Event Stream', icon: MessageSquare },
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

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No events in this time period</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((data) => {
                  const maxTotal = Math.max(...timeline.map((t) => t.total));
                  const widthPercent = (data.total / maxTotal) * 100;

                  return (
                    <div key={data.hour} className="p-4 bg-bg-card rounded-lg border border-border-primary">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">
                          {new Date(data.hour).toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {data.total} events
                        </span>
                      </div>
                      <div className="flex gap-1 h-6">
                        {data.errors > 0 && (
                          <div
                            className="bg-error-500 rounded"
                            style={{ width: `${(data.errors / data.total) * widthPercent}%` }}
                          />
                        )}
                        {data.warnings > 0 && (
                          <div
                            className="bg-warning-500 rounded"
                            style={{ width: `${(data.warnings / data.total) * widthPercent}%` }}
                          />
                        )}
                        {data.info > 0 && (
                          <div
                            className="bg-info-500 rounded"
                            style={{ width: `${(data.info / data.total) * widthPercent}%` }}
                          />
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        {data.errors > 0 && (
                          <span className="text-error-400">{data.errors} errors</span>
                        )}
                        {data.warnings > 0 && (
                          <span className="text-warning-400">{data.warnings} warnings</span>
                        )}
                        {data.info > 0 && <span className="text-info-400">{data.info} info</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* Severity Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'critical', 'error', 'warning', 'info'].map((severity) => (
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
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No events found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getSeverityColor(
                      event.severity
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {event.event_type_key}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                              {event.source}
                            </span>
                          </div>
                          <span className="text-xs text-text-tertiary">
                            {new Date(event.occurred_at).toLocaleString()}
                          </span>
                        </div>
                        {event.message && (
                          <p className="text-sm text-text-secondary mb-2">{event.message}</p>
                        )}
                        {event.correlation_id && (
                          <div className="text-xs text-text-tertiary">
                            Correlation: {event.correlation_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
