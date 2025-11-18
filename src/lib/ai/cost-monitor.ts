/**
 * AI Cost Monitoring & Budget Enforcement System
 * Tracks usage, enforces budgets, sends alerts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BudgetStatus {
  period: "daily" | "monthly";
  limit_usd: number;
  spent_usd: number;
  remaining_usd: number;
  percentage_used: number;
  threshold_pct: number;
  at_threshold: boolean;
  budget_exceeded: boolean;
  enforce_limit: boolean;
}

export interface UsageLog {
  workspace_id: string;
  user_id?: string;
  provider: "openrouter" | "anthropic_direct" | "google_direct" | "openai_direct";
  model_id: string;
  task_type?: string;
  tokens_input: number;
  tokens_output: number;
  tokens_thinking?: number;
  tokens_cached?: number;
  cost_usd: number;
  latency_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface CostBreakdown {
  provider: string;
  task_type: string;
  request_count: number;
  total_cost_usd: number;
  avg_cost_usd: number;
  total_tokens: number;
}

/**
 * Log AI usage to database
 */
export async function logAIUsage(log: UsageLog): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("log_ai_usage", {
      p_workspace_id: log.workspace_id,
      p_user_id: log.user_id || null,
      p_provider: log.provider,
      p_model_id: log.model_id,
      p_task_type: log.task_type || null,
      p_tokens_input: log.tokens_input,
      p_tokens_output: log.tokens_output,
      p_cost_usd: log.cost_usd,
      p_latency_ms: log.latency_ms || null,
      p_success: log.success !== false,
      p_error_message: log.error_message || null,
    });

    if (error) {
      console.error("Error logging AI usage:", error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error("Failed to log AI usage:", error);
    return null;
  }
}

/**
 * Check if budget is exceeded (daily or monthly)
 */
export async function checkBudget(
  workspaceId: string,
  period: "daily" | "monthly" = "daily"
): Promise<BudgetStatus | null> {
  try {
    const { data, error } = await supabase.rpc("check_ai_budget", {
      p_workspace_id: workspaceId,
      p_period: period,
    });

    if (error) {
      console.error("Error checking budget:", error);
      return null;
    }

    return data as BudgetStatus;
  } catch (error) {
    console.error("Failed to check budget:", error);
    return null;
  }
}

/**
 * Check if request should be allowed (budget check)
 * Throws error if budget exceeded and enforcement is enabled
 */
export async function enforceAIBudget(
  workspaceId: string
): Promise<{ allowed: boolean; status: BudgetStatus }> {
  const dailyStatus = await checkBudget(workspaceId, "daily");

  if (!dailyStatus) {
    // If we can't check budget, allow the request (fail open)
    console.warn("⚠️  Could not check budget, allowing request");
    return {
      allowed: true,
      status: {
        period: "daily",
        limit_usd: 50,
        spent_usd: 0,
        remaining_usd: 50,
        percentage_used: 0,
        threshold_pct: 80,
        at_threshold: false,
        budget_exceeded: false,
        enforce_limit: false,
      },
    };
  }

  // Check if budget exceeded and enforcement enabled
  if (dailyStatus.budget_exceeded && dailyStatus.enforce_limit) {
    throw new Error(
      `Daily AI budget exceeded: $${dailyStatus.spent_usd.toFixed(2)} / $${dailyStatus.limit_usd.toFixed(2)}. ` +
        `Requests blocked until tomorrow.`
    );
  }

  // Check if at threshold (send warning)
  if (dailyStatus.at_threshold && !dailyStatus.budget_exceeded) {
    console.warn(
      `⚠️  AI budget at ${dailyStatus.percentage_used.toFixed(1)}% ` +
        `($${dailyStatus.spent_usd.toFixed(2)} / $${dailyStatus.limit_usd.toFixed(2)})`
    );

    // TODO: Send alert email/notification to workspace admin
  }

  return {
    allowed: true,
    status: dailyStatus,
  };
}

/**
 * Get cost breakdown by provider and task type
 */
export async function getCostBreakdown(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CostBreakdown[]> {
  try {
    const { data, error } = await supabase.rpc("get_ai_cost_breakdown", {
      p_workspace_id: workspaceId,
      p_start_date: startDate?.toISOString().split("T")[0] || null,
      p_end_date: endDate?.toISOString().split("T")[0] || null,
    });

    if (error) {
      console.error("Error getting cost breakdown:", error);
      return [];
    }

    return data as CostBreakdown[];
  } catch (error) {
    console.error("Failed to get cost breakdown:", error);
    return [];
  }
}

/**
 * Get daily AI usage summary
 */
export async function getDailySummary(
  workspaceId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("ai_daily_summary")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      console.error("Error getting daily summary:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to get daily summary:", error);
    return [];
  }
}

/**
 * Get budget limits for workspace
 */
export async function getBudgetLimits(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from("ai_budget_limits")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error getting budget limits:", error);
      return null;
    }

    return data || {
      daily_limit_usd: 50.0,
      monthly_limit_usd: 1500.0,
      alert_threshold_pct: 80,
      enforce_daily: true,
      enforce_monthly: true,
    };
  } catch (error) {
    console.error("Failed to get budget limits:", error);
    return null;
  }
}

