"use client";

/**
 * @fileoverview E45 Critical Path Engine Page
 * Visualise key initiatives, dependencies, and bottlenecks
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CriticalPath {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  target_date: string | null;
}

interface CriticalNode {
  id: string;
  path_code: string;
  node_code: string;
  label: string;
  description: string | null;
  depends_on: string[] | null;
  state: string;
  weight: number;
  assignee: string | null;
}

interface PathSummary {
  total_nodes: number;
  pending_nodes: number;
  in_progress_nodes: number;
  blocked_nodes: number;
  done_nodes: number;
  total_weight: number;
  completed_weight: number;
  completion_pct: number;
}

export default function CriticalPathPage() {
  const [paths, setPaths] = useState<CriticalPath[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<CriticalNode[]>([]);
  const [summary, setSummary] = useState<PathSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = "0642cf92-2617-419f-93ae-1d48652f2b03"; // TODO: Replace with auth context

  const loadPaths = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/founder/critical-path?workspaceId=${workspaceId}`);
      const data = await res.json();
      setPaths(data.paths || []);
      if ((data.paths || []).length > 0) {
        setSelectedCode(data.paths[0].code);
      }
    } catch (error) {
      console.error("Failed to load critical paths:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async (pathCode: string) => {
    try {
      const [nodesRes, summaryRes] = await Promise.all([
        fetch(`/api/founder/critical-path?workspaceId=${workspaceId}&action=nodes&pathCode=${encodeURIComponent(pathCode)}`),
        fetch(`/api/founder/critical-path?workspaceId=${workspaceId}&action=summary&pathCode=${encodeURIComponent(pathCode)}`),
      ]);

      const nodesData = await nodesRes.json();
      const summaryData = await summaryRes.json();

      setNodes(nodesData.nodes || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error("Failed to load critical nodes:", error);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  useEffect(() => {
    if (selectedCode) {
      loadNodes(selectedCode);
    }
  }, [selectedCode]);

  const getStateBadgeClass = (state: string) => {
    switch (state) {
      case "done":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "blocked":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "skipped":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex items-center justify-center">
        <div className="text-text-secondary">Loading critical paths...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary p-6 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Founder Critical Path Engine
        </h1>
        <p className="text-sm text-text-secondary">
          Visualise key initiatives, dependencies, and bottlenecks
        </p>
      </header>

      {/* Summary Cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.completion_pct.toFixed(0)}%
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {summary.done_nodes} / {summary.total_nodes} nodes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {summary.in_progress_nodes}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{summary.blocked_nodes}</div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                {summary.pending_nodes}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Critical Paths Selector */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          Critical Paths
        </h2>
        {paths.length === 0 ? (
          <Card className="bg-bg-card border-border p-8 text-center">
            <p className="text-sm text-text-secondary">No critical paths defined yet.</p>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {paths.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedCode(p.code)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedCode === p.code
                    ? "bg-accent-500 text-white border-accent-500"
                    : "bg-bg-card text-text-primary border-border hover:border-accent-500/50"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Critical Path Nodes */}
      {selectedCode && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            Nodes for: {selectedCode}
          </h2>
          {nodes.length === 0 ? (
            <Card className="bg-bg-card border-border p-8 text-center">
              <p className="text-sm text-text-secondary">
                No nodes recorded for this path yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {nodes.map((n) => (
                <Card key={n.id} className="bg-bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium text-text-primary">
                            {n.label}
                          </CardTitle>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStateBadgeClass(
                              n.state
                            )}`}
                          >
                            {n.state.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-text-secondary">
                          {n.node_code}
                        </div>
                        {n.description && (
                          <p className="text-xs text-text-secondary">{n.description}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-text-secondary space-y-1">
                        <div>Weight: {n.weight.toFixed(1)}</div>
                        {n.assignee && <div>Assignee: {n.assignee}</div>}
                      </div>
                    </div>
                  </CardHeader>
                  {n.depends_on && n.depends_on.length > 0 && (
                    <CardContent>
                      <div className="text-[11px] text-text-secondary">
                        <span className="font-medium">Depends on:</span> {n.depends_on.join(", ")}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
