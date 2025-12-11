'use client';

import { useEffect, useState } from 'react';

interface AuditRecord {
  id: string;
  user_id: string;
  role: string;
  endpoint: string;
  method: string;
  status_code: number;
  success: boolean;
  source_ip: string | null;
  user_agent: string | null;
  meta: unknown;
  created_at: string;
}

interface ApiResponse {
  items?: AuditRecord[];
  error?: string;
  code?: number;
}

interface Summary {
  total: number;
  successCount: number;
  failureCount: number;
  recentEndpoints: string[];
}

export default function GuardianAccessAuditPage() {
  const [items, setItems] = useState<AuditRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failure'>('all');

  async function loadSummary() {
    try {
      const res = await fetch('/api/guardian/access-audit?summary=true');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (endpointFilter.trim()) params.set('endpoint', endpointFilter.trim());
      if (statusCodeFilter.trim()) params.set('statusCode', statusCodeFilter.trim());
      if (successFilter === 'success') params.set('success', 'true');
      if (successFilter === 'failure') params.set('success', 'false');
      params.set('limit', '200');
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/guardian/access-audit${qs}`);
      const json: ApiResponse = await res.json();

      if (!res.ok) {
        setError(json.error || `Guardian access audit unavailable (code ${json.code ?? res.status}).`);
        setItems([]);
        return;
      }

      setItems(json.items ?? []);
    } catch (err) {
      setError('Unable to load Guardian access audit.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Access Audit</h1>
        <p className="text-sm text-text-secondary">
          Inspect Guardian API access attempts by user, role, endpoint, and status.
        </p>
      </header>

      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-bg-card p-4 space-y-1">
            <p className="text-xs text-text-secondary">Total Requests</p>
            <p className="text-2xl font-semibold">{summary.total.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border bg-bg-card p-4 space-y-1">
            <p className="text-xs text-text-secondary">Successful</p>
            <p className="text-2xl font-semibold text-emerald-400">{summary.successCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border bg-bg-card p-4 space-y-1">
            <p className="text-xs text-text-secondary">Failed</p>
            <p className="text-2xl font-semibold text-rose-400">{summary.failureCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border bg-bg-card p-4 space-y-1">
            <p className="text-xs text-text-secondary">Error Rate</p>
            <p className="text-2xl font-semibold">
              {summary.total > 0
                ? ((summary.failureCount / summary.total) * 100).toFixed(1)
                : '0.0'}%
            </p>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Endpoint contains</label>
            <input
              className="h-8 rounded-md border border-border bg-bg-input px-2 text-xs text-text-primary"
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              placeholder="/api/guardian/"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Status code</label>
            <input
              className="h-8 rounded-md border border-border bg-bg-input px-2 text-xs w-24 text-text-primary"
              value={statusCodeFilter}
              onChange={(e) => setStatusCodeFilter(e.target.value)}
              placeholder="200, 401"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Outcome</label>
            <select
              className="h-8 rounded-md border border-border bg-bg-input px-2 text-xs text-text-primary"
              value={successFilter}
              onChange={(e) => setSuccessFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="success">Success only</option>
              <option value="failure">Failures only</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              loadSummary();
              load();
            }}
            className="inline-flex h-8 items-center rounded-md border border-border bg-accent-500 px-3 text-xs font-medium text-white shadow-sm hover:bg-accent-600 transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="text-[11px] text-text-secondary">
          Shows the 200 most recent matching records. Use filters to focus on specific endpoints or error codes.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading Guardian access audit…</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-secondary">No Guardian access audit records found for the current filters.</p>
      ) : (
        <section className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-bg-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">User</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Role</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Endpoint</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Method</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">IP</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Meta</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 align-top hover:bg-bg-subtle transition-colors">
                    <td className="px-3 py-2 text-[10px] text-text-secondary whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-text-secondary font-mono">
                      {r.user_id.substring(0, 8)}...
                    </td>
                    <td className="px-3 py-2 text-[10px]">
                      <span className="inline-flex rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        {r.role.replace('guardian_', '')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] max-w-xs text-text-primary">
                      <div className="line-clamp-2" title={r.endpoint}>
                        {r.endpoint}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-text-secondary">
                      {r.method}
                    </td>
                    <td className="px-3 py-2 text-[10px]">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.success
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {r.status_code}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-text-secondary">
                      {r.source_ip ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-text-secondary max-w-xs">
                      <details className="cursor-pointer">
                        <summary className="list-none text-accent-500 hover:text-accent-400">
                          View
                        </summary>
                        <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap bg-bg-subtle rounded p-2 text-[10px]">
                          {JSON.stringify(r.meta, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
