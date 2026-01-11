'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian AI Governance Admin UI (H05)
 * /guardian/admin/ai
 *
 * Centralized AI feature management:
 * - Feature toggles (rule assistant, anomaly detection, correlation refinement)
 * - Quota controls (daily calls, token limits)
 * - Usage monitoring (calls by feature, last call, errors)
 */

interface AiSettings {
  id: string;
  tenant_id: string;
  ai_enabled: boolean;
  rule_assistant_enabled: boolean;
  anomaly_detection_enabled: boolean;
  correlation_refinement_enabled: boolean;
  predictive_scoring_enabled: boolean;
  max_daily_ai_calls: number;
  soft_token_limit: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface AiUsage {
  totalAiCalls: number;
  callsByFeature: {
    ruleAssistant: number;
    anomalyDetection: number;
    correlationRefinement: number;
    predictiveScoring: number;
  };
  lastCallAt: string | null;
  errorCount: number;
  approximateTokenUsage: number | null;
}

export default function GuardianAiAdminPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/admin/ai/settings');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Unable to load AI settings');

      setSettings(json.settings);
    } catch (err: any) {
      setError(err?.message || 'Unable to load AI settings');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsage() {
    try {
      const res = await fetch('/api/guardian/admin/ai/usage?windowHours=24');
      const json = await res.json();

      if (res.ok) {
        setUsage(json.usage);
      }
    } catch (err) {
      console.error('Failed to load AI usage:', err);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/guardian/admin/ai/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Unable to save AI settings');

      setSettings(json.settings);
      setSuccess('AI settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Unable to save AI settings');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
    loadUsage();
  }, []);

  if (loading && !settings) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading AI governance settings…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian AI Governance</h1>
        <p className="text-sm text-muted-foreground">
          Manage AI feature toggles, quotas, and usage monitoring for your workspace.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Feature Toggles */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">AI Feature Toggles</h2>
        <p className="text-sm text-muted-foreground">
          Control which Guardian AI features are enabled for your workspace.
        </p>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.ai_enabled ?? true}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, ai_enabled: e.target.checked } : null))
              }
              className="h-4 w-4"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Master AI Toggle</p>
              <p className="text-xs text-muted-foreground">
                Enable/disable all Guardian AI features
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.rule_assistant_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, rule_assistant_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">AI Rule Assistant (H01)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered rule authoring suggestions
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.anomaly_detection_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, anomaly_detection_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Anomaly Detection (H02)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered anomaly pattern detection
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.correlation_refinement_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, correlation_refinement_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Correlation Refinement (H03)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered correlation cluster improvements
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.predictive_scoring_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, predictive_scoring_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Predictive Scoring (H04)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered predictive incident scoring (future)
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.briefing_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, briefing_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Executive Briefings (H07)</p>
              <p className="text-xs text-muted-foreground">
                AI-generated narrative summaries and recommendations
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.investigation_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, investigation_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Investigation Console (H08)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered natural-language query interface for Guardian data
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.explainability_enabled ?? true}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, explainability_enabled: e.target.checked } : null
                )
              }
              className="h-4 w-4"
              disabled={!settings?.ai_enabled}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Explainability Hub (H09)</p>
              <p className="text-xs text-muted-foreground">
                AI-powered explanations for alerts, incidents, anomalies
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* Quotas */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">AI Usage Quotas</h2>
        <p className="text-sm text-muted-foreground">
          Set safety limits for AI usage to control costs and prevent abuse.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Max Daily AI Calls</label>
            <input
              type="number"
              min="0"
              max="10000"
              value={settings?.max_daily_ai_calls ?? 500}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, max_daily_ai_calls: parseInt(e.target.value) } : null
                )
              }
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum AI calls per 24 hours (0-10,000)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Soft Token Limit</label>
            <input
              type="number"
              min="0"
              max="10000000"
              value={settings?.soft_token_limit ?? 200000}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, soft_token_limit: parseInt(e.target.value) } : null
                )
              }
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Soft limit for daily token usage (0-10M)
            </p>
          </div>
        </div>
      </section>

      {/* Usage Summary */}
      {usage && (
        <section className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">AI Usage (Last 24h)</h2>
            <button
              type="button"
              onClick={loadUsage}
              className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-semibold">{usage.totalAiCalls}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rule Assistant</p>
              <p className="text-2xl font-semibold">{usage.callsByFeature.ruleAssistant}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Anomaly Detection</p>
              <p className="text-2xl font-semibold">{usage.callsByFeature.anomalyDetection}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Correlation</p>
              <p className="text-2xl font-semibold">{usage.callsByFeature.correlationRefinement}</p>
            </div>
          </div>

          {usage.lastCallAt && (
            <p className="text-xs text-muted-foreground">
              Last AI call: {new Date(usage.lastCallAt).toLocaleString()}
            </p>
          )}

          {usage.approximateTokenUsage && (
            <p className="text-xs text-muted-foreground">
              Approximate tokens: {usage.approximateTokenUsage.toLocaleString()}
            </p>
          )}

          {usage.errorCount > 0 && (
            <p className="text-xs text-amber-600">
              Errors: {usage.errorCount} call(s) failed
            </p>
          )}
        </section>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving || !settings}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </main>
  );
}
