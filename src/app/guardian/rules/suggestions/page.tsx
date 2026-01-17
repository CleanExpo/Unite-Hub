'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Guardian AI Rule Suggestion Studio (H01)
 * /guardian/rules/suggestions
 *
 * Advisory-only suggestions from AI/heuristics:
 * - List suggestions with status, source, confidence
 * - Detail view with rationale, signals, rule draft
 * - Admin actions: Review/Accept/Reject/Apply
 * - Generate button with window selector
 * - Link to rule editor after apply
 */

interface Suggestion {
  id: string;
  title: string;
  rationale: string;
  source: 'ai' | 'heuristic';
  status: 'new' | 'reviewing' | 'accepted' | 'rejected' | 'applied' | 'expired';
  confidence: number | null;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
}

interface SuggestionDetail extends Suggestion {
  signals: Record<string, unknown>;
  ruleDraft: {
    name: string;
    type: string;
    description: string;
    config: Record<string, unknown>;
    enabled: boolean;
  };
  safety: {
    promptRedacted: boolean;
    validationPassed: boolean;
    validationErrors: string[];
    prohibitedKeysFound: string[];
  };
  appliedRuleId: string | null;
  metadata: Record<string, unknown>;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-info-100 text-info-800',
  reviewing: 'bg-warning-100 text-warning-800',
  accepted: 'bg-success-100 text-success-800',
  rejected: 'bg-error-100 text-error-800',
  applied: 'bg-purple-100 text-purple-800',
  expired: 'bg-bg-hover text-text-secondary',
};

const SOURCE_COLORS: Record<string, string> = {
  ai: 'bg-indigo-100 text-indigo-800',
  heuristic: 'bg-warning-100 text-warning-800',
};

