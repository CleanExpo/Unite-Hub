'use client';

import { useEffect, useState } from 'react';

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  source: string;
  channel: string;
  is_active: boolean;
  created_at: string;
}

interface AlertEvent {
  id: string;
  rule_id: string;
  severity: string;
  source: string;
  message: string;
  payload: unknown;
  created_at: string;
}

interface ApiResponse {
  rules?: AlertRule[];
  events?: AlertEvent[];
  error?: string;
  code?: number;
}

export default function GuardianAlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('high');
  const [source, setSource] = useState('telemetry');
  const [channel, setChannel] = useState('in_app');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/alerts');
      const json: ApiResponse = await res.json();

      if (!res.ok) {
        setError(
          json.error || `Guardian alerts unavailable (code ${json.code ?? res.status}).`
        );
        setRules([]);
        setEvents([]);
        return;
      }

      setRules(json.rules ?? []);
      setEvents(json.events ?? []);
    } catch (err) {
      setError('Unable to load Guardian alerts.');
      setRules([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/guardian/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          severity,
          source,
          channel,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Unable to create Guardian alert rule.');
        return;
      }

      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError('Unable to create Guardian alert rule.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Define Guardian alert rules and inspect recent alert events across telemetry,
          warehouse, replay, and scenarios.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="text-sm font-medium">Create alert rule</h2>
        <form onSubmit={handleCreateRule} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="High error rate on /api/guardian/telemetry"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Severity</label>
            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="telemetry">Telemetry</option>
              <option value="warehouse">Warehouse</option>
              <option value="replay">Replay</option>
              <option value="scenarios">Scenarios</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Channel</label>
            <select
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="in_app">In-app only</option>
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
              <option value="pager">Pager</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              className="min-h-[60px] w-full rounded-md border bg-background px-2 py-1 text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain when this alert should fire and how it should be handled. Condition logic will be wired in a later phase."
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="inline-flex h-8 items-center rounded-md border bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create rule'}
            </button>
          </div>
        </form>
        <p className="text-[11px] text-muted-foreground">
          This phase focuses on storing rules and events. Automated alert triggering and
          external channels will be added in later Guardian phases.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading Guardian alerts…</p>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-2 text-xs font-medium">
              Alert rules
            </header>
            {rules.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No Guardian alert rules defined yet.
              </p>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Severity</th>
                      <th className="px-3 py-2 text-left">Source</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 align-top">
                        <td className="px-3 py-2 text-[11px]">
                          <div className="font-medium text-xs">{r.name}</div>
                          {r.description && (
                            <div className="text-[10px] text-muted-foreground line-clamp-2">
                              {r.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {r.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">
                          {r.source}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">
                          {r.channel}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              r.is_active
                                ? 'bg-success-500/10 text-success-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {r.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-2 text-xs font-medium">
              Recent alert events
            </header>
            {events.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No Guardian alert events recorded yet.
              </p>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Rule</th>
                      <th className="px-3 py-2 text-left">Severity</th>
                      <th className="px-3 py-2 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 align-top">
                        <td className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">
                          {e.rule_id.substring(0, 8)}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          <span className="inline-flex rounded-full bg-warning-500/10 px-2 py-0.5 text-[10px] font-medium text-warning-400">
                            {e.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          <div className="line-clamp-2" title={e.message}>
                            {e.message}
                          </div>
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
