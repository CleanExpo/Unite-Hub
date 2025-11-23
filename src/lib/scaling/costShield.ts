/**
 * Cost Shield Service
 * Phase 58: Protect against runaway API costs during scaling
 */

import { getSupabaseServer } from '@/lib/supabase';

// Provider types
export type AIProvider =
  | 'anthropic_claude'
  | 'google_gemini'
  | 'openai'
  | 'openrouter'
  | 'elevenlabs'
  | 'perplexity';

// Cost tracking
export interface ProviderUsage {
  provider: AIProvider;
  tokens_used: number;
  cost_usd: number;
  requests: number;
  last_reset: string;
}

export interface CostBudget {
  daily_limit_usd: number;
  monthly_limit_usd: number;
  per_client_daily_usd: number;
  alert_threshold_percent: number;
}

export interface CostStatus {
  total_today_usd: number;
  total_month_usd: number;
  by_provider: ProviderUsage[];
  budget: CostBudget;
  throttled: boolean;
  alerts: string[];
}

// Provider cost rates (per 1M tokens or per request)
export const PROVIDER_COSTS: Record<AIProvider, { input: number; output: number; unit: string }> = {
  anthropic_claude: { input: 3, output: 15, unit: 'per_1m_tokens' },
  google_gemini: { input: 1.25, output: 5, unit: 'per_1m_tokens' },
  openai: { input: 10, output: 30, unit: 'per_1m_tokens' },
  openrouter: { input: 0.5, output: 0.5, unit: 'per_1m_tokens' }, // Average, varies by model
  elevenlabs: { input: 0.3, output: 0, unit: 'per_1k_chars' },
  perplexity: { input: 0.005, output: 0.005, unit: 'per_request' },
};

// Default budget configuration
export const DEFAULT_BUDGET: CostBudget = {
  daily_limit_usd: 50,
  monthly_limit_usd: 500,
  per_client_daily_usd: 5,
  alert_threshold_percent: 80,
};

// In-memory usage tracking (would be persisted in production)
const usageTracker: Map<AIProvider, ProviderUsage> = new Map();

/**
 * Initialize usage tracker
 */
export function initializeUsageTracker(): void {
  const providers: AIProvider[] = [
    'anthropic_claude',
    'google_gemini',
    'openai',
    'openrouter',
    'elevenlabs',
    'perplexity',
  ];

  for (const provider of providers) {
    usageTracker.set(provider, {
      provider,
      tokens_used: 0,
      cost_usd: 0,
      requests: 0,
      last_reset: new Date().toISOString(),
    });
  }
}

/**
 * Calculate cost for usage
 */
export function calculateCost(
  provider: AIProvider,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PROVIDER_COSTS[provider];

  if (rates.unit === 'per_1m_tokens') {
    const inputCost = (inputTokens / 1000000) * rates.input;
    const outputCost = (outputTokens / 1000000) * rates.output;
    return inputCost + outputCost;
  } else if (rates.unit === 'per_1k_chars') {
    return (inputTokens / 1000) * rates.input;
  } else if (rates.unit === 'per_request') {
    return rates.input;
  }

  return 0;
}

/**
 * Track API usage
 */
export async function trackUsage(
  provider: AIProvider,
  inputTokens: number,
  outputTokens: number,
  clientId?: string
): Promise<{ allowed: boolean; cost: number; warning?: string }> {
  if (!usageTracker.has(provider)) {
    initializeUsageTracker();
  }

  const cost = calculateCost(provider, inputTokens, outputTokens);
  const usage = usageTracker.get(provider)!;

  // Update tracker
  usage.tokens_used += inputTokens + outputTokens;
  usage.cost_usd += cost;
  usage.requests += 1;

  // Check budgets
  const status = await getCostStatus();
  let warning: string | undefined;

  if (status.total_today_usd >= DEFAULT_BUDGET.daily_limit_usd) {
    await logCostEvent('daily_limit_exceeded', {
      provider,
      cost,
      total: status.total_today_usd,
    });
    return {
      allowed: false,
      cost,
      warning: 'Daily budget limit reached',
    };
  }

  const percentUsed = (status.total_today_usd / DEFAULT_BUDGET.daily_limit_usd) * 100;
  if (percentUsed >= DEFAULT_BUDGET.alert_threshold_percent) {
    warning = `Budget alert: ${percentUsed.toFixed(1)}% of daily limit used`;
  }

  // Log to database
  const supabase = await getSupabaseServer();
  await supabase.from('cost_tracking').insert({
    provider,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
    client_id: clientId,
    created_at: new Date().toISOString(),
  });

  return { allowed: true, cost, warning };
}

/**
 * Get current cost status
 */
