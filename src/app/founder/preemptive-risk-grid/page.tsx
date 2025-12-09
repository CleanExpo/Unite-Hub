"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type PreemptiveRisk = {
  id: string;
  risk_domain: string;
  risk_level: string;
  risk_score: number;
  factors: any;
  contributing_signals: any;
  risk_indicators: string[] | null;
  potential_impact: string | null;
  escalation_probability: number | null;
  time_to_escalation: string | null;
  mitigation_strategies: string[] | null;
  preventive_actions: string[] | null;
  monitoring_triggers: string[] | null;
  created_at: string;
};

type RiskSummary = {
  avg_risk_score: number;
  max_risk_score: number;
  severe_count: number;
  critical_count: number;
  high_count: number;
  by_domain: Record<string, number>;
  period_days: number;
};

export default function PreemptiveRiskGridPage() {
  const [risks, setRisks] = useState<PreemptiveRisk[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        const summaryRes = await fetch(
          `/api/founder/preemptive-risk-grid?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const riskRes = await fetch(
          `/api/founder/preemptive-risk-grid?workspaceId=${workspaceId}&limit=50`
        );
        const riskData = await riskRes.json();
        setRisks(riskData.risks || []);
      } catch (error) {
        console.error("Failed to load preemptive risk:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const domainColor = (domain: string) => {
    const colors: Record<string, string> = {
      cognitive: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      emotional: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      operational: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      strategic: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      social: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      financial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      health: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return colors[domain] || "bg-bg-subtle text-text-secondary border-border";
  };

  const riskColor = (level: string) => {
    const colors: Record<string, string> = {
      severe: "bg-red-600/10 text-red-300",
      critical: "bg-red-500/10 text-red-400",
      high: "bg-orange-500/10 text-orange-400",
      moderate: "bg-amber-500/10 text-amber-400",
      low: "bg-emerald-500/10 text-emerald-400",
      minimal: "bg-green-500/10 text-green-400",
    };
    return colors[level] || "bg-bg-subtle text-text-secondary";
  };

  const scoreColor = (score: number) => {
    if (score >= 85) {
return "text-red-300";
}
    if (score >= 75) {
return "text-red-400";
}
    if (score >= 60) {
return "text-orange-400";
}
    if (score >= 40) {
return "text-amber-400";
}
    return "text-emerald-400";
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-text-secondary">Loading...</div>
      </main>
    );
  }

  if (!workspaceId) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-text-secondary">Please log in to view preemptive risk analysis.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Pre-Emptive Risk Grid
        </h1>
        <p className="text-text-secondary">
          Identifies structural, behavioural, and temporal risks before they escalate
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Risk Score</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.avg_risk_score)}`}>
              {summary.avg_risk_score.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Severe Risks</div>
            <div className="text-3xl font-semibold text-red-300">
              {summary.severe_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Critical Risks</div>
            <div className="text-3xl font-semibold text-red-400">
              {summary.critical_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">High Risks</div>
            <div className="text-3xl font-semibold text-orange-400">
              {summary.high_count}
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Risk Assessments</h2>
        </div>

        <div className="divide-y divide-border">
          {risks.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No preemptive risks detected
            </div>
          ) : (
            risks.map((risk) => (
              <div key={risk.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${domainColor(
                        risk.risk_domain
                      )}`}
                    >
                      {risk.risk_domain}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${riskColor(
                        risk.risk_level
                      )}`}
                    >
                      {risk.risk_level}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${scoreColor(risk.risk_score)}`}>
                      {risk.risk_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">risk score</div>
                  </div>
                </div>

                {risk.escalation_probability !== null && risk.time_to_escalation && (
                  <div className="mb-3 text-sm">
                    <span className="text-text-secondary">Escalation: </span>
                    <span className="text-amber-400 font-medium">
                      {risk.escalation_probability.toFixed(0)}% in {risk.time_to_escalation}
                    </span>
                  </div>
                )}

                {risk.mitigation_strategies && risk.mitigation_strategies.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Mitigation Strategies</div>
                    <div className="text-sm text-text-primary">
                      <ul className="list-disc list-inside space-y-1">
                        {risk.mitigation_strategies.map((strategy, i) => (
                          <li key={i}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary mt-4">
                  {new Date(risk.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
