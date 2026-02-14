"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, TrendingDown, Activity, Search, RefreshCw,
  Building2, Calendar, Shield, Target, Sparkles, Eye,
} from "lucide-react";

interface AISnapshot {
  id: string;
  business_id: string;
  snapshot_type: string;
  summary_markdown: string;
  navboost_risk_score: number | null;
  q_star_proxy_score: number | null;
  eeat_strength_score: number | null;
  sandbox_risk_score: number | null;
  behaviour_signal_opportunity_score: number | null;
  gap_opportunities: Record<string, unknown>;
  created_at: string;
}

interface BusinessInfo {
  business_key: string;
  display_name: string;
  channel_count: number;
  latest_snapshot_date: string | null;
}

interface SnapshotWithBusiness extends AISnapshot {
  business_name: string;
}

export default function InsightsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotWithBusiness[]>([]);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("all");

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch portfolio stats to get business list
      const statsRes = await fetch("/api/founder/business-vault?stats=true");
      if (!statsRes.ok) {
        setLoading(false);
        return;
      }
      const statsData = await statsRes.json();
      const bizList: BusinessInfo[] = statsData.businesses || [];
      setBusinesses(bizList);

      // Fetch all businesses with their snapshots
      const vaultRes = await fetch("/api/founder/business-vault");
      if (!vaultRes.ok) {
        setLoading(false);
        return;
      }
      const vaultData = await vaultRes.json();
      const allBusinesses = vaultData.businesses || [];

      // For each business, fetch its snapshots
      const allSnapshots: SnapshotWithBusiness[] = [];

      for (const biz of allBusinesses) {
        try {
          const snapRes = await fetch(`/api/founder/business-vault/${biz.business_key}/snapshot`);
          if (snapRes.ok) {
            const snapData = await snapRes.json();
            const bizSnapshots = snapData.snapshots || [];
            for (const snap of bizSnapshots) {
              allSnapshots.push({
                ...snap,
                business_name: biz.display_name,
              });
            }
          }
        } catch {
          // Skip businesses with no snapshots
        }
      }

      // Sort by created_at descending
      allSnapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSnapshots(allSnapshots);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Client-side filtering
  const filtered = snapshots.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.summary_markdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.snapshot_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBusiness = selectedBusiness === "all" || s.business_name === selectedBusiness;
    return matchesSearch && matchesBusiness;
  });

  // Compute aggregate scores
  const snapshotsWithEeat = snapshots.filter(s => s.eeat_strength_score !== null);
  const avgEeat = snapshotsWithEeat.length > 0
    ? Math.round(snapshotsWithEeat.reduce((sum, s) => sum + (s.eeat_strength_score || 0), 0) / snapshotsWithEeat.length)
    : 0;
  const snapshotsWithNav = snapshots.filter(s => s.navboost_risk_score !== null);
  const avgNavboost = snapshotsWithNav.length > 0
    ? Math.round(snapshotsWithNav.reduce((sum, s) => sum + (s.navboost_risk_score || 0), 0) / snapshotsWithNav.length)
    : 0;
  const opportunities = snapshots.filter(s => s.behaviour_signal_opportunity_score && s.behaviour_signal_opportunity_score > 50).length;

  const getScoreColor = (score: number | null, inverted = false) => {
    if (score === null) return "text-slate-500";
    if (inverted) {
      if (score <= 30) return "text-emerald-400";
      if (score <= 60) return "text-yellow-400";
      return "text-red-400";
    }
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number | null, inverted = false) => {
    if (score === null) return <Activity className="w-4 h-4 text-slate-500" />;
    const isGood = inverted ? score <= 30 : score >= 70;
    const isBad = inverted ? score > 60 : score < 40;
    if (isGood) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (isBad) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="text-sm text-slate-400 mt-1">
            AI-generated analysis and signals across your business portfolio
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchInsights} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Snapshots", value: snapshots.length, icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Avg E-E-A-T", value: avgEeat || "—", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg NavBoost Risk", value: avgNavboost || "—", icon: Eye, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Opportunities", value: opportunities, icon: Target, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={selectedBusiness}
          onChange={(e) => setSelectedBusiness(e.target.value)}
          className="h-10 px-3 bg-slate-800 border border-slate-700 text-white rounded-md text-sm"
        >
          <option value="all">All Businesses</option>
          {businesses.map((b) => (
            <option key={b.business_key} value={b.display_name}>
              {b.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-800/30 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No insights yet</h3>
            <p className="text-sm text-slate-400">
              {searchQuery || selectedBusiness !== "all"
                ? "Try adjusting your search or filters"
                : "AI insights will appear here as snapshots are generated for your businesses"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((snapshot) => (
            <Card key={snapshot.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-slate-700 rounded-lg flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white capitalize">
                          {snapshot.snapshot_type.replace(/_/g, " ")}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                          {snapshot.snapshot_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap">
                        {snapshot.summary_markdown.substring(0, 300)}
                        {snapshot.summary_markdown.length > 300 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signal Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-700">
                  {[
                    { label: "E-E-A-T", value: snapshot.eeat_strength_score, inverted: false },
                    { label: "NavBoost Risk", value: snapshot.navboost_risk_score, inverted: true },
                    { label: "Q* Proxy", value: snapshot.q_star_proxy_score, inverted: false },
                    { label: "Sandbox Risk", value: snapshot.sandbox_risk_score, inverted: true },
                    { label: "Opportunity", value: snapshot.behaviour_signal_opportunity_score, inverted: false },
                  ].map((signal) => (
                    <div key={signal.label} className="flex items-center gap-2">
                      {getScoreIcon(signal.value, signal.inverted)}
                      <div>
                        <p className="text-[10px] text-slate-500">{signal.label}</p>
                        <p className={`text-sm font-semibold ${getScoreColor(signal.value, signal.inverted)}`}>
                          {signal.value !== null ? signal.value : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-3 pt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {snapshot.business_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(snapshot.created_at).toLocaleDateString("en-AU", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  {Object.keys(snapshot.gap_opportunities || {}).length > 0 && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-purple-400" />
                      {Object.keys(snapshot.gap_opportunities).length} gap{Object.keys(snapshot.gap_opportunities).length !== 1 ? "s" : ""} identified
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
