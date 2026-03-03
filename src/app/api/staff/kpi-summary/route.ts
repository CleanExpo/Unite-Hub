import { NextResponse } from "next/server";
import type { BusinessKpiData } from "@/components/dashboard/BusinessKpiCard";
import { getStripeKeyForBusiness, fetchStripeMrr } from "@/lib/stripe-mrr";

/**
 * GET /api/staff/kpi-summary
 * Returns KPI data for all 6 Unite Group businesses.
 * UNI-873: Overlays live Stripe MRR when STRIPE_KEY_<BUSINESS> env vars are set.
 *
 * To enable live Stripe data per business, add to .env.local:
 *   STRIPE_KEY_DISASTER_RECOVERY=rk_live_xxx
 *   STRIPE_KEY_RESTORE_ASSIST=rk_live_xxx
 *   STRIPE_KEY_ATO=rk_live_xxx
 *   STRIPE_KEY_SYNTHEX=rk_live_xxx
 *   STRIPE_KEY_CCW_ERP=rk_live_xxx
 *   STRIPE_KEY_UNITE_HUB=rk_live_xxx
 * Use Stripe restricted keys with read-only access to subscriptions + invoices.
 */
export async function GET() {
  // Generate a fake 30-day sparkline with a trend
  const makeSpark = (base: number, trend: "up" | "down" | "flat"): number[] => {
    return Array.from({ length: 30 }, (_, i) => {
      const noise = (Math.random() - 0.5) * base * 0.08;
      const drift = trend === "up" ? i * base * 0.01 : trend === "down" ? -i * base * 0.008 : 0;
      return Math.max(0, Math.round(base + drift + noise));
    });
  };

  const businesses: BusinessKpiData[] = [
    {
      id: "disaster-recovery",
      name: "Disaster Recovery",
      code: "DR",
      emoji: "🏗️",
      url: "https://disasterrecovery.com.au",
      status: "healthy",
      mrr: 4800,
      mrrChange: 12,
      activeUsers: 143,
      topMetric: { label: "Claims Lodged (30d)", value: 28 },
      sparkline: makeSpark(4800, "up"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "restore-assist",
      name: "RestoreAssist",
      code: "RA",
      emoji: "🔧",
      url: "https://restoreassist.com.au",
      status: "warning",
      mrr: 1200,
      mrrChange: 0,
      activeUsers: 34,
      topMetric: { label: "Reports Generated (30d)", value: 7 },
      sparkline: makeSpark(1200, "flat"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ato",
      name: "ATO Compliance",
      code: "ATO",
      emoji: "📊",
      url: "https://atocompliance.com.au",
      status: "building",
      mrr: 0,
      mrrChange: 0,
      activeUsers: 12,
      topMetric: { label: "Audits Run (30d)", value: 3 },
      sparkline: makeSpark(0, "flat"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "synthex",
      name: "Synthex",
      code: "SX",
      emoji: "📢",
      url: "https://synthex.com.au",
      status: "healthy",
      mrr: 2300,
      mrrChange: 8,
      activeUsers: 89,
      topMetric: { label: "Posts Published (30d)", value: 214 },
      sparkline: makeSpark(2300, "up"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ccw-erp",
      name: "CCW-ERP/CRM",
      code: "CCW",
      emoji: "🏪",
      url: undefined,
      status: "critical",
      mrr: 900,
      mrrChange: -15,
      activeUsers: 8,
      topMetric: { label: "Orders (30d)", value: 11 },
      sparkline: makeSpark(900, "down"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "unite-hub",
      name: "Unite-Hub",
      code: "UH",
      emoji: "🌐",
      url: "https://unitehub.ai",
      status: "warning",
      mrr: 3100,
      mrrChange: 5,
      activeUsers: 267,
      topMetric: { label: "MAU", value: 267 },
      sparkline: makeSpark(3100, "up"),
      updatedAt: new Date().toISOString(),
    },
  ];

  // UNI-873: Overlay live Stripe MRR for any business with a configured key
  // Run in parallel to avoid sequential delays
  const enriched = await Promise.all(
    businesses.map(async (biz) => {
      const stripeKey = getStripeKeyForBusiness(biz.id);
      if (!stripeKey) return biz;
      const live = await fetchStripeMrr(stripeKey);
      if (!live) return biz;
      return {
        ...biz,
        mrr: live.mrr,
        mrrChange: live.mrrChange,
        sparkline: live.sparkline,
        _stripeConnected: true,
      };
    })
  );

  return NextResponse.json({ businesses: enriched, generatedAt: new Date().toISOString() });
}
