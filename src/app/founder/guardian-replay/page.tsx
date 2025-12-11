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
return 'bg-gray-100 text-gray-700 border-gray-200';
}
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warn':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ready':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Replay Engine</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Replay Engine</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Guardian Replay Engine</h1>
        <p className="text-gray-600">
          Inspect replay sessions and step through captured events to reconstruct past system state
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Sessions Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Replay Sessions</h2>
          {sessions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
              No replay sessions found
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded max-h-[480px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Source</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Window</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const selected = session.id === activeSessionId;
                    return (
                      <tr
                        key={session.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => load(selected ? null : session.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {session.name}
                          </div>
                          {session.description && (
                            <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {session.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 uppercase">
                          {session.source_kind}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
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
            <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
              <div className="text-sm font-semibold text-gray-900">Active Session Details</div>
              <div className="text-xs text-gray-600 space-y-1">
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
            <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
              Select a replay session to view its events
            </div>
          ) : events.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
              No events captured for this replay session
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded max-h-[520px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stream / Source</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
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
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <div className="font-mono">{event.stream_key || '—'}</div>
                        <div className="text-gray-500 mt-1">
                          {event.source_table} · {event.source_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {event.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-gray-500">+{event.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
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
