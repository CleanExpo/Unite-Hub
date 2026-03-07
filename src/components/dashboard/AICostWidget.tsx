"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface AICostDashboardData {
  today: {
    total_cost: string;
    budget_remaining: string;
    percentage_used: number;
    at_risk: boolean;
  } | null;
  this_month: {
    total_cost: string;
    budget_remaining: string;
    percentage_used: number;
  } | null;
  breakdown: Array<{
    provider: string;
    task_type: string;
    request_count: number;
    total_cost_usd: number;
    avg_cost_usd: number;
  }>;
  savings: {
    total_saved: string;
    savings_percentage: string;
    openrouter_usage: string;
  };
}

interface AICostWidgetProps {
  workspaceId: string;
}

export function AICostWidget({ workspaceId }: AICostWidgetProps) {
  const [data, setData] = useState<AICostDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'breakdown'>('today');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/ai/cost-dashboard?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch AI cost data");
      }
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching AI cost dashboard:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-white/20" />
          <p className="text-sm font-mono font-bold text-white/90">AI Usage & Costs</p>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-4">Loading...</p>
        <div className="flex items-center justify-center h-48">
          <Activity className="h-8 w-8 animate-spin text-white/20" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-white/20" />
          <p className="text-sm font-mono font-bold text-white/90">AI Usage & Costs</p>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF4444]">{error || "No data available"}</p>
      </div>
    );
  }

  const tabs: Array<{ id: 'today' | 'month' | 'breakdown'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'month', label: 'This Month' },
    { id: 'breakdown', label: 'Breakdown' },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-[#00F5FF]" />
        <p className="text-sm font-mono font-bold text-white/90">AI Usage & Costs</p>
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-4">
        OpenRouter-first cost optimisation (70% savings)
      </p>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-white/[0.06] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? 'text-[#00F5FF] border-b-2 border-[#00F5FF] -mb-px'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Usage */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {data.today ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-mono text-white/90">{data.today.total_cost}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Spent today</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-white/90">{data.today.budget_remaining}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Remaining</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Budget Usage</span>
                  <span className="font-mono font-bold text-white/90">{data.today.percentage_used.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      data.today.percentage_used >= 90
                        ? 'bg-[#FF4444]'
                        : data.today.percentage_used >= 80
                          ? 'bg-[#FFB800]'
                          : 'bg-[#00FF88]'
                    }`}
                    style={{ width: `${Math.min(data.today.percentage_used, 100)}%` }}
                  />
                </div>
              </div>

              {data.today.at_risk ? (
                <div className="flex items-center gap-2 p-3 border border-[#FFB800]/20 bg-[#FFB800]/[0.04] rounded-sm">
                  <AlertTriangle className="h-4 w-4 text-[#FFB800]" />
                  <p className="text-xs font-mono text-[#FFB800]">
                    Approaching daily budget limit
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border border-[#00FF88]/20 bg-[#00FF88]/[0.04] rounded-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#00FF88]" />
                  <p className="text-xs font-mono text-[#00FF88]">Budget on track</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs font-mono text-white/30">No usage data for today</p>
          )}
        </div>
      )}

      {/* Monthly Usage */}
      {activeTab === 'month' && (
        <div className="space-y-4">
          {data.this_month ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-mono text-white/90">{data.this_month.total_cost}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Spent this month</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-white/90">{data.this_month.budget_remaining}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Remaining</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Monthly Budget</span>
                  <span className="font-mono font-bold text-white/90">{data.this_month.percentage_used.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      data.this_month.percentage_used >= 90
                        ? 'bg-[#FF4444]'
                        : data.this_month.percentage_used >= 80
                          ? 'bg-[#FFB800]'
                          : 'bg-[#00FF88]'
                    }`}
                    style={{ width: `${Math.min(data.this_month.percentage_used, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="text-lg font-bold font-mono text-[#00FF88]">{data.savings.total_saved}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Saved</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-white/90">{data.savings.savings_percentage}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Savings Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-white/90">{data.savings.openrouter_usage}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">OpenRouter</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs font-mono text-white/30">No usage data for this month</p>
          )}
        </div>
      )}

      {/* Cost Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="space-y-3">
          {data.breakdown && data.breakdown.length > 0 ? (
            <>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Top consumers</p>
              {data.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/[0.02] rounded-sm border border-white/[0.04]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 border rounded-sm text-[10px] font-mono ${
                          item.provider === 'openrouter'
                            ? 'border-[#00F5FF]/30 text-[#00F5FF]'
                            : 'border-white/[0.06] text-white/40'
                        }`}
                      >
                        {item.provider}
                      </span>
                      <span className="font-mono text-sm text-white/90">{item.task_type}</span>
                    </div>
                    <p className="text-xs font-mono text-white/30 mt-1">
                      {item.request_count.toLocaleString()} requests @ ${item.avg_cost_usd.toFixed(4)} avg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-white/90">${item.total_cost_usd.toFixed(2)}</p>
                    {item.provider === "openrouter" && (
                      <div className="flex items-center gap-1 text-[#00FF88]">
                        <TrendingDown className="h-3 w-3" />
                        <span className="text-[10px] font-mono">69% saved</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs font-mono text-white/30">No cost breakdown available</p>
          )}
        </div>
      )}
    </div>
  );
}
