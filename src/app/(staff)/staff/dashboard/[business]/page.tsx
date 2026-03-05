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
  healthy:  { label: "Healthy",  dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  warning:  { label: "Warning",  dot: "bg-amber-400",   badge: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
  critical: { label: "Critical", dot: "bg-red-400",     badge: "bg-red-500/10    text-red-400    border-red-500/20"    },
  building: { label: "Building", dot: "bg-blue-400",    badge: "bg-blue-500/10   text-blue-400   border-blue-500/20"   },
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-zinc-500 py-2 px-3 rounded-sm bg-zinc-800/50 border border-zinc-800"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-700 flex-shrink-0" />
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-white">Tasks</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="w-4 h-4 animate-spin text-zinc-600" />
          <span className="ml-2 text-sm text-zinc-600">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Tasks</h3>
        {linearCounts.source === "stub" && (
          <span className="text-[10px] text-zinc-600 ml-auto">est.</span>
        )}
      </div>

      <div className="space-y-3">
        {/* Open issues count */}
        <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-zinc-800/50 border border-zinc-800">
          <span className="text-sm text-zinc-400">Open Issues</span>
          {linearCounts.linearUrl ? (
            <a
              href={linearCounts.linearUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {linearCounts.open}
            </a>
          ) : (
            <span className="text-sm font-bold text-cyan-400">
              {linearCounts.open}
            </span>
          )}
        </div>

        {/* In Progress badge */}
        <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-zinc-800/50 border border-zinc-800">
          <span className="text-sm text-zinc-400">In Progress</span>
          <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-sm">
            {linearCounts.inProgress}
          </span>
        </div>

        {/* Urgent badge (only if > 0) */}
        {linearCounts.urgent > 0 && (
          <div className="flex items-center justify-between py-2 px-3 rounded-sm bg-zinc-800/50 border border-zinc-800">
            <span className="text-sm text-zinc-400">Urgent</span>
            <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-sm">
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
            className="flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors py-2 px-3 rounded-sm border border-zinc-800 hover:bg-zinc-800"
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
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => router.push("/staff/dashboard")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
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
  const trendColor = trendFlat ? "text-zinc-400" : trendUp ? "text-emerald-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.push("/staff/dashboard")}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
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
              <h1 className="text-2xl font-bold text-white">{data.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-zinc-500">{data.code}</span>
                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border", status.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
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
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800 border border-zinc-800"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
            <button
              onClick={fetchBusiness}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800 border border-zinc-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">MRR</p>
              {stripeConnected && (
                <span className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                ${data.mrr >= 1000 ? `${(data.mrr / 1000).toFixed(1)}k` : data.mrr.toLocaleString()}
              </span>
              <div className={cn("flex items-center gap-0.5 text-xs", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(data.mrrChange)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-violet-400" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Users</p>
            </div>
            <span className="text-2xl font-bold text-white">
              {data.activeUsers >= 1000 ? `${(data.activeUsers / 1000).toFixed(1)}k` : data.activeUsers.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{data.topMetric.label}</p>
            </div>
            <span className="text-2xl font-bold text-cyan-400">
              {typeof data.topMetric.value === "number"
                ? data.topMetric.value.toLocaleString()
                : data.topMetric.value}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Linear Issues</p>
            </div>
            {linearCounts ? (
              <>
                <div className="flex items-baseline gap-2">
                  {linearCounts.linearUrl ? (
                    <a
                      href={linearCounts.linearUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl font-bold text-white hover:text-amber-300 transition-colors"
                    >
                      {linearCounts.open}
                    </a>
                  ) : (
                    <span className="text-2xl font-bold text-white">{linearCounts.open}</span>
                  )}
                  {linearCounts.urgent > 0 && (
                    <span className="text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                      {linearCounts.urgent} urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-zinc-500">
                    {linearCounts.inProgress} in progress
                    {linearCounts.source === "stub" && " · est."}
                  </p>
                  {linearCounts.linearUrl && (
                    <a
                      href={linearCounts.linearUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
                    >
                      View
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-white">--</span>
                <p className="text-[10px] text-zinc-600 mt-1">Loading…</p>
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
        <p className="text-xs text-zinc-700 text-center pb-4">
          Data is indicative. Connect integrations per business for live data.
        </p>
      </div>
    </div>
  );
}
