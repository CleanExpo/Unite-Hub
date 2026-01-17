'use client';

import { useEffect, useState } from 'react';

interface ReplaySession {
  id: string;
  name: string;
  description: string | null;
  source_kind: string;
  status: string;
  range_start: string;
  range_end: string;
  created_by: string | null;
  created_at: string;
}

interface ReplayEvent {
  id: string;
  session_id: string;
  source_table: string;
  source_id: string;
  occurred_at: string;
  level: string | null;
  stream_key: string | null;
  payload: Record<string, any>;
  tags: string[];
}

export default function GuardianReplayPage() {
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (sessionId?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = 'demo-tenant-id';
      const qs = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : '';
      const res = await fetch(`/api/founder/guardian/replay?tenantId=${tenantId}${qs}`);
      if (!res.ok) {
throw new Error('Failed to fetch replay data');
}
      const data = await res.json();
      setSessions(data.sessions || []);
      setEvents(data.events || []);
      setActiveSessionId(data.activeSessionId || null);
      setEventCount(data.eventCount || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeSessionId);
  }, []);

  const getLevelColor = (level?: string | null) => {
    if (!level) {
return 'bg-bg-hover text-text-secondary border-border-subtle';
}
    switch (level) {
      case 'critical':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'error':
        return 'bg-accent-100 text-accent-800 border-orange-200';
      case 'warn':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'info':
        return 'bg-info-100 text-info-800 border-info-200';
      case 'debug':
        return 'bg-bg-hover text-text-secondary border-border-subtle';
      default:
        return 'bg-bg-hover text-text-secondary border-border-subtle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'running':
        return 'bg-info-100 text-info-800 border-info-200';
      case 'failed':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'pending':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'ready':
        return 'bg-bg-hover text-text-secondary border-border-subtle';
      default:
        return 'bg-bg-hover text-text-secondary border-border-subtle';
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Replay Engine</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-bg-hover rounded"></div>
          <div className="h-40 bg-bg-hover rounded"></div>
          <div className="h-60 bg-bg-hover rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Replay Engine</h1>
        <div className="bg-error-50 border border-error-200 text-error-800 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Guardian Replay Engine</h1>
        <p className="text-text-muted">
          Inspect replay sessions and step through captured events to reconstruct past system state
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Sessions Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Replay Sessions</h2>
          {sessions.length === 0 ? (
            <div className="bg-bg-hover border border-border-subtle p-8 rounded text-center text-text-tertiary">
              No replay sessions found
            </div>
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded max-h-[480px] overflow-auto">
              <table className="w-full">
                <thead className="bg-bg-hover border-b border-border-subtle sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Source</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Window</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sessions.map((session) => {
                    const selected = session.id === activeSessionId;
                    return (
                      <tr
                        key={session.id}
                        className={`cursor-pointer hover:bg-bg-hover ${
                          selected ? 'bg-info-50' : ''
                        }`}
                        onClick={() => load(selected ? null : session.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-text-primary">
                            {session.name}
                          </div>
                          {session.description && (
                            <div className="text-xs text-text-tertiary line-clamp-2 mt-1">
                              {session.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary uppercase">
                          {session.source_kind}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-tertiary">
                          <div>{new Date(session.range_start).toLocaleString()}</div>
                          <div>{new Date(session.range_end).toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border capitalize ${getStatusColor(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSession && (
            <div className="bg-bg-card border border-border-subtle rounded p-4 space-y-2">
              <div className="text-sm font-semibold text-text-primary">Active Session Details</div>
              <div className="text-xs text-text-muted space-y-1">
                <div>Created: {new Date(activeSession.created_at).toLocaleString()}</div>
                {activeSession.created_by && <div>By: {activeSession.created_by}</div>}
                <div>Events: {eventCount}</div>
              </div>
            </div>
          )}
        </div>

        {/* Events Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Replay Events</h2>
          {!activeSessionId ? (
            <div className="bg-bg-hover border border-border-subtle p-8 rounded text-center text-text-tertiary">
              Select a replay session to view its events
            </div>
          ) : events.length === 0 ? (
            <div className="bg-bg-hover border border-border-subtle p-8 rounded text-center text-text-tertiary">
              No events captured for this replay session
            </div>
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded max-h-[520px] overflow-auto">
              <table className="w-full">
                <thead className="bg-bg-hover border-b border-border-subtle sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Stream / Source</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-bg-hover">
                      <td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">
                        {new Date(event.occurred_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getLevelColor(
                            event.level
                          )}`}
                        >
                          {(event.level || 'info').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        <div className="font-mono">{event.stream_key || '—'}</div>
                        <div className="text-text-tertiary mt-1">
                          {event.source_table} · {event.source_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {event.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-bg-hover text-text-secondary border border-border-subtle rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-text-tertiary">+{event.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
