"use client";

/**
 * Per-business drill-down page — /staff/dashboard/[business]
 * UNI-889 / UNI-1079 / UNI-1078
 *
 * Shows full CRM view for a single business: KPIs, Linear issues,
 * and placeholder sections for Contacts, Projects, Tasks, Revenue.
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BusinessKpiData } from "@/components/dashboard/BusinessKpiCard";
import type { LinearIssueCounts } from "@/app/api/staff/linear-issues/[business]/route";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Inbox,
  FolderKanban,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status config (mirrors BusinessKpiCard) ─────────────────────────────────

const STATUS_CONFIG = {
  healthy:  { label: "Healthy",  dot: "bg-[#00FF88]", badge: "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20" },
  warning:  { label: "Warning",  dot: "bg-[#FFB800]",  badge: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20"  },
  critical: { label: "Critical", dot: "bg-[#FF4444]",  badge: "bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20"  },
  building: { label: "Building", dot: "bg-[#00F5FF]",  badge: "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/20"  },
};

// ─── Placeholder section ─────────────────────────────────────────────────────

function PlaceholderSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-white/40" />
        <h3 className="text-sm font-semibold text-white font-mono">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-white/40 py-2 px-3 rounded-sm bg-white/[0.02] border border-white/[0.06] font-mono"
          >
            <span className="w-2 h-2 rounded-sm bg-white/[0.06] flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Linear Tasks section (replaces Tasks placeholder) ───────────────────────

function LinearTasksSection({
  linearCounts,
}: {
  linearCounts: LinearIssueCounts | null;
}) {
  if (!linearCounts) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white font-mono">Tasks</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="w-4 h-4 animate-spin text-white/20" />
          <span className="ml-2 text-sm text-white/20 font-mono">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-4 h-4 text-[#00F5FF]" />
        <h3 className="text-sm font-semibold text-white font-mono">Tasks</h3>
        {linearCounts.source === "stub" && (
          <span className="text-[10px] text-white/20 ml-auto font-mono">est.</span>
        )}
      </div>

      <div className="space-y-3">
        {/* Open issues count */}
        <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-white/[0.02] border border-white/[0.06]">
          <span className="text-sm text-white/40 font-mono">Open Issues</span>
          {linearCounts.linearUrl ? (
            <a
              href={linearCounts.linearUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors font-mono"
            >
              {linearCounts.open}
            </a>
          ) : (
            <span className="text-sm font-bold text-[#00F5FF] font-mono">
              {linearCounts.open}
            </span>
          )}
        </div>

        {/* In Progress badge */}
        <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-white/[0.02] border border-white/[0.06]">
          <span className="text-sm text-white/40 font-mono">In Progress</span>
          <span className="text-xs font-medium text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 px-2 py-0.5 rounded-sm font-mono">
            {linearCounts.inProgress}
          </span>
        </div>

        {/* Urgent badge (only if > 0) */}
        {linearCounts.urgent > 0 && (
          <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-white/[0.02] border border-white/[0.06]">
            <span className="text-sm text-white/40 font-mono">Urgent</span>
            <span className="text-xs font-medium text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 px-2 py-0.5 rounded-sm font-mono">
              {linearCounts.urgent}
            </span>
          </div>
        )}

        {/* Open in Linear link */}
        {linearCounts.linearUrl && (
          <a
            href={linearCounts.linearUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors py-2 px-3 rounded-sm border border-white/[0.06] hover:bg-white/[0.03] font-mono"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Linear
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function BusinessDrillDownPage() {
  const router = useRouter();
  const { business } = useParams<{ business: string }>();

  const [data, setData] = useState<BusinessKpiData | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [linearCounts, setLinearCounts] = useState<LinearIssueCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, linearRes] = await Promise.all([
        fetch(`/api/staff/kpi-summary/${business}`),
        fetch(`/api/staff/linear-issues/${business}`),
      ]);
      if (!kpiRes.ok) throw new Error(`HTTP ${kpiRes.status}`);
      const kpiJson = await kpiRes.json();
      setData(kpiJson.business);
      setStripeConnected(!!kpiJson.business?._stripeConnected);
      if (linearRes.ok) {
        setLinearCounts(await linearRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (business) fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  // ─── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => router.push("/staff/dashboard")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors mb-6 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 p-4 rounded-sm bg-[#FF4444]/10 border border-[#FF4444]/30 text-[#FF4444] text-sm font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error || "Business not found"}</span>
            <button onClick={fetchBusiness} className="ml-auto underline underline-offset-2 hover:text-white">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Derived values ──────────────────────────────────────────────────────

  const status = STATUS_CONFIG[data.status];
  const trendUp = data.mrrChange > 0;
  const trendFlat = data.mrrChange === 0;
  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown;
  const trendColor = trendFlat ? "text-white/40" : trendUp ? "text-[#00FF88]" : "text-[#FF4444]";

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.push("/staff/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={data.name}>
              {data.emoji}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{data.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-white/40">{data.code}</span>
                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-sm border font-mono", status.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-sm", status.dot)} />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.06] font-mono"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
            <button
              onClick={fetchBusiness}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors px-3 py-2 rounded-sm bg-white/[0.04] border border-white/[0.06] font-mono"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#00F5FF]" />
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">MRR</p>
              {stripeConnected && (
                <span className="ml-auto text-[9px] bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 px-1.5 py-0.5 rounded-sm font-mono">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">
                ${data.mrr >= 1000 ? `${(data.mrr / 1000).toFixed(1)}k` : data.mrr.toLocaleString()}
              </span>
              <div className={cn("flex items-center gap-0.5 text-xs font-mono", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(data.mrrChange)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#FF00FF]" />
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Active Users</p>
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {data.activeUsers >= 1000 ? `${(data.activeUsers / 1000).toFixed(1)}k` : data.activeUsers.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#00F5FF]" />
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">{data.topMetric.label}</p>
            </div>
            <span className="text-2xl font-bold text-[#00F5FF] font-mono">
              {typeof data.topMetric.value === "number"
                ? data.topMetric.value.toLocaleString()
                : data.topMetric.value}
            </span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-[#FFB800]" />
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Linear Issues</p>
            </div>
            {linearCounts ? (
              <>
                <div className="flex items-baseline gap-2">
                  {linearCounts.linearUrl ? (
                    <a
                      href={linearCounts.linearUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl font-bold text-white hover:text-[#FFB800] transition-colors font-mono"
                    >
                      {linearCounts.open}
                    </a>
                  ) : (
                    <span className="text-2xl font-bold text-white font-mono">{linearCounts.open}</span>
                  )}
                  {linearCounts.urgent > 0 && (
                    <span className="text-[10px] font-medium text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 px-1.5 py-0.5 rounded-sm font-mono">
                      {linearCounts.urgent} urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-white/40 font-mono">
                    {linearCounts.inProgress} in progress
                    {linearCounts.source === "stub" && " · est."}
                  </p>
                  {linearCounts.linearUrl && (
                    <a
                      href={linearCounts.linearUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-white/20 hover:text-white/40 transition-colors underline underline-offset-2 font-mono"
                    >
                      View
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-white font-mono">--</span>
                <p className="text-[10px] text-white/20 mt-1 font-mono">Loading…</p>
              </>
            )}
          </div>
        </div>

        {/* CRM placeholder sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlaceholderSection
            title="Contacts"
            icon={Inbox}
            items={[
              "No contacts linked yet",
              "Import from CRM or add manually",
              "Sync with HubSpot coming soon",
            ]}
          />
          <PlaceholderSection
            title="Projects"
            icon={FolderKanban}
            items={[
              "No projects created yet",
              "Link Linear projects here",
              "Track deliverables & milestones",
            ]}
          />
          <LinearTasksSection linearCounts={linearCounts} />
          <PlaceholderSection
            title="Revenue"
            icon={DollarSign}
            items={
              stripeConnected
                ? [
                    "Stripe connected — live MRR active",
                    "Subscription counts updated in real-time",
                    "Invoice history sync coming soon",
                  ]
                : [
                    `Set STRIPE_KEY_${business.replace(/-/g, "_").toUpperCase()} in .env`,
                    "Use a restricted key: subscriptions + invoices read",
                    "MRR card will show live Stripe data",
                  ]
            }
          />
        </div>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center pb-4 font-mono">
          Data is indicative. Connect integrations per business for live data.
        </p>
      </div>
    </div>
  );
}