export default function GuardianSuggestionsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  // State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SuggestionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generateWindow, setGenerateWindow] = useState('24');

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load suggestions list
  const loadSuggestions = useCallback(async () => {
    if (!workspaceId) {
      setError('workspaceId required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions?workspaceId=${workspaceId}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load suggestions');
      setSuggestions(json.suggestions || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Load suggestion detail
  const loadDetail = useCallback(async (id: string) => {
    if (!workspaceId) return;
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions/${id}?workspaceId=${workspaceId}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load suggestion');
      setDetail(json);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to load suggestion');
    } finally {
      setDetailLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // When selection changes, load detail
  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  // Generate new suggestions
  async function handleGenerate() {
    if (!workspaceId) {
      setActionError('workspaceId required');
      return;
    }

    setGenerating(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            windowHours: parseInt(generateWindow) || 24,
            maxSuggestions: 10,
            expiresInDays: 30,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate suggestions');

      // Reload list
      await loadSuggestions();
      setActionError(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  }

  // Record feedback
  async function recordFeedback(action: string) {
    if (!selectedId || !workspaceId) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions/${selectedId}/feedback?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record feedback');

      // Update local status
      if (detail) {
        setDetail({ ...detail, status: action as any });
      }
      await loadSuggestions();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to record feedback');
    } finally {
      setActionLoading(false);
    }
  }

  // Update status
  async function updateStatus(status: string) {
    if (!selectedId || !workspaceId) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions/${selectedId}?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update status');

      if (detail) {
        setDetail({ ...detail, status: status as any });
      }
      await loadSuggestions();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  // Apply suggestion (create rule)
  async function applySuggestion() {
    if (!selectedId || !workspaceId || !detail) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/guardian/ai/rule-suggestions/${selectedId}/apply?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to apply suggestion');

      // Navigate to rule editor with rule ID
      if (json.ruleId) {
        // Window open to rule editor instead of replacing
        window.open(`/guardian/rules?edit=${json.ruleId}&workspaceId=${workspaceId}`, '_blank');
      }

      // Reload and update
      setDetail({ ...detail, status: 'applied', appliedRuleId: json.ruleId });
      await loadSuggestions();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to apply suggestion');
    } finally {
      setActionLoading(false);
    }
  }

  if (!workspaceId) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          workspaceId required in URL
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Rule Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated and heuristic rule suggestions. Advisory-only — review and apply to create draft rules.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generate Section */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium mb-2">Signal Window</label>
            <select
              value={generateWindow}
              onChange={(e) => setGenerateWindow(e.target.value)}
              disabled={generating}
              className="rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="24">Last 24 hours</option>
              <option value="168">Last 7 days</option>
              <option value="720">Last 30 days</option>
            </select>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Suggestions'}
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4">
        {/* Suggestions List */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">Suggestions</h2>
          {loading && suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No suggestions yet. Generate suggestions to get started.
            </p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left rounded-lg border p-2 text-xs transition ${
                    selectedId === s.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-1">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {s.rationale}
                      </div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${SOURCE_COLORS[s.source]}`}>
                          {s.source}
                        </span>
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${STATUS_COLORS[s.status]}`}>
                          {s.status}
                        </span>
                        {s.confidence !== null && (
                          <span className="px-2 py-1 rounded bg-bg-hover text-text-secondary text-[10px] font-medium">
                            {(s.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Detail Panel */}
        <section className="rounded-xl border bg-card p-4 space-y-4">
          {detailLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : !selectedId || !detail ? (
            <p className="text-xs text-muted-foreground">Select a suggestion to view details</p>
          ) : (
            <>
              {actionError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                  {actionError}
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">{detail.title}</h3>
                <p className="text-xs text-muted-foreground">{detail.rationale}</p>
              </div>

              {/* Signals */}
              <div>
                <h4 className="text-xs font-medium mb-1">Signals</h4>
                <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-auto max-h-[150px]">
                  {JSON.stringify(detail.signals, null, 2)}
                </pre>
              </div>

              {/* Rule Draft */}
              <div>
                <h4 className="text-xs font-medium mb-1">Rule Draft</h4>
                <div className="text-xs bg-muted/40 rounded p-2 space-y-1 max-h-[150px] overflow-auto">
                  <div><span className="font-medium">Type:</span> {detail.ruleDraft.type}</div>
                  <div><span className="font-medium">Name:</span> {detail.ruleDraft.name}</div>
                  <div><span className="font-medium">Description:</span> {detail.ruleDraft.description}</div>
                  <div><span className="font-medium">Enabled:</span> {detail.ruleDraft.enabled ? 'Yes' : 'No (draft)'}</div>
                  <details className="mt-1">
                    <summary className="cursor-pointer font-medium">Config</summary>
                    <pre className="text-[9px] mt-1">{JSON.stringify(detail.ruleDraft.config, null, 2)}</pre>
                  </details>
                </div>
              </div>

              {/* Safety */}
              {!detail.safety.validationPassed && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 p-2 text-xs text-warning-800">
                  <div className="font-medium">Safety Issues:</div>
                  <ul className="mt-1 space-y-1">
                    {detail.safety.validationErrors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {detail.safety.prohibitedKeysFound.length > 0 && (
                      <li>• Prohibited keys found: {detail.safety.prohibitedKeysFound.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                {detail.status === 'new' && (
                  <>
                    <button
                      onClick={() => updateStatus('reviewing')}
                      disabled={actionLoading}
                      className="h-8 px-3 rounded-md bg-info-600 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      Mark Reviewing
                    </button>
                    <button
                      onClick={() => updateStatus('accepted')}
                      disabled={actionLoading}
                      className="h-8 px-3 rounded-md bg-success-600 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </>
                )}

                {(detail.status === 'reviewing' || detail.status === 'accepted') && (
                  <>
                    <button
                      onClick={applySuggestion}
                      disabled={actionLoading || !detail.safety.validationPassed}
                      className="h-8 px-3 rounded-md bg-purple-600 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading ? 'Applying…' : 'Apply & Create Rule'}
                    </button>
                    <button
                      onClick={() => updateStatus('rejected')}
                      disabled={actionLoading}
                      className="h-8 px-3 rounded-md border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}

                {detail.status === 'applied' && (
                  <a
                    href={`/guardian/rules?edit=${detail.appliedRuleId}&workspaceId=${workspaceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 flex items-center justify-center col-span-2"
                  >
                    Open in Rule Editor →
                  </a>
                )}

                {detail.status === 'rejected' && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Suggestion rejected. Cannot be re-applied.
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <div>Created: {new Date(detail.createdAt).toLocaleString()}</div>
                {detail.expiresAt && (
                  <div>Expires: {new Date(detail.expiresAt).toLocaleString()}</div>
                )}
                {detail.createdBy && <div>Created by: {detail.createdBy}</div>}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