export async function getCostStatus(): Promise<CostStatus> {
  const byProvider: ProviderUsage[] = [];
  let totalToday = 0;

  for (const [, usage] of usageTracker) {
    byProvider.push(usage);
    totalToday += usage.cost_usd;
  }

  // Mock monthly total - would come from database aggregation
  const totalMonth = totalToday * 15; // Rough estimate

  const alerts: string[] = [];
  const percentDaily = (totalToday / DEFAULT_BUDGET.daily_limit_usd) * 100;
  const percentMonthly = (totalMonth / DEFAULT_BUDGET.monthly_limit_usd) * 100;

  if (percentDaily >= DEFAULT_BUDGET.alert_threshold_percent) {
    alerts.push(`Daily budget at ${percentDaily.toFixed(1)}%`);
  }

  if (percentMonthly >= DEFAULT_BUDGET.alert_threshold_percent) {
    alerts.push(`Monthly budget at ${percentMonthly.toFixed(1)}%`);
  }

  // Check for high-cost providers
  for (const usage of byProvider) {
    if (usage.cost_usd > DEFAULT_BUDGET.per_client_daily_usd * 2) {
      alerts.push(`High usage on ${usage.provider}: $${usage.cost_usd.toFixed(2)}`);
    }
  }

  return {
    total_today_usd: totalToday,
    total_month_usd: totalMonth,
    by_provider: byProvider,
    budget: DEFAULT_BUDGET,
    throttled: totalToday >= DEFAULT_BUDGET.daily_limit_usd,
    alerts,
  };
}

/**
 * Check if client is within their budget
 */
export async function checkClientBudget(
  clientId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = await getSupabaseServer();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('cost_tracking')
    .select('cost_usd')
    .eq('client_id', clientId)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error checking client budget:', error);
    return { allowed: true, used: 0, limit: DEFAULT_BUDGET.per_client_daily_usd };
  }

  const used = (data || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0);

  return {
    allowed: used < DEFAULT_BUDGET.per_client_daily_usd,
    used,
    limit: DEFAULT_BUDGET.per_client_daily_usd,
  };
}

/**
 * Get cost breakdown by provider
 */
export function getCostBreakdown(): { provider: AIProvider; percent: number; cost: number }[] {
  const status = getCostStatusSync();
  const total = status.total_today_usd || 1;

  return status.by_provider.map((usage) => ({
    provider: usage.provider,
    percent: (usage.cost_usd / total) * 100,
    cost: usage.cost_usd,
  }));
}

/**
 * Synchronous cost status (from memory)
 */
function getCostStatusSync(): CostStatus {
  const byProvider: ProviderUsage[] = [];
  let totalToday = 0;

  for (const [, usage] of usageTracker) {
    byProvider.push(usage);
    totalToday += usage.cost_usd;
  }

  return {
    total_today_usd: totalToday,
    total_month_usd: totalToday * 15,
    by_provider: byProvider,
    budget: DEFAULT_BUDGET,
    throttled: totalToday >= DEFAULT_BUDGET.daily_limit_usd,
    alerts: [],
  };
}

/**
 * Reset daily usage
 */
export function resetDailyUsage(): void {
  for (const [provider, usage] of usageTracker) {
    usageTracker.set(provider, {
      ...usage,
      tokens_used: 0,
      cost_usd: 0,
      requests: 0,
      last_reset: new Date().toISOString(),
    });
  }
}

/**
 * Update budget limits
 */
export function updateBudget(newBudget: Partial<CostBudget>): CostBudget {
  Object.assign(DEFAULT_BUDGET, newBudget);
  return DEFAULT_BUDGET;
}

/**
 * Get cost optimization recommendations
 */
export function getCostOptimizations(): string[] {
  const recommendations: string[] = [];
  const breakdown = getCostBreakdown();

  // Check if Anthropic is dominant
  const anthropicUsage = breakdown.find((b) => b.provider === 'anthropic_claude');
  if (anthropicUsage && anthropicUsage.percent > 50) {
    recommendations.push(
      'Consider routing simple tasks to OpenRouter for 70-80% cost savings'
    );
  }

  // Check if ElevenLabs is high
  const elevenlabsUsage = breakdown.find((b) => b.provider === 'elevenlabs');
  if (elevenlabsUsage && elevenlabsUsage.cost > 10) {
    recommendations.push(
      'Batch voice generation jobs to reduce ElevenLabs API calls'
    );
  }

  // Check if OpenAI is being used heavily
  const openaiUsage = breakdown.find((b) => b.provider === 'openai');
  if (openaiUsage && openaiUsage.percent > 30) {
    recommendations.push(
      'Route vision tasks through Gemini for lower cost multimodal processing'
    );
  }

  // General recommendations
  recommendations.push('Enable prompt caching for repeated system prompts');
  recommendations.push('Use Gemini for Gmail/Calendar integrations (native)');

  return recommendations;
}

/**
 * Log cost event
 */
async function logCostEvent(
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('cost_events').insert({
    event_type: eventType,
    details,
    created_at: new Date().toISOString(),
  });
}

// Initialize on module load
initializeUsageTracker();

export default {
  PROVIDER_COSTS,
  DEFAULT_BUDGET,
  calculateCost,
  trackUsage,
  getCostStatus,
  checkClientBudget,
  getCostBreakdown,
  resetDailyUsage,
  updateBudget,
  getCostOptimizations,
};
