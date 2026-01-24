/**
 * Cross-Business Analytics API Endpoint
 *
 * Provides unified analytics across all founder businesses.
 *
 * @route GET /api/founder/analytics - Get cross-business analytics
 * @route POST /api/founder/analytics - Trigger analytics refresh
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { getSupabaseServer } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return errorResponse("Unauthorized", 401);
  }
  const { user } = authResult;

  const supabase = getSupabaseServer();

  // Get query params
  const periodType = req.nextUrl.searchParams.get("period") || "monthly";
  const businessId = req.nextUrl.searchParams.get("businessId");

  // Get all founder businesses
  let businessQuery = supabase
    .from("founder_businesses")
    .select("id, code, display_name, industry, status")
    .eq("owner_user_id", user.id)
    .eq("status", "active");

  if (businessId) {
    businessQuery = businessQuery.eq("id", businessId);
  }

  const { data: businesses, error: bizError } = await businessQuery;

  if (bizError) {
    console.error("[Analytics API] Failed to fetch businesses:", bizError);
    return errorResponse("Failed to fetch businesses", 500);
  }

  if (!businesses || businesses.length === 0) {
    return successResponse({
      businesses: [],
      summary: {
        totalRevenue: 0,
        totalCustomers: 0,
        avgGrowth: 0,
        overallHealth: "unknown",
      },
    });
  }

  // Get analytics for each business
  const businessIds = businesses.map((b) => b.id);

  const { data: analytics, error: analyticsError } = await supabase
    .from("founder_business_analytics")
    .select("*")
    .in("business_id", businessIds)
    .eq("period_type", periodType)
    .order("period_start", { ascending: false })
    .limit(businesses.length * 12); // Up to 12 periods per business

  if (analyticsError) {
    console.error("[Analytics API] Failed to fetch analytics:", analyticsError);
    // Continue with empty analytics
  }

  // Get latest signals
  const { data: signals } = await supabase
    .from("founder_business_signals")
    .select("founder_business_id, signal_family, signal_key, value_numeric, observed_at")
    .in("founder_business_id", businessIds)
    .order("observed_at", { ascending: false })
    .limit(100);

  // Group analytics by business
  const analyticsMap = new Map<string, any[]>();
  (analytics || []).forEach((a) => {
    const existing = analyticsMap.get(a.business_id) || [];
    existing.push(a);
    analyticsMap.set(a.business_id, existing);
  });

  // Build response
  const businessAnalytics = businesses.map((biz) => {
    const bizAnalytics = analyticsMap.get(biz.id) || [];
    const latest = bizAnalytics[0];
    const bizSignals = (signals || []).filter(
      (s) => s.founder_business_id === biz.id
    );

    return {
      ...biz,
      latestAnalytics: latest || null,
      recentTrends: bizAnalytics.slice(0, 6).map((a) => ({
        period: a.period_start,
        revenue: a.revenue_total,
        customers: a.customers_total,
        growth: a.revenue_growth_pct,
      })),
      latestSignals: bizSignals.slice(0, 10).reduce((acc, s) => {
        acc[s.signal_key] = s.value_numeric;
        return acc;
      }, {} as Record<string, number>),
    };
  });

  // Calculate summary
  const latestAnalytics = businesses
    .map((b) => analyticsMap.get(b.id)?.[0])
    .filter(Boolean);

  const summary = {
    totalRevenue: latestAnalytics.reduce(
      (sum, a) => sum + (a?.revenue_total || 0),
      0
    ),
    totalCustomers: latestAnalytics.reduce(
      (sum, a) => sum + (a?.customers_total || 0),
      0
    ),
    avgGrowth:
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((sum, a) => sum + (a?.revenue_growth_pct || 0), 0) /
          latestAnalytics.length
        : 0,
    avgRiskScore:
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((sum, a) => sum + (a?.ai_risk_score || 50), 0) /
          latestAnalytics.length
        : 50,
    avgGrowthScore:
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((sum, a) => sum + (a?.ai_growth_score || 50), 0) /
          latestAnalytics.length
        : 50,
    businessCount: businesses.length,
  };

  // Determine overall health
  let overallHealth: "excellent" | "good" | "attention" | "critical" = "good";
  if (summary.avgRiskScore > 70) {
overallHealth = "critical";
} else if (summary.avgRiskScore > 50) {
overallHealth = "attention";
} else if (summary.avgGrowthScore > 70) {
overallHealth = "excellent";
}

  return successResponse({
    businesses: businessAnalytics,
    summary: {
      ...summary,
      overallHealth,
    },
  });
});

export const runtime = "nodejs";
