'use client';

import { useState, useEffect } from 'react';

interface WarehouseEvent {
  id: string;
  stream_key: string;
  occurred_at: string;
  level: string;
  payload: Record<string, any>;
  tags: string[];
}

interface HourlyRollup {
  stream_key: string;
  hour_bucket: string;
  count_total: number;
  count_error: number;
  count_warn: number;
  count_critical: number;
}

interface DailyRollup {
  stream_key: string;
  day_bucket: string;
  count_total: number;
  count_error: number;
  count_warn: number;
  count_critical: number;
}

interface Summary {
  total_warehouse_events: number;
  distinct_stream_keys: number;
  stream_keys: string[];
}

export default function GuardianWarehousePage() {
  const [events, setEvents] = useState<WarehouseEvent[]>([]);
  const [hourly, setHourly] = useState<HourlyRollup[]>([]);
  const [daily, setDaily] = useState<DailyRollup[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (stream?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = 'demo-tenant-id';
      const qs = stream ? `&streamKey=${encodeURIComponent(stream)}` : '';
      const res = await fetch(`/api/founder/guardian/warehouse?tenantId=${tenantId}${qs}`);
      if (!res.ok) throw new Error('Failed to fetch warehouse data');
      const data = await res.json();
      setEvents(data.events || []);
      setHourly(data.hourly || []);
      setDaily(data.daily || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedStream);
  }, [selectedStream]);

  const getLevelColor = (level: string) => {
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Guardian Telemetry Warehouse</h1>
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
        <h1 className="text-2xl font-bold mb-4">Guardian Telemetry Warehouse</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Guardian Telemetry Warehouse</h1>
        <p className="text-gray-600">
          Long-term telemetry storage with hourly & daily rollups
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <div className="text-sm text-blue-600 font-medium">Total Warehouse Events</div>
            <div className="text-2xl font-bold text-blue-900">{summary.total_warehouse_events}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-4 rounded">
            <div className="text-sm text-purple-600 font-medium">Distinct Streams</div>
            <div className="text-2xl font-bold text-purple-900">{summary.distinct_stream_keys}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded">
            <div className="text-sm text-gray-600 font-medium">Selected Stream</div>
            <div className="text-lg font-bold text-gray-900">
              {selectedStream || 'All streams'}
            </div>
          </div>
        </div>
      )}

      {/* Stream Filter */}
      {summary && summary.stream_keys.length > 0 && (
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="text-sm font-medium text-gray-700 mb-2">Filter by Stream:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStream(null)}
              className={`px-3 py-1 rounded text-sm border ${
                !selectedStream
                  ? 'bg-blue-100 text-blue-800 border-blue-200 font-medium'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              All Streams
            </button>
            {summary.stream_keys.map(key => (
              <button
                key={key}
                onClick={() => setSelectedStream(key)}
                className={`px-3 py-1 rounded text-sm border ${
                  selectedStream === key
                    ? 'bg-blue-100 text-blue-800 border-blue-200 font-medium'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Recent Warehouse Events</h2>
          {events.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
              No warehouse events found
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded max-h-[480px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stream</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(event.occurred_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs">
                        {event.stream_key}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getLevelColor(
                            event.level
                          )}`}
                        >
                          {event.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {event.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{event.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rollups */}
        <div className="space-y-6">
          {/* Hourly Rollups */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Hourly Rollups (Last 7 Days)</h2>
            {hourly.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
                No hourly rollups available
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded max-h-[220px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Hour</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Warn</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Error</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Critical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hourly.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(h.hour_bucket).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-gray-900 font-medium">
                          {h.count_total}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-amber-700">
                          {h.count_warn}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-orange-700">
                          {h.count_error}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-red-700">
                          {h.count_critical}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Rollups */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Daily Rollups (Last 30 Days)</h2>
            {daily.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-8 rounded text-center text-gray-500">
                No daily rollups available
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded max-h-[220px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Day</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Warn</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Error</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Critical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {daily.map((d, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                          {d.day_bucket}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-gray-900 font-medium">
                          {d.count_total}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-amber-700">
                          {d.count_warn}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-orange-700">
                          {d.count_error}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-red-700">
                          {d.count_critical}
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
    </div>
  );
}
