'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Live Activity Feed (G44)
 * /guardian/activity
 *
 * Polling-based live view with auto-refresh
 * Combines alerts + incidents in left column, notifications in right column
 * Configurable refresh interval (5s, 10s, 30s)
 */

interface ActivityAlert {
  id: string;
  severity: string;
  message: string;
  created_at: string;
}

interface ActivityIncident {
  id: string;
  severity: string;
  status: string;
  title: string;
  created_at: string;
}

interface ActivityNotification {
  id: string;
  type: string;
  severity: string | null;
  channel: string;
  status: string;
  created_at: string;
}

interface ActivityResponse {
  alerts?: ActivityAlert[];
  incidents?: ActivityIncident[];
  notifications?: ActivityNotification[];
  error?: string;
}

export default function GuardianLiveActivityPage() {
  const [data, setData] = useState<ActivityResponse>({});
  const [error, setError] = useState<string | null>(null);
  const [pollMs, setPollMs] = useState(10000); // Default 10 seconds

  async function load() {
    try {
      const res = await fetch('/api/guardian/activity');
      const json: ActivityResponse = await res.json();
      if (!res.ok) {
        setError(json.error || 'Unable to load Guardian activity.');
        setData({});
        return;
      }
      setError(null);
      setData(json);
    } catch (err) {
      setError('Unable to load Guardian activity.');
      setData({});
    }
  }

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // Polling interval
  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const alerts = data.alerts ?? [];
  const incidents = data.incidents ?? [];
  const notifications = data.notifications ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Guardian Live Activity
        </h1>
        <p className="text-sm text-muted-foreground">
          Streaming-style feed of the most recent Guardian alerts, incidents, and
          notifications. Auto-refreshes every few seconds.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>Auto-refresh interval: {Math.round(pollMs / 1000)}s</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPollMs(5000)}
            className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] ${
              pollMs === 5000
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            5s
          </button>
          <button
            type="button"
            onClick={() => setPollMs(10000)}
            className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] ${
              pollMs === 10000
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            10s
          </button>
          <button
            type="button"
            onClick={() => setPollMs(30000)}
            className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] ${
              pollMs === 30000
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            30s
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Alerts & Incidents Column */}
        <section className="rounded-xl border bg-card max-h-[480px] overflow-auto">
          <header className="sticky top-0 border-b bg-muted/40 px-4 py-2 text-xs font-medium">
            Alerts & Incidents
          </header>
          <ul className="divide-y text-xs">
            {alerts.map((a) => (
              <li key={`alert-${a.id}`} className="px-4 py-2">
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
                    ALERT · {a.severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px]">{a.message}</p>
              </li>
            ))}
            {incidents.map((i) => (
              <li key={`incident-${i.id}`} className="px-4 py-2">
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
                    INCIDENT · {i.severity.toUpperCase()} · {i.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(i.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px]">{i.title}</p>
              </li>
            ))}
            {alerts.length === 0 && incidents.length === 0 && (
              <li className="px-4 py-3 text-xs text-muted-foreground">
                No recent Guardian alerts or incidents.
              </li>
            )}
          </ul>
        </section>

        {/* Notification Stream Column */}
        <section className="rounded-xl border bg-card max-h-[480px] overflow-auto">
          <header className="sticky top-0 border-b bg-muted/40 px-4 py-2 text-xs font-medium">
            Notification stream
          </header>
          <ul className="divide-y text-xs">
            {notifications.map((n) => (
              <li key={n.id} className="px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {n.channel.toUpperCase()} · {n.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(n.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {n.severity ? `Severity: ${n.severity}` : 'Severity: n/a'}
                  </span>
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
                </div>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-4 py-3 text-xs text-muted-foreground">
                No recent notifications recorded.
              </li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
