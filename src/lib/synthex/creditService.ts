/**
 * Synthex Credit Service
 * Phase D12: Global Rate Limit + Credit System
 *
 * Usage tracking, credit management, rate limiting,
 * and billing integration for AI operations.
 */

import { supabaseAdmin } from "@/lib/supabase";

// =====================================================
// Types
// =====================================================

export interface CreditAccount {
  id: string;
  tenant_id: string;
  credit_balance: number;
  lifetime_credits: number;
  lifetime_used: number;
  plan_type: "free" | "starter" | "professional" | "enterprise" | "unlimited";
  monthly_credit_limit: number;
  daily_credit_limit?: number;
  credits_reset_at?: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  concurrent_requests: number;
  max_brands: number;
  max_templates: number;
  max_personas: number;
  max_tone_profiles: number;
  max_team_members: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  billing_email?: string;
  billing_status: "active" | "past_due" | "canceled" | "paused";
  low_credit_threshold: number;
  low_credit_notified_at?: string;
  exhausted_notified_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  tenant_id: string;
  account_id: string;
  transaction_type: "purchase" | "allocation" | "usage" | "refund" | "adjustment" | "monthly_reset" | "bonus" | "expiry" | "transfer";
  amount: number;
  balance_after: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  unit_cost?: number;
  total_cost?: number;
  stripe_payment_id?: string;
  stripe_invoice_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

export interface UsageRecord {
  id: string;
  tenant_id: string;
  operation_type: string;
  operation_id?: string;
  feature: string;
  credits_used: number;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
  processing_time_ms?: number;
  ai_model?: string;
  ai_provider: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
  endpoint?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  error_message?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  price_per_credit?: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
  is_active: boolean;
  is_featured: boolean;
  is_subscription: boolean;
  min_quantity: number;
  max_quantity?: number;
  bonus_credits: number;
  bonus_percentage?: number;
  display_order: number;
  badge_text?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlanDefinition {
  id: string;
  plan_type: string;
  name: string;
  description?: string;
  monthly_price: number;
  annual_price?: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
  monthly_credits: number;
  credit_rollover: boolean;
  max_rollover_credits?: number;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  concurrent_requests: number;
  max_brands: number;
  max_templates: number;
  max_personas: number;
  max_tone_profiles: number;
  max_team_members: number;
  max_api_keys: number;
  features: Array<{ name: string; included: boolean }>;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset_at?: string;
  retry_after?: number;
  error?: string;
}

export interface UsageSummary {
  total_credits_used: number;
  total_tokens: number;
  total_requests: number;
  by_feature: Record<string, { credits: number; requests: number; tokens: number }>;
  by_day: Array<{ date: string; credits: number; requests: number }>;
}

// =====================================================
// Credit Account Operations
// =====================================================

/**
 * Get or create credit account for a tenant
 */
export async function getOrCreateAccount(tenantId: string): Promise<CreditAccount> {
  const { data: existing } = await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (existing) {
    return existing;
  }

  // Get default plan
  const { data: defaultPlan } = await supabaseAdmin
    .from("synthex_library_plan_definitions")
    .select("*")
    .eq("is_default", true)
    .single();

  const { data: account, error } = await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .insert({
      tenant_id: tenantId,
      credit_balance: defaultPlan?.monthly_credits || 50,
      lifetime_credits: defaultPlan?.monthly_credits || 50,
      plan_type: "free",
      monthly_credit_limit: defaultPlan?.monthly_credits || 50,
      requests_per_minute: defaultPlan?.requests_per_minute || 5,
      requests_per_hour: defaultPlan?.requests_per_hour || 50,
      requests_per_day: defaultPlan?.requests_per_day || 500,
      concurrent_requests: defaultPlan?.concurrent_requests || 3,
      max_brands: defaultPlan?.max_brands || 1,
      max_templates: defaultPlan?.max_templates || 5,
      max_personas: defaultPlan?.max_personas || 2,
      max_tone_profiles: defaultPlan?.max_tone_profiles || 2,
      max_team_members: defaultPlan?.max_team_members || 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create credit account: ${error.message}`);
  }

  // Record initial allocation
  await supabaseAdmin.from("synthex_library_credit_transactions").insert({
    tenant_id: tenantId,
    account_id: account.id,
    transaction_type: "allocation",
    amount: account.credit_balance,
    balance_after: account.credit_balance,
    description: "Initial free plan allocation",
  });

  return account;
}

/**
 * Get credit account for a tenant
 */
export async function getAccount(tenantId: string): Promise<CreditAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get credit account: ${error.message}`);
  }

  return data;
}

/**
 * Update credit account
 */
export async function updateAccount(
  tenantId: string,
  updates: Partial<CreditAccount>
): Promise<CreditAccount> {
  const { id, tenant_id, created_at, ...updateData } = updates as CreditAccount;

  const { data: account, error } = await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update credit account: ${error.message}`);
  }

  return account;
}

// =====================================================
// Credit Operations
// =====================================================

/**
 * Check if tenant has enough credits
 */
export async function hasCredits(tenantId: string, required: number): Promise<boolean> {
  const account = await getAccount(tenantId);
  if (!account) {
return false;
}
  return account.credit_balance >= required;
}

/**
 * Deduct credits for an operation
 */
export async function deductCredits(
  tenantId: string,
  credits: number,
  operationType: string,
  referenceId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const { data, error } = await supabaseAdmin.rpc("check_and_deduct_credits", {
    p_tenant_id: tenantId,
    p_credits: credits,
    p_operation_type: operationType,
    p_reference_id: referenceId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: data.success,
    balance: data.balance_after,
    error: data.error,
  };
}

/**
 * Add credits to account
 */
export async function addCredits(
  tenantId: string,
  credits: number,
  transactionType: "purchase" | "allocation" | "refund" | "bonus" | "monthly_reset",
  description?: string,
  stripePaymentId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const { data, error } = await supabaseAdmin.rpc("add_credits", {
    p_tenant_id: tenantId,
    p_credits: credits,
    p_transaction_type: transactionType,
    p_description: description,
    p_stripe_payment_id: stripePaymentId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: data.success,
    balance: data.balance_after,
  };
}

/**
 * Refund credits for a failed operation
 */
export async function refundCredits(
  tenantId: string,
  credits: number,
  operationId: string,
  reason?: string
): Promise<void> {
  await addCredits(tenantId, credits, "refund", reason || `Refund for operation ${operationId}`);

  // Mark usage record as refunded
  await supabaseAdmin
    .from("synthex_library_usage_records")
    .update({ status: "refunded" })
    .eq("operation_id", operationId);
}

// =====================================================
// Rate Limiting
// =====================================================

/**
 * Check rate limit for a tenant
 */
export async function checkRateLimit(
  tenantId: string,
  windowType: "minute" | "hour" | "day" = "minute"
): Promise<RateLimitCheck> {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_tenant_id: tenantId,
    p_window_type: windowType,
  });

  if (error) {
    return { allowed: false, remaining: 0, limit: 0, error: error.message };
  }

  return data;
}

/**
 * Check all rate limits and return the most restrictive
 */
export async function checkAllRateLimits(tenantId: string): Promise<{
  allowed: boolean;
  limits: Record<string, RateLimitCheck>;
}> {
  const [minute, hour, day] = await Promise.all([
    checkRateLimit(tenantId, "minute"),
    checkRateLimit(tenantId, "hour"),
    checkRateLimit(tenantId, "day"),
  ]);

  return {
    allowed: minute.allowed && hour.allowed && day.allowed,
    limits: { minute, hour, day },
  };
}

// =====================================================
// Usage Tracking
// =====================================================

/**
 * Record usage for an operation
 */
export async function recordUsage(
  tenantId: string,
  data: {
    operation_type: string;
    operation_id?: string;
    feature: string;
    credits_used?: number;
    tokens_input?: number;
    tokens_output?: number;
    processing_time_ms?: number;
    ai_model?: string;
    endpoint?: string;
    user_id?: string;
    status?: "pending" | "completed" | "failed";
    error_message?: string;
  }
): Promise<UsageRecord> {
  const { data: record, error } = await supabaseAdmin
    .from("synthex_library_usage_records")
    .insert({
      tenant_id: tenantId,
      operation_type: data.operation_type,
      operation_id: data.operation_id,
      feature: data.feature,
      credits_used: data.credits_used || 1,
      tokens_input: data.tokens_input,
      tokens_output: data.tokens_output,
      tokens_total: (data.tokens_input || 0) + (data.tokens_output || 0),
      processing_time_ms: data.processing_time_ms,
      ai_model: data.ai_model,
      ai_provider: "anthropic",
      endpoint: data.endpoint,
      user_id: data.user_id,
      status: data.status || "completed",
      error_message: data.error_message,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record usage: ${error.message}`);
  }

