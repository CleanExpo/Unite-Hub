/**
 * AetherOS Omega Protocol - Context Injector (The Heartbeat)
 * 
 * Injects dynamic telemetry into every LLM session:
 * - Time & region (for energy arbitrage)
 * - User tier & budget
 * - Optional trend data
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { EnvironmentTelemetry } from './types';

// ============================================================================
// TELEMETRY GENERATION
// ============================================================================

/**
 * Generate environment telemetry for a session
 */
export async function generateTelemetry(
  tenantId: string,
  _userId: string
): Promise<EnvironmentTelemetry> {
  const now = new Date();
  const utcNow = now.toISOString();
  
  // Determine target region (Brisbane/Australia for off-peak)
  const brisbaneTime = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  const brisbaneHour = parseInt(brisbaneTime.split(':')[0]);
  const isOffPeak = brisbaneHour >= 0 && brisbaneHour < 6; // 12am-6am is off-peak

  // Get tenant tier and budget info
  const { data: tenant } = await supabaseAdmin
    .from('synthex_tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  const tierName = tenant?.settings?.tier || 'free';
  
  // Get tier limits
  const { data: tierLimits } = await supabaseAdmin
    .from('synthex_tier_limits')
    .select('*')
    .eq('tier_name', tierName)
    .single();

  const sessionBudgetCap = tierLimits?.monthly_budget 
    ? `$${(tierLimits.monthly_budget / 30).toFixed(2)}` 
    : '$0.00';

  // Get current spend for the day
  const { data: todaySpend } = await supabaseAdmin
    .from('synthex_aetheros_visual_jobs')
    .select('cost')
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  const currentSpend = todaySpend
    ? todaySpend.reduce((sum, job) => sum + (job.cost || 0), 0)
    : 0;

  const budgetCap = tierLimits?.monthly_budget 
    ? tierLimits.monthly_budget / 30 
    : 0;

  const remainingBudget = Math.max(0, budgetCap - currentSpend);

  const telemetry: EnvironmentTelemetry = {
    global_clock: {
      utc_now: utcNow,
      target_region_time: `Australia/Brisbane: ${brisbaneTime} AEST${isOffPeak ? ' (OFF-PEAK)' : ''}`,
      region: 'australia-southeast1',
      energy_arbitrage_active: isOffPeak,
    },
    saas_economics: {
      user_tier: tierName,
      session_budget_cap: sessionBudgetCap,
      current_spend: `$${currentSpend.toFixed(4)}`,
      remaining_budget: `$${remainingBudget.toFixed(4)}`,
    },
  };

  // Optional: Add zeitgeist trends (can be extended later)
  // This could integrate with trend APIs or stored data
  if (process.env.ENABLE_TREND_DATA === 'true') {
    telemetry.zeitgeist_trends_today = await fetchTrendData();
  }

  return telemetry;
}

/**
 * Format telemetry for system prompt injection
 */
export function formatTelemetryForPrompt(telemetry: EnvironmentTelemetry): string {
  return `
## ENVIRONMENT_TELEMETRY

### Global Clock
- UTC Now: ${telemetry.global_clock.utc_now}
- Target Region: ${telemetry.global_clock.target_region_time}
- Cloud Region: ${telemetry.global_clock.region}
- Energy Arbitrage: ${telemetry.global_clock.energy_arbitrage_active ? '✓ ACTIVE' : '✗ INACTIVE'}

### SaaS Economics
- User Tier: ${telemetry.saas_economics.user_tier}
- Session Budget Cap: ${telemetry.saas_economics.session_budget_cap}
- Current Spend: ${telemetry.saas_economics.current_spend}
- Remaining Budget: ${telemetry.saas_economics.remaining_budget}

${telemetry.zeitgeist_trends_today ? `
### Zeitgeist Trends Today
- Color of Day: ${telemetry.zeitgeist_trends_today.color_of_day}
- Visual Vibe: ${telemetry.zeitgeist_trends_today.visual_vibe}
- Trending Aesthetics: ${telemetry.zeitgeist_trends_today.trending_aesthetics.join(', ')}
` : ''}
`.trim();
}

/**
 * Inject telemetry into system prompt
 */
export function injectTelemetry(
  baseSystemPrompt: string,
  telemetry: EnvironmentTelemetry
): string {
  const telemetryBlock = formatTelemetryForPrompt(telemetry);
  return `${baseSystemPrompt}\n\n${telemetryBlock}`;
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Start an AetherOS session with telemetry
 */
export async function startSession(
  tenantId: string,
  userId: string
): Promise<{ sessionId: string; telemetry: EnvironmentTelemetry }> {
  const telemetry = await generateTelemetry(tenantId, userId);

  const { data: session, error } = await supabaseAdmin
    .from('synthex_aetheros_sessions')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      session_start: new Date().toISOString(),
      telemetry,
      region_routed: telemetry.global_clock.region,
      energy_savings_pct: telemetry.global_clock.energy_arbitrage_active ? 38 : 0,
      total_cost: 0,
      operations_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[AetherOS] Failed to start session:', error);
    throw new Error('Failed to start AetherOS session');
  }

  return {
    sessionId: session.id,
    telemetry,
  };
}

/**
 * Update session cost
 */
export async function updateSessionCost(
  sessionId: string,
  additionalCost: number
): Promise<void> {
  const { data: session } = await supabaseAdmin
    .from('synthex_aetheros_sessions')
    .select('total_cost, operations_count')
    .eq('id', sessionId)
    .single();

  if (!session) {
return;
}

  await supabaseAdmin
    .from('synthex_aetheros_sessions')
    .update({
      total_cost: (session.total_cost || 0) + additionalCost,
      operations_count: (session.operations_count || 0) + 1,
    })
    .eq('id', sessionId);
}

/**
 * End session
 */
export async function endSession(sessionId: string): Promise<void> {
  await supabaseAdmin
    .from('synthex_aetheros_sessions')
    .update({
      session_end: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch trend data from external sources or cache
 * Placeholder for future integration with trend APIs
 */
async function fetchTrendData(): Promise<EnvironmentTelemetry['zeitgeist_trends_today']> {
  // TODO: Integrate with SerpApi or trend tracking service
  // For now, return sensible defaults
  return {
    color_of_day: '#4A90E2', // Default blue
    visual_vibe: 'Modern Minimalism',
    trending_aesthetics: ['Clean SaaS', 'Glassmorphism', 'Gradient Accents'],
  };
}

/**
 * Calculate energy cost multiplier based on region and time
 */
export function calculateEnergyCostMultiplier(telemetry: EnvironmentTelemetry): number {
  if (telemetry.global_clock.region === 'australia-southeast1') {
    return telemetry.global_clock.energy_arbitrage_active
      ? 0.62 // 38% savings
      : 0.85; // Still cheaper than US
  }
  return 1.0; // US baseline
}

/**
 * Check if budget allows for operation
 */
export function canAffordOperation(
  telemetry: EnvironmentTelemetry,
  operationCost: number
): boolean {
  const remaining = parseFloat(
    telemetry.saas_economics.remaining_budget.replace('$', '')
  );
  return remaining >= operationCost;
}
