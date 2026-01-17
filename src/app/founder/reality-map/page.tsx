"use client";

/**
 * @fileoverview E42 Founder Reality Map Page
 * High-level truth panels summarising actual system state
 */

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RealityPanel {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
}

interface RealitySnapshot {
  id: string;
  panel_code: string;
  score: number | null;
  level: string;
  summary: string | null;
  created_at: string;
}

interface Summary {
  total_panels: number;
  active_panels: number;
  critical_panels: number;
  avg_score: number;
}

export default function FounderRealityMapPage() {
  const [panels, setPanels] = useState<RealityPanel[]>([]);
  const [snapshots, setSnapshots] = useState<RealitySnapshot[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = "0642cf92-2617-419f-93ae-1d48652f2b03"; // TODO: Replace with auth context

  const loadData = async () => {
    setLoading(true);
    try {
      const [panelsRes, snapshotsRes, summaryRes] = await Promise.all([
        fetch(`/api/founder/reality-map?workspaceId=${workspaceId}`),
        fetch(`/api/founder/reality-map?workspaceId=${workspaceId}&action=snapshots`),
        fetch(`/api/founder/reality-map?workspaceId=${workspaceId}&action=summary`),
      ]);

      const panelsData = await panelsRes.json();
      const snapshotsData = await snapshotsRes.json();
      const summaryData = await summaryRes.json();

      setPanels(panelsData.panels || []);
      setSnapshots(snapshotsData.snapshots || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error("Failed to load reality map data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestByPanel = useMemo(() => {
    const map: Record<string, RealitySnapshot> = {};
    for (const snap of snapshots) {
      if (!map[snap.panel_code]) {
        map[snap.panel_code] = snap;
      }
    }
    return map;
  }, [snapshots]);

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "healthy":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "watch":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "stress":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "critical":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex items-center justify-center">
        <div className="text-text-secondary">Loading reality map...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary p-6 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Founder Reality Map
        </h1>
        <p className="text-sm text-text-secondary">
          High-level truth panels summarising the actual state of the system
        </p>
      </header>

      {/* Summary Cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Total Panels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.total_panels}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Active Panels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.active_panels}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Critical Panels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-error-400">
                {summary.critical_panels}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {typeof summary.avg_score === "number"
                  ? summary.avg_score.toFixed(1)
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Reality Panels */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {panels.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-sm text-text-secondary">
              No reality map panels defined yet.
            </p>
          </div>
        ) : (
          panels.map((panel) => {
            const snap = latestByPanel[panel.code];
            return (
              <Card key={panel.id} className="bg-bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-text-primary">
                      {panel.title}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${getLevelBadgeClass(
                        snap?.level || "unknown"
                      )}`}
                    >
                      {(snap?.level || "UNKNOWN").toUpperCase()}
                    </span>
                  </div>
                  {panel.description && (
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {panel.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-semibold text-text-primary">
                    {typeof snap?.score === "number" ? snap.score.toFixed(1) : "—"}
                  </div>
                  {snap?.summary && (
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {snap.summary}
                    </p>
                  )}
                  {snap && (
                    <p className="text-[11px] text-text-secondary">
                      Updated {new Date(snap.created_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </main>
  );
}
