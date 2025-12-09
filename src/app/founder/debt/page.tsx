"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface DebtItem {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  owner?: string;
  created_at: string;
}

interface DebtSummary {
  total_debt: number;
  open: number;
  in_progress: number;
  blocked: number;
  resolved: number;
  critical: number;
  high: number;
}

export default function OperationalDebtPage() {
  const [items, setItems] = useState<DebtItem[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetch(`/api/founder/debt?workspaceId=${userId}`).then((r) => r.json()),
        fetch(`/api/founder/debt?workspaceId=${userId}&action=summary`).then((r) => r.json()),
      ])
        .then(([itemsData, summaryData]) => {
          setItems(itemsData.items || []);
          setSummary(summaryData.summary);
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading...</div></div>;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500";
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500";
      default: return "bg-bg-card text-text-secondary border-border";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Operational Debt Register</h1>
          <p className="text-text-secondary mt-1">E34: Track long-lived governance, security, compliance, and code debt</p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Debt</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{summary.total_debt}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Open</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">{summary.open}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Critical</div>
              <div className="text-2xl font-bold text-red-500 mt-1">{summary.critical}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">High</div>
              <div className="text-2xl font-bold text-orange-500 mt-1">{summary.high}</div>
            </Card>
          </div>
        )}

        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Debt Items</h2>
          {items.length === 0 ? (
            <p className="text-text-secondary">No debt items found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`border-l-4 pl-4 py-2 ${getSeverityColor(item.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">{item.title}</span>
                        <span className="px-2 py-1 text-xs rounded bg-accent-500/10 text-accent-500 capitalize">
                          {item.category}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-bg-card text-text-secondary capitalize">
                          {item.status}
                        </span>
                      </div>
                      {item.owner && (
                        <p className="text-xs text-text-secondary">Owner: {item.owner}</p>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary whitespace-nowrap ml-4">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