  return record;
}

/**
 * Get usage summary for a tenant
 */
export async function getUsageSummary(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary> {
  const start = startDate || new Date(new Date().setDate(1)); // First of month
  const end = endDate || new Date();

  const { data, error } = await supabaseAdmin.rpc("get_usage_summary", {
    p_tenant_id: tenantId,
    p_start_date: start.toISOString(),
    p_end_date: end.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to get usage summary: ${error.message}`);
  }

  return data || {
    total_credits_used: 0,
    total_tokens: 0,
    total_requests: 0,
    by_feature: {},
    by_day: [],
  };
}

/**
 * Get recent usage records
 */
export async function getUsageHistory(
  tenantId: string,
  filters?: { feature?: string; limit?: number }
): Promise<UsageRecord[]> {
  let query = supabaseAdmin
    .from("synthex_library_usage_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.feature) {
    query = query.eq("feature", filters.feature);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get usage history: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Transaction History
// =====================================================

/**
 * Get credit transaction history
 */
export async function getTransactionHistory(
  tenantId: string,
  filters?: { type?: string; limit?: number }
): Promise<CreditTransaction[]> {
  let query = supabaseAdmin
    .from("synthex_library_credit_transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("transaction_type", filters.type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Packages & Plans
// =====================================================

/**
 * List available credit packages
 */
export async function listPackages(): Promise<CreditPackage[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_credit_packages")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    throw new Error(`Failed to list packages: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a credit package by ID
 */
export async function getPackage(packageId: string): Promise<CreditPackage | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_credit_packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get package: ${error.message}`);
  }

  return data;
}

/**
 * List available plans
 */
export async function listPlans(): Promise<PlanDefinition[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_plan_definitions")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a plan by type
 */
export async function getPlan(planType: string): Promise<PlanDefinition | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_plan_definitions")
    .select("*")
    .eq("plan_type", planType)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get plan: ${error.message}`);
  }

  return data;
}

/**
 * Upgrade account to a new plan
 */
export async function upgradePlan(
  tenantId: string,
  newPlanType: string,
  stripeSubscriptionId?: string
): Promise<CreditAccount> {
  const plan = await getPlan(newPlanType);
  if (!plan) {
    throw new Error("Plan not found");
  }

  const account = await getOrCreateAccount(tenantId);

  const { data: updated, error } = await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .update({
      plan_type: newPlanType,
      monthly_credit_limit: plan.monthly_credits,
      requests_per_minute: plan.requests_per_minute,
      requests_per_hour: plan.requests_per_hour,
      requests_per_day: plan.requests_per_day,
      concurrent_requests: plan.concurrent_requests,
      max_brands: plan.max_brands,
      max_templates: plan.max_templates,
      max_personas: plan.max_personas,
      max_tone_profiles: plan.max_tone_profiles,
      max_team_members: plan.max_team_members,
      stripe_subscription_id: stripeSubscriptionId,
      billing_status: "active",
    })
    .eq("id", account.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upgrade plan: ${error.message}`);
  }

  // Add monthly credits
  await addCredits(
    tenantId,
    plan.monthly_credits,
    "allocation",
    `Plan upgrade to ${plan.name}`
  );

  return updated;
}

// =====================================================
// Feature Limit Checks
// =====================================================

/**
 * Check if tenant can create more of a resource
 */
export async function checkFeatureLimit(
  tenantId: string,
  feature: "brands" | "templates" | "personas" | "tone_profiles" | "team_members",
  currentCount: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const account = await getOrCreateAccount(tenantId);

  const limitMap = {
    brands: account.max_brands,
    templates: account.max_templates,
    personas: account.max_personas,
    tone_profiles: account.max_tone_profiles,
    team_members: account.max_team_members,
  };

  const limit = limitMap[feature];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}

// =====================================================
// Billing Helpers
// =====================================================

/**
 * Process a credit purchase from Stripe
 */
export async function processPurchase(
  tenantId: string,
  packageId: string,
  quantity: number,
  stripePaymentId: string
): Promise<{ success: boolean; credits: number; balance: number }> {
  const pkg = await getPackage(packageId);
  if (!pkg) {
    throw new Error("Package not found");
  }

  const totalCredits = (pkg.credits + pkg.bonus_credits) * quantity;

  const result = await addCredits(
    tenantId,
    totalCredits,
    "purchase",
    `Purchased ${quantity}x ${pkg.name}`,
    stripePaymentId
  );

  if (!result.success) {
    throw new Error(result.error || "Purchase failed");
  }

  return {
    success: true,
    credits: totalCredits,
    balance: result.balance || 0,
  };
}

/**
 * Check if tenant needs low credit notification
 */
export async function checkLowCreditNotification(tenantId: string): Promise<{
  shouldNotify: boolean;
  balance: number;
  threshold: number;
}> {
  const account = await getAccount(tenantId);
  if (!account) {
    return { shouldNotify: false, balance: 0, threshold: 0 };
  }

  const shouldNotify =
    account.credit_balance <= account.low_credit_threshold &&
    !account.low_credit_notified_at;

  return {
    shouldNotify,
    balance: account.credit_balance,
    threshold: account.low_credit_threshold,
  };
}

/**
 * Mark low credit notification as sent
 */
export async function markLowCreditNotified(tenantId: string): Promise<void> {
  await supabaseAdmin
    .from("synthex_library_credit_accounts")
    .update({ low_credit_notified_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);
}

// =====================================================
// Middleware Helper
// =====================================================

/**
 * Full pre-operation check: credits + rate limits
 */
export async function preOperationCheck(
  tenantId: string,
  creditsRequired: number
): Promise<{
  allowed: boolean;
  error?: string;
  account?: CreditAccount;
  rateLimits?: Record<string, RateLimitCheck>;
}> {
  // Get or create account
  const account = await getOrCreateAccount(tenantId);

  // Check credits
  if (account.credit_balance < creditsRequired) {
    return {
      allowed: false,
      error: `Insufficient credits. Required: ${creditsRequired}, Available: ${account.credit_balance}`,
      account,
    };
  }

  // Check rate limits
  const { allowed, limits } = await checkAllRateLimits(tenantId);

  if (!allowed) {
    const exceeded = Object.entries(limits).find(([, l]) => !l.allowed);
    return {
      allowed: false,
      error: `Rate limit exceeded for ${exceeded?.[0] || "unknown"} window`,
      account,
      rateLimits: limits,
    };
  }

  return {
    allowed: true,
    account,
    rateLimits: limits,
  };
}
