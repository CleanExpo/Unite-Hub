'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Alerts Dashboard (G43)
 * /guardian/alerts/dashboard
 *
 * Static dashboard view with manual refresh
 * Displays recent Guardian activity in three columns:
 * - Alerts (guardian_alert_events)
 * - Incidents (incidents table)
 * - Notifications (guardian_notifications)
 */

interface AlertEventItem {
  id: string;
  rule_id: string;
  severity: string;
  source: string;
  message: string;
  created_at: string;
}

interface IncidentItem {
  id: string;
  severity: string;
  status: string;
  title: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  type: string;
  severity: string | null;
  channel: string;
  status: string;
  created_at: string;
}

interface ActivityResponse {
  alerts?: AlertEventItem[];
  incidents?: IncidentItem[];
  notifications?: NotificationItem[];
  error?: string;
}

export default function GuardianAlertsDashboardPage() {
  const [data, setData] = useState<ActivityResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/activity');
      const json: ActivityResponse = await res.json();
      if (!res.ok) {
        setError(json.error || 'Unable to load Guardian activity.');
        setData({});
        return;
      }
      setData(json);
    } catch (err) {
      setError('Unable to load Guardian activity.');
      setData({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const alerts = data.alerts ?? [];
  const incidents = data.incidents ?? [];
  const notifications = data.notifications ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Guardian Alerts Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Unified view of Guardian alerts, incidents, and notifications for this workspace.
        </p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Data updates every time you refresh. Use the Live Activity view for auto-refresh.
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex h-8 items-center rounded-md border bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-2 text-xs font-medium">
              Recent alerts
            </header>
            {alerts.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No Guardian alerts recorded yet.
              </p>
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <ul className="divide-y text-xs">
                  {alerts.map((a) => (
                    <li key={a.id} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            a.severity === 'critical'
                              ? 'bg-red-500/10 text-red-400'
                              : a.severity === 'high'
                              ? 'bg-orange-500/10 text-orange-400'
                              : a.severity === 'medium'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-cyan-500/10 text-cyan-400'
                          }`}
                        >
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px]">{a.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Source: {a.source}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Incidents Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-2 text-xs font-medium">
              Incidents
            </header>
            {incidents.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No incidents recorded yet.
              </p>
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <ul className="divide-y text-xs">
                  {incidents.map((i) => (
                    <li key={i.id} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            i.severity === 'critical'
                              ? 'bg-red-500/10 text-red-400'
                              : i.severity === 'high'
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-sky-500/10 text-sky-400'
                          }`}
                        >
                          {i.severity.toUpperCase()} · {i.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(i.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px]">{i.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Notifications Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-2 text-xs font-medium">
              Notifications
            </header>
            {notifications.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No notifications recorded yet.
              </p>
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Severity</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{n.type}</td>
                        <td className="px-3 py-2">{n.channel}</td>
                        <td className="px-3 py-2">{n.severity ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              n.status === 'sent'
                                ? 'bg-green-500/10 text-green-400'
                                : n.status === 'failed'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
