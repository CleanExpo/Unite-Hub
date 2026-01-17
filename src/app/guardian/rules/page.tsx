'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Rule Editor (G45)
 * /guardian/rules
 *
 * Complete rule management UI:
 * - List existing rules
 * - Create new rules from templates or scratch
 * - Edit existing rules
 * - Delete rules
 * - Enable/disable rules
 */

interface RuleItem {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  source: string;
  channel: string;
  is_active: boolean;
  condition: unknown;
  created_at: string;
}

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  severity_default: string | null;
  channel_default: string | null;
  definition: unknown;
}

export default function GuardianRuleEditorPage() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<RuleItem> | null>(null);
  const [saving, setSaving] = useState(false);

  // AI Assistant state (H01)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, tmplRes] = await Promise.all([
        fetch('/api/guardian/rules'),
        fetch('/api/guardian/rules/templates'),
      ]);
      const rulesJson = await rulesRes.json();
      const tmplJson = await tmplRes.json();
      if (!rulesRes.ok) throw new Error(rulesJson.error || 'Unable to load rules');
      if (!tmplRes.ok) throw new Error(tmplJson.error || 'Unable to load templates');
      setRules(rulesJson.items ?? []);
      setTemplates(tmplJson.items ?? []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load Guardian rules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreateFromTemplate(t: TemplateItem) {
    setEditing({
      id: undefined,
      name: t.name,
      description: t.description,
      severity: t.severity_default ?? 'medium',
      source: 'telemetry',
      channel: t.channel_default ?? 'email',
      is_active: true,
      condition: t.definition ?? {},
    });
  }

  function startCreate() {
    setEditing({
      id: undefined,
      name: '',
      description: '',
      severity: 'medium',
      source: 'telemetry',
      channel: 'email',
      is_active: true,
      condition: {},
    });
  }

  function startEdit(rule: RuleItem) {
    setEditing(rule);
  }

  async function saveCurrent() {
    if (!editing) return;
    if (!editing.name?.trim()) {
      setError('Rule name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = editing.id
        ? `/api/guardian/rules/${editing.id}`
        : '/api/guardian/rules';
      const method = editing.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to save rule');

      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to save Guardian rule.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule? This will also delete associated webhooks.')) return;

    try {
      const res = await fetch(`/api/guardian/rules/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Unable to delete rule');
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete Guardian rule.');
    }
  }

  // AI Assistant function (H01)
  async function askAI() {
    if (!editing) return;

    setAiLoading(true);
    setAiError(null);
    setAiSuggestions(null);

    try {
      const res = await fetch('/api/guardian/ai/rules/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: editing.id,
          ruleName: editing.name,
          severity: editing.severity,
          source: editing.source,
          channel: editing.channel,
          existingDescription: editing.description,
          existingConditions: editing.condition,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === 'AI_NOT_CONFIGURED') {
          setAiError('AI suggestions not available (ANTHROPIC_API_KEY not configured)');
        } else {
          setAiError(json.error || 'AI suggestion failed');
        }
        return;
      }

      setAiSuggestions(json.suggestions);
    } catch (err: any) {
      setAiError(err?.message || 'Unable to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  }

  function applySuggestion(field: 'description' | 'condition', value: any) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
    setAiSuggestions(null); // Clear suggestions after applying
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Rule Editor</h1>
        <p className="text-sm text-muted-foreground">
          Configure Guardian alert rules, starting from templates or creating from scratch.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Templates Section */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Templates</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        {loading && templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading templates…</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No Guardian templates defined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => startCreateFromTemplate(t)}
                className="inline-flex flex-col items-start rounded-xl border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <span className="font-medium">{t.name}</span>
                {t.description && (
                  <span className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {t.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Rules List Section */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Alert Rules</h2>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            New rule
          </button>
        </div>
        {loading && rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No Guardian rules defined yet. Create one from a template or start from scratch.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Severity</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Channel</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.name}</div>
                      {r.description && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.severity}</td>
                    <td className="px-3 py-2">{r.source}</td>
                    <td className="px-3 py-2">{r.channel}</td>
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="mr-2 inline-flex items-center rounded-md border px-2 py-1 hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRule(r.id)}
                        className="inline-flex items-center rounded-md border border-destructive/40 px-2 py-1 text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Form Section */}
      {editing && (
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">{editing.id ? 'Edit rule' : 'New rule'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium">Name</label>
              <input
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="High API error rate"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium">Severity</label>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={editing.severity ?? 'medium'}
                onChange={(e) => setEditing({ ...editing, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium">Source</label>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={editing.source ?? 'telemetry'}
                onChange={(e) => setEditing({ ...editing, source: e.target.value })}
              >
                <option value="telemetry">Telemetry</option>
                <option value="warehouse">Warehouse</option>
                <option value="replay">Replay</option>
                <option value="scenarios">Scenarios</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium">Channel</label>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={editing.channel ?? 'email'}
                onChange={(e) => setEditing({ ...editing, channel: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
                <option value="in_app">In-app only</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-medium">Description (optional)</label>
              <textarea
                className="min-h-[60px] w-full rounded-md border bg-background px-2 py-1 text-xs"
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Describe when this rule should trigger and what action to take..."
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-medium">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="mr-2"
                />
                Rule is active
              </label>
            </div>
          </div>

          {/* AI Assistant Section (H01) */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">AI Assistant (Experimental)</p>
                <p className="text-[11px] text-muted-foreground">
                  Get AI-powered suggestions for conditions and notification templates
                </p>
              </div>
              <button
                type="button"
                onClick={askAI}
                disabled={aiLoading || !editing.name?.trim()}
                className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
              >
                {aiLoading ? 'Asking AI…' : '✨ Ask AI'}
              </button>
            </div>

            {aiError && (
              <div className="rounded-md border border-warning-500/40 bg-warning-500/5 p-3 text-xs text-warning-600">
                {aiError}
              </div>
            )}

            {aiSuggestions && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                {aiSuggestions.explanationSummary && (
                  <p className="text-xs text-muted-foreground">{aiSuggestions.explanationSummary}</p>
                )}

                {aiSuggestions.suggestedConditions && aiSuggestions.suggestedConditions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Suggested Conditions:</p>
                    {aiSuggestions.suggestedConditions.map((cond: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-2 rounded-md border bg-background p-2 text-xs">
                        <code className="text-[11px]">{JSON.stringify(cond)}</code>
                        <button
                          type="button"
                          onClick={() => applySuggestion('condition', cond)}
                          className="inline-flex h-6 items-center rounded-md border px-2 text-[11px] hover:bg-muted"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {aiSuggestions.suggestedNotificationTemplate && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Suggested Notification Template:</p>
                    <div className="flex items-start justify-between gap-2 rounded-md border bg-background p-2">
                      <p className="text-xs flex-1">{aiSuggestions.suggestedNotificationTemplate}</p>
                      <button
                        type="button"
                        onClick={() => applySuggestion('description', aiSuggestions.suggestedNotificationTemplate)}
                        className="inline-flex h-6 items-center rounded-md border px-2 text-[11px] hover:bg-muted"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-muted"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCurrent}
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
              disabled={saving || !editing.name?.trim()}
            >
              {saving ? 'Saving…' : editing.id ? 'Update rule' : 'Create rule'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
