"use client";

/**
 * Staff Dashboard — Business Performance KPI Cards
 * UNI-888 | UNI-1082 | UNI-1080 | UNI-1081
 *
 * Shows 6 business KPI cards with MRR, active users, top metric, and 30-day sparklines.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BusinessKpiCard, BusinessKpiCardSkeleton } from "@/components/dashboard/BusinessKpiCard";
import type { BusinessKpiData } from "@/components/dashboard/BusinessKpiCard";
import { RefreshCw, Building2, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessKpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchKpis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/kpi-summary");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKpis(); }, []);

  // ─── Summary stats ────────────────────────────────────────────────────────

  const totalMrr     = businesses.reduce((acc, b) => acc + b.mrr, 0);
  const totalUsers   = businesses.reduce((acc, b) => acc + b.activeUsers, 0);
  const healthyCount = businesses.filter(b => b.status === "healthy").length;
  const criticalCount = businesses.filter(b => b.status === "critical").length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
              <Building2 className="w-6 h-6 text-[#00F5FF]" />
              Business Performance
            </h1>
            <p className="text-sm text-white/40 mt-1 font-mono">
              Real-time KPI view across all 6 Unite Group businesses
            </p>
            {lastUpdated && (
              <p className="text-xs text-white/20 mt-0.5 font-mono">
                Last updated {lastUpdated.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <button
            onClick={fetchKpis}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.06] font-mono"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total MRR",    value: `$${totalMrr >= 1000 ? `${(totalMrr / 1000).toFixed(1)}k` : totalMrr.toLocaleString()}`, icon: TrendingUp,  color: "text-[#00F5FF]" },
            { label: "Active Users", value: totalUsers.toLocaleString(),  icon: BarChart2,    color: "text-[#FF00FF]" },
            { label: "Healthy",      value: `${healthyCount}/6`,          icon: Building2,    color: "text-[#00FF88]" },
            { label: "Critical",     value: criticalCount.toString(),      icon: AlertCircle,  color: "text-[#FF4444]" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${stat.color}`} />
                <div>
                  <p className={`text-lg font-bold font-mono ${stat.color}`}>{loading ? "—" : stat.value}</p>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-sm bg-[#FF4444]/10 border border-[#FF4444]/30 text-[#FF4444] text-sm font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Failed to load KPI data: {error}</span>
            <button onClick={fetchKpis} className="ml-auto underline underline-offset-2 hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* KPI Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BusinessKpiCardSkeleton key={i} />)
            : businesses.map(biz => (
              <BusinessKpiCard
                key={biz.id}
                data={biz}
                onDrillDown={id => router.push(`/staff/dashboard/${id}`)}
              />
            ))
          }
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/20 text-center pb-4 font-mono">
          MRR data is indicative. Connect Stripe restricted keys per business to activate live revenue tracking.
        </p>
      </div>
    </div>
  );
}
