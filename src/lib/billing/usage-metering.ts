/**
 * Usage Metering Service
 * Phase 31: Stripe Live Billing Activation
 *
 * Tracks AI tokens and audit usage for billing
 */

import { getSupabaseServer } from "@/lib/supabase";
import { PRICING_PLANS, calculateOverage } from "./pricing-config";

export type UsageType = "ai_tokens" | "audits";

interface UsageRecord {
  userId: string;
  workspaceId: string;
  usageType: UsageType;
  quantity: number;
  metadata?: Record<string, unknown>;
}

interface UsageSummary {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  overage: number;
  overageCost: number;
}

/**
 * Record usage for a user
 */
export async function recordUsage(record: UsageRecord): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from("usage_records").insert({
    user_id: record.userId,
    workspace_id: record.workspaceId,
    usage_type: record.usageType,
    quantity: record.quantity,
    metadata: record.metadata || {},
    created_at: new Date().toISOString(),
  });
}

/**
 * Record AI token usage
 */
export async function recordTokenUsage(
  userId: string,
  workspaceId: string,
  tokens: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await recordUsage({
    userId,
    workspaceId,
    usageType: "ai_tokens",
    quantity: tokens,
    metadata: {
      ...metadata,
      recorded_at: new Date().toISOString(),
    },
  });
}

/**
 * Record audit usage
 */
export async function recordAuditUsage(
  userId: string,
  workspaceId: string,
  auditType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await recordUsage({
    userId,
    workspaceId,
    usageType: "audits",
    quantity: 1,
    metadata: {
      audit_type: auditType,
      ...metadata,
      recorded_at: new Date().toISOString(),
    },
  });
}

/**
 * Get usage summary for current billing period
 */
export async function getUsageSummary(
  userId: string,
  workspaceId: string,
  usageType: UsageType
): Promise<UsageSummary> {
  const supabase = await getSupabaseServer();

  // Get user's subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("price_id, current_period_start, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return {
      used: 0,
      limit: 0,
      remaining: 0,
      percentage: 0,
      overage: 0,
      overageCost: 0,
    };
  }

  // Get plan from price ID
  const planId = getPlanFromPriceId(subscription.price_id);
  const plan = PRICING_PLANS[planId];

  if (!plan) {
    return {
      used: 0,
      limit: 0,
      remaining: 0,
      percentage: 0,
      overage: 0,
      overageCost: 0,
    };
  }

  // Get usage for current period
  const { data: usageRecords } = await supabase
    .from("usage_records")
    .select("quantity")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("usage_type", usageType)
    .gte("created_at", subscription.current_period_start)
    .lte("created_at", subscription.current_period_end);

  const used = usageRecords?.reduce((sum, r) => sum + r.quantity, 0) || 0;
  const limit =
    usageType === "ai_tokens" ? plan.limits.aiTokens : plan.limits.audits;
  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const overage = Math.max(0, used - limit);

  // Calculate overage cost
  let overageCost = 0;
  if (overage > 0) {
    const overageType =
      usageType === "ai_tokens" ? "aiTokensPer1000" : "audit";
    if (usageType === "ai_tokens") {
      overageCost = calculateOverage(planId, overageType, overage / 1000);
    } else {
      overageCost = calculateOverage(planId, overageType, overage);
    }
  }

  return {
    used,
    limit,
    remaining,
    percentage,
    overage,
    overageCost,
  };
}

/**
 * Get all usage summaries for a user
 */
export async function getAllUsageSummaries(
  userId: string,
  workspaceId: string
): Promise<{
  aiTokens: UsageSummary;
  audits: UsageSummary;
}> {
  const [aiTokens, audits] = await Promise.all([
    getUsageSummary(userId, workspaceId, "ai_tokens"),
    getUsageSummary(userId, workspaceId, "audits"),
  ]);

  return { aiTokens, audits };
}

/**
 * Check if user has exceeded their limit
 */
export async function hasExceededLimit(
  userId: string,
  workspaceId: string,
  usageType: UsageType
): Promise<boolean> {
  const summary = await getUsageSummary(userId, workspaceId, usageType);
  return summary.remaining === 0;
}

/**
 * Check if user can perform action based on usage
 */
export async function canPerformAction(
  userId: string,
  workspaceId: string,
  usageType: UsageType,
  quantity: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  summary: UsageSummary;
}> {
  const summary = await getUsageSummary(userId, workspaceId, usageType);

  // Check if within limit
  if (summary.remaining >= quantity) {
    return {
      allowed: true,
      summary,
    };
  }

  // Check if overage is allowed (plan has overage pricing)
  const supabase = await getSupabaseServer();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("price_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return {
      allowed: false,
      reason: "No active subscription",
      summary,
    };
  }

  const planId = getPlanFromPriceId(subscription.price_id);
  const plan = PRICING_PLANS[planId];

  if (!plan) {
    return {
      allowed: false,
      reason: "Invalid plan",
      summary,
    };
  }

  // If plan has overage pricing, allow with overage charges
  const hasOveragePricing =
    usageType === "ai_tokens"
      ? plan.overages.aiTokensPer1000 > 0
      : plan.overages.audit > 0;

  if (hasOveragePricing) {
    return {
      allowed: true,
      reason: "Overage charges will apply",
      summary,
    };
  }

  return {
    allowed: false,
    reason: `${usageType === "ai_tokens" ? "AI token" : "Audit"} limit exceeded`,
    summary,
  };
}

/**
 * Get plan ID from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  // Check for plan ID in price ID
  if (priceId.includes("starter")) return "starter";
  if (priceId.includes("pro")) return "pro";
  if (priceId.includes("elite")) return "elite";

  // Check environment variables
  if (
    priceId === process.env.STRIPE_TEST_PRICE_STARTER ||
    priceId === process.env.STRIPE_LIVE_PRICE_STARTER
  ) {
    return "starter";
  }
  if (
    priceId === process.env.STRIPE_TEST_PRICE_PRO ||
    priceId === process.env.STRIPE_LIVE_PRICE_PRO
  ) {
    return "pro";
  }
  if (
    priceId === process.env.STRIPE_TEST_PRICE_ELITE ||
    priceId === process.env.STRIPE_LIVE_PRICE_ELITE
  ) {
    return "elite";
  }

  // Default to starter
  return "starter";
}

/**
 * Get usage history for a period
 */
export async function getUsageHistory(
  userId: string,
  workspaceId: string,
  startDate: string,
  endDate: string
): Promise<{
  aiTokens: Array<{ date: string; quantity: number }>;
  audits: Array<{ date: string; quantity: number }>;
}> {
  const supabase = await getSupabaseServer();

  const { data: records } = await supabase
    .from("usage_records")
    .select("usage_type, quantity, created_at")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: true });

  const aiTokens: Array<{ date: string; quantity: number }> = [];
  const audits: Array<{ date: string; quantity: number }> = [];

  records?.forEach((record) => {
    const date = record.created_at.split("T")[0];
    if (record.usage_type === "ai_tokens") {
      const existing = aiTokens.find((r) => r.date === date);
      if (existing) {
        existing.quantity += record.quantity;
      } else {
        aiTokens.push({ date, quantity: record.quantity });
      }
    } else {
      const existing = audits.find((r) => r.date === date);
      if (existing) {
        existing.quantity += record.quantity;
      } else {
        audits.push({ date, quantity: record.quantity });
      }
    }
  });

  return { aiTokens, audits };
}
