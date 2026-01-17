"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";

type Capability = {
  capabilityKey: string;
  score: number;
  status: string;
};

type ScorecardSnapshot = {
  overallScore: number | null;
  overallStatus: string | null;
  computedAt: string | null;
  capabilities: Capability[];
};

export default function GuardianScorecardPage() {
  const [snapshot, setSnapshot] = useState<ScorecardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    void fetch(`/api/guardian/meta/readiness?workspaceId=${workspaceId}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load readiness");
        }
        return res.json();
      })
      .then((payload) => {
        if (!payload || !payload.readiness) {
          setSnapshot({ overallScore: null, overallStatus: null, computedAt: null, capabilities: [] });
          return;
        }
        const readiness = payload.readiness;
        setSnapshot({
          overallScore: readiness.overall_guardian_score,
          overallStatus: readiness.overall_status,
          computedAt: readiness.computed_at,
          capabilities: readiness.capabilities || [],
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load scorecard");
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const statusBadge = (status: string | null) => {
    let color = "bg-bg-elevated text-text-secondary";
    if (status === "operational") {
color = "bg-success-900 text-success-300";
}
    if (status === "degraded") {
color = "bg-warning-900 text-warning-300";
}
    if (status === "at-risk") {
color = "bg-error-900 text-error-300";
}
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
        {status ?? "unknown"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold">Guardian Scorecard</h1>
        {loading && <p className="text-sm text-text-muted">Loading scorecard...</p>}
        {error && <p className="text-sm text-error-400">{error}</p>}

        {!loading && !snapshot && !error && (
          <div className="rounded-lg border border-border bg-bg-card p-8 text-center text-text-tertiary">
            No readiness data yet.
          </div>
        )}

        {snapshot && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm text-text-muted">Overall Score</p>
                  <p className="text-4xl font-semibold">{snapshot.overallScore ?? "—"}</p>
                </div>
                <div className="flex flex-col items-start text-right md:items-end">
                  <p className="text-xs uppercase text-text-muted">
                    Computed {snapshot.computedAt ? new Date(snapshot.computedAt).toLocaleString() : "—"}
                  </p>
                  {statusBadge(snapshot.overallStatus)}
                </div>
              </div>
            </div>

            {snapshot.capabilities.length > 0 ? (
              <div className="space-y-4 rounded-2xl border border-border bg-bg-card p-6">
                <h2 className="text-lg font-semibold text-white">Capability breakdown</h2>
                <div className="grid gap-3">
                  {snapshot.capabilities.map((cap) => (
                    <div
                      key={cap.capabilityKey}
                      className="flex items-center justify-between rounded-lg border border-border bg-bg-base px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{cap.capabilityKey}</p>
                        <p className="text-xs text-text-muted">Score: {cap.score}</p>
                      </div>
                      {statusBadge(cap.status)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border-subtle bg-bg-card p-4 text-sm text-text-muted">
                Capability details unavailable.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
