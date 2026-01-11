"use client";

/**
 * @fileoverview E43 AI Oversight Loop Page
 * AI-level evaluations of behaviour, content, and governance signals
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OversightPolicy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  threshold: number | null;
}

interface OversightEvent {
  id: string;
  policy_code: string;
  level: string;
  summary: string | null;
  details: string | null;
  impact_score: number | null;
  created_at: string;
}

interface Summary {
  total_policies: number;
  active_policies: number;
  total_events: number;
  block_events: number;
  risk_events: number;
  warning_events: number;
}

export default function AiOversightPage() {
  const [policies, setPolicies] = useState<OversightPolicy[]>([]);
  const [events, setEvents] = useState<OversightEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = "0642cf92-2617-419f-93ae-1d48652f2b03"; // TODO: Replace with auth context

  const loadData = async () => {
    setLoading(true);
    try {
      const [policiesRes, eventsRes, summaryRes] = await Promise.all([
        fetch(`/api/founder/ai-oversight?workspaceId=${workspaceId}`),
        fetch(`/api/founder/ai-oversight?workspaceId=${workspaceId}&action=events`),
        fetch(`/api/founder/ai-oversight?workspaceId=${workspaceId}&action=summary`),
      ]);

      const policiesData = await policiesRes.json();
      const eventsData = await eventsRes.json();
      const summaryData = await summaryRes.json();

      setPolicies(policiesData.policies || []);
      setEvents(eventsData.events || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error("Failed to load AI oversight data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "block":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "risk":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex items-center justify-center">
        <div className="text-text-secondary">Loading AI oversight...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary p-6 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Synthex-L1 AI Oversight Loop
        </h1>
        <p className="text-sm text-text-secondary">
          AI-level evaluations of behaviour, content quality, and governance signals
        </p>
      </header>

      {/* Summary Cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Total Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.total_policies}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {summary.active_policies} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.total_events}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Block/Risk Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">
                {summary.block_events + summary.risk_events}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {summary.block_events} blocks, {summary.risk_events} risks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                {summary.warning_events}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Policies Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Oversight Policies
        </h2>
        <Card className="bg-bg-card border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-text-secondary">Code</th>
                <th className="px-4 py-2 text-left text-text-secondary">Name</th>
                <th className="px-4 py-2 text-left text-text-secondary">Threshold</th>
                <th className="px-4 py-2 text-left text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-text-secondary" colSpan={4}>
                    No AI oversight policies configured yet.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-xs font-mono text-text-primary">{p.code}</td>
                    <td className="px-4 py-2 text-text-primary">{p.name}</td>
                    <td className="px-4 py-2 text-text-secondary">
                      {typeof p.threshold === "number" ? p.threshold.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          p.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Recent Events */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Recent AI Oversight Events
        </h2>
        <Card className="bg-bg-card border-border divide-y divide-border">
          {events.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-secondary">
              No AI oversight events recorded yet.
            </div>
          ) : (
            events.map((e) => (
              <article
                key={e.id}
                className="px-4 py-3 flex items-start justify-between gap-4 text-sm"
              >
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-mono text-text-secondary">{e.policy_code}</div>
                  <div className="text-sm text-text-primary">
                    {e.summary || "No summary provided"}
                  </div>
                  {e.details && (
                    <div className="text-xs text-text-secondary line-clamp-2">{e.details}</div>
                  )}
                  {typeof e.impact_score === "number" && (
                    <div className="text-xs text-text-secondary">
                      Impact: {e.impact_score.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${getLevelBadgeClass(
                      e.level
                    )}`}
                  >
                    {e.level.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
              </article>
            ))
          )}
        </Card>
      </section>
    </main>
  );
}