/**
 * Update budget limits for workspace (admin only)
 */
export async function updateBudgetLimits(
  workspaceId: string,
  limits: {
    daily_limit_usd?: number;
    monthly_limit_usd?: number;
    alert_threshold_pct?: number;
    enforce_daily?: boolean;
    enforce_monthly?: boolean;
    notify_email?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from("ai_budget_limits")
      .upsert(
        {
          workspace_id: workspaceId,
          ...limits,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating budget limits:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to update budget limits:", error);
    return null;
  }
}

/**
 * Calculate cost savings from OpenRouter vs direct APIs
 */
export function calculateSavings(breakdown: CostBreakdown[]): {
  total_cost: number;
  openrouter_cost: number;
  direct_api_cost: number;
  estimated_savings: number;
  savings_percentage: number;
} {
  const openrouterCost = breakdown
    .filter((b) => b.provider === "openrouter")
    .reduce((sum, b) => sum + parseFloat(b.total_cost_usd.toString()), 0);

  const directApiCost = breakdown
    .filter((b) => b.provider !== "openrouter")
    .reduce((sum, b) => sum + parseFloat(b.total_cost_usd.toString()), 0);

  const totalCost = openrouterCost + directApiCost;

  // Estimate savings: if all openrouter requests were direct API (3x more expensive)
  const estimatedDirectCost = openrouterCost * 3;
  const estimatedSavings = estimatedDirectCost - openrouterCost;

  return {
    total_cost: totalCost,
    openrouter_cost: openrouterCost,
    direct_api_cost: directApiCost,
    estimated_savings: estimatedSavings,
    savings_percentage: totalCost > 0 ? (estimatedSavings / (totalCost + estimatedSavings)) * 100 : 0,
  };
}

/**
 * Send budget alert (email/notification)
 * TODO: Implement email sending logic
 */
export async function sendBudgetAlert(
  workspaceId: string,
  status: BudgetStatus,
  type: "threshold" | "limit"
) {
  const budgetLimits = await getBudgetLimits(workspaceId);

  if (!budgetLimits?.notify_email) {
    console.warn("No notification email configured for budget alerts");
    return;
  }

  const subject =
    type === "threshold"
      ? `AI Budget Warning: ${status.percentage_used.toFixed(1)}% Used`
      : `AI Budget Limit Exceeded: $${status.spent_usd.toFixed(2)}`;

  const message =
    type === "threshold"
      ? `Your workspace has used ${status.percentage_used.toFixed(1)}% of the ${status.period} AI budget.\n\n` +
        `Spent: $${status.spent_usd.toFixed(2)} / $${status.limit_usd.toFixed(2)}\n` +
        `Remaining: $${status.remaining_usd.toFixed(2)}`
      : `Your workspace has exceeded the ${status.period} AI budget.\n\n` +
        `Spent: $${status.spent_usd.toFixed(2)} (Limit: $${status.limit_usd.toFixed(2)})\n` +
        `AI requests will be blocked until ${status.period === "daily" ? "tomorrow" : "next month"}.`;

  console.log(`📧 Budget Alert:\n${subject}\n${message}`);

  // TODO: Implement actual email sending via SendGrid/Resend
  // await sendEmail({
  //   to: budgetLimits.notify_email,
  //   subject,
  //   text: message,
  // });
}

/**
 * Dashboard widget data
 */
export async function getAICostDashboard(workspaceId: string) {
  const [dailyStatus, monthlyStatus, breakdown, dailySummary] = await Promise.all([
    checkBudget(workspaceId, "daily"),
    checkBudget(workspaceId, "monthly"),
    getCostBreakdown(workspaceId),
    getDailySummary(workspaceId, 7),
  ]);

  const savings = calculateSavings(breakdown);

  return {
    today: dailyStatus
      ? {
          total_cost: `$${dailyStatus.spent_usd.toFixed(2)}`,
          budget_remaining: `$${dailyStatus.remaining_usd.toFixed(2)} / $${dailyStatus.limit_usd.toFixed(2)}`,
          percentage_used: dailyStatus.percentage_used,
          at_risk: dailyStatus.at_threshold,
        }
      : null,
    this_month: monthlyStatus
      ? {
          total_cost: `$${monthlyStatus.spent_usd.toFixed(2)}`,
          budget_remaining: `$${monthlyStatus.remaining_usd.toFixed(2)} / $${monthlyStatus.limit_usd.toFixed(2)}`,
          percentage_used: monthlyStatus.percentage_used,
        }
      : null,
    breakdown: breakdown.slice(0, 5), // Top 5 consumers
    savings: {
      total_saved: `$${savings.estimated_savings.toFixed(2)}`,
      savings_percentage: `${savings.savings_percentage.toFixed(1)}%`,
      openrouter_usage: `${((savings.openrouter_cost / savings.total_cost) * 100).toFixed(1)}%`,
    },
    weekly_trend: dailySummary,
  };
}
