import { NextResponse } from "next/server";
import type { BusinessKpiData } from "@/components/dashboard/BusinessKpiCard";
import { getStripeKeyForBusiness, fetchStripeMrr } from "@/lib/stripe-mrr";

/**
 * GET /api/staff/kpi-summary/[business]
 * Returns KPI data for a single Unite Group business by ID.
 * UNI-873: Uses live Stripe MRR when STRIPE_KEY_<BUSINESS> env var is set.
 */

const VALID_IDS = new Set([
  "disaster-recovery",
  "restore-assist",
  "ato",
  "unite-group",
  "nrpg",
  "carsi",
]);

// Reuses the same placeholder data from the parent kpi-summary route.
function getBusinesses(): BusinessKpiData[] {
  const makeSpark = (base: number, trend: "up" | "down" | "flat"): number[] =>
    Array.from({ length: 30 }, (_, i) => {
      const noise = (Math.random() - 0.5) * base * 0.08;
      const drift =
        trend === "up" ? i * base * 0.01 : trend === "down" ? -i * base * 0.008 : 0;
      return Math.max(0, Math.round(base + drift + noise));
    });

  return [
    {
      id: "disaster-recovery",
      name: "Disaster Recovery",
      code: "DR",
      emoji: "\u{1F3D7}\uFE0F",
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
      emoji: "\u{1F527}",
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
      emoji: "\u{1F4CA}",
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
      id: "unite-group",
      name: "Unite-Group",
      code: "UG",
      emoji: "\u{1F310}",
      url: "https://unite-group.in",
      status: "warning",
      mrr: 3100,
      mrrChange: 5,
      activeUsers: 267,
      topMetric: { label: "MAU", value: 267 },
      sparkline: makeSpark(3100, "up"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "nrpg",
      name: "NRPG",
      code: "NR",
      emoji: "\u{1F3DA}\uFE0F",
      url: undefined,
      status: "building",
      mrr: 0,
      mrrChange: 0,
      activeUsers: 5,
      topMetric: { label: "Properties (30d)", value: 12 },
      sparkline: makeSpark(0, "flat"),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "carsi",
      name: "CARSI",
      code: "CA",
      emoji: "\u{1F4E6}",
      url: undefined,
      status: "building",
      mrr: 0,
      mrrChange: 0,
      activeUsers: 0,
      topMetric: { label: "Bookings (30d)", value: 0 },
      sparkline: makeSpark(0, "flat"),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ business: string }> }
) {
  const { business } = await params;

  if (!VALID_IDS.has(business)) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const biz = getBusinesses().find((b) => b.id === business);
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // UNI-873: Overlay live Stripe MRR if a restricted key is configured
  const stripeKey = getStripeKeyForBusiness(business);
  if (stripeKey) {
    const liveRevenue = await fetchStripeMrr(stripeKey);
    if (liveRevenue) {
      return NextResponse.json({
        business: {
          ...biz,
          mrr: liveRevenue.mrr,
          mrrChange: liveRevenue.mrrChange,
          sparkline: liveRevenue.sparkline,
          topMetric: biz.id === "unite-group"
            ? { label: "Active Subscriptions", value: liveRevenue.activeSubscriptions }
            : biz.topMetric,
          _stripeConnected: true,
        },
        generatedAt: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ business: biz, generatedAt: new Date().toISOString() });
}
