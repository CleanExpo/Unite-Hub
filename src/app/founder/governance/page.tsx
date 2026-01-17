"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface GovernanceMetric {
  metric: string;
  value: number;
  computed_at: string;
}

export default function GovernanceScorecardPage() {
  const [scorecard, setScorecard] = useState<GovernanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      fetch(`/api/founder/governance?workspaceId=${userId}`)
        .then((r) => r.json())
        .then((data) => setScorecard(data.scorecard || []))
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading...</div></div>;

  const getMetricLabel = (metric: string) => {
    return metric.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getMetricColor = (metric: string, value: number) => {
    if (metric.includes("score")) {
      if (value >= 80) return "text-success-500";
      if (value >= 60) return "text-warning-500";
      return "text-error-500";
    }
    if (metric.includes("critical") || metric.includes("incident")) {
      return value > 0 ? "text-error-500" : "text-success-500";
    }
    return "text-text-primary";
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Governance Scorecard</h1>
          <p className="text-text-secondary mt-1">E36: Automated governance health metrics from E28-E35</p>
        </div>

        {scorecard.length === 0 ? (
          <Card className="bg-bg-card border-border p-6">
            <p className="text-text-secondary">No governance metrics computed yet. Metrics are automatically computed from E28-E35 data.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scorecard.map((m) => (
              <Card key={m.metric} className="bg-bg-card border-border p-6">
                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">{getMetricLabel(m.metric)}</div>
                  <div className={`text-3xl font-bold ${getMetricColor(m.metric, m.value)}`}>
                    {m.metric.includes("score") ? `${m.value}%` : m.value}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Updated: {new Date(m.computed_at).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">About Governance Scorecard</h2>
          <div className="text-sm text-text-secondary space-y-2">
            <p>The governance scorecard aggregates health metrics from:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>E28:</strong> Risk Events & Security Incidents</li>
              <li><strong>E31:</strong> SLA Violations & Uptime Issues</li>
              <li><strong>E34:</strong> Operational Debt Items</li>
              <li><strong>E35:</strong> Remediation Tasks</li>
            </ul>
            <p className="mt-4">Metrics are automatically computed and updated. The compliance score is calculated based on open incidents, unresolved debt, and remediation tasks.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
