import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Configuration Service (H05)
 *
 * Centralized configuration and governance for all Guardian AI features.
 * Controls feature toggles, quotas, and safety limits per tenant.
 *
 * Design Principles:
 * - Safe defaults (AI enabled, reasonable quotas)
 * - Graceful degradation (defaults if no settings row)
 * - Tenant-scoped (RLS enforced)
 * - Type-safe feature keys
 */

export type GuardianAiFeature =
  | 'rule_assistant'
  | 'anomaly_detection'
  | 'correlation_refinement'
  | 'predictive_scoring'
  | 'briefing'
  | 'investigation'
  | 'explainability'
  | 'optimization'
  | 'rca'
  | 'playbook';

export interface GuardianAiSettings {
  id: string;
  tenant_id: string;
  ai_enabled: boolean;
  rule_assistant_enabled: boolean;
  anomaly_detection_enabled: boolean;
  correlation_refinement_enabled: boolean;
  predictive_scoring_enabled: boolean;
  briefing_enabled: boolean; // H07
  investigation_enabled: boolean; // H08
  explainability_enabled: boolean; // H09
  optimization_enabled: boolean; // H10
  rca_enabled: boolean; // H11
  playbook_enabled: boolean; // H12
  safety_monitoring_enabled: boolean; // H13
  safety_sampling_rate: number; // H13 (0-1)
  max_daily_ai_calls: number;
  soft_token_limit: number;
  // H14: Budget fields (advisory, optional)
  max_daily_calls?: number | null;
  max_daily_tokens?: number | null;
  max_monthly_tokens?: number | null;
  target_p95_latency_ms?: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Safe defaults when no settings row exists
 */
const DEFAULT_AI_SETTINGS: Omit<GuardianAiSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'updated_by'> = {
  ai_enabled: true,
  rule_assistant_enabled: true,
  anomaly_detection_enabled: true,
  correlation_refinement_enabled: true,
  predictive_scoring_enabled: true,
  briefing_enabled: true, // H07
  investigation_enabled: true, // H08
  explainability_enabled: true, // H09
  optimization_enabled: true, // H10
  rca_enabled: true, // H11
  playbook_enabled: true, // H12
  safety_monitoring_enabled: true, // H13
  safety_sampling_rate: 0.2, // H13 (20% sampling)
  max_daily_ai_calls: 500,
  soft_token_limit: 200000,
};

/**
 * Get Guardian AI settings for a tenant (with safe defaults)
 */
export async function getGuardianAiSettings(tenantId: string): Promise<GuardianAiSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guardian_ai_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[Guardian H05] Failed to fetch AI settings:', error);
    // Return safe defaults on error
    return {
      id: '',
      tenant_id: tenantId,
      ...DEFAULT_AI_SETTINGS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    };
  }

  // If no settings row exists, return safe defaults (don't create row yet)
  if (!data) {
    return {
      id: '',
      tenant_id: tenantId,
      ...DEFAULT_AI_SETTINGS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: null,
    };
  }

  return data as GuardianAiSettings;
}

/**
 * Check if Rule Assistant is enabled
 */
export function isRuleAssistantEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.rule_assistant_enabled;
}

/**
 * Check if Anomaly Detection is enabled
 */
export function isAnomalyDetectionEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.anomaly_detection_enabled;
}

/**
 * Check if Correlation Refinement is enabled
 */
export function isCorrelationRefinementEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.correlation_refinement_enabled;
}

/**
 * Check if Predictive Scoring is enabled
 */
export function isPredictiveScoringEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.predictive_scoring_enabled;
}

/**
 * Check if Executive Briefings are enabled (H07)
 */
export function isBriefingEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.briefing_enabled;
}

/**
 * Check if Investigation Console is enabled (H08)
 */
export function isInvestigationEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.investigation_enabled;
}

/**
 * Check if Explainability Hub is enabled (H09)
 */
export function isExplainabilityEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.explainability_enabled;
}

/**
 * Check if Optimization Assistant is enabled (H10)
 */
export function isOptimizationEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.optimization_enabled;
}

/**
 * Check if Incident RCA is enabled (H11)
 */
export function isRcaEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.rca_enabled;
}

/**
 * Check if Playbook Recommender is enabled (H12)
 */
export function isPlaybookEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.playbook_enabled;
}

/**
 * Check if Safety Monitoring is enabled (H13)
 */
export function isSafetyMonitoringEnabled(settings: GuardianAiSettings): boolean {
  return settings.ai_enabled && settings.safety_monitoring_enabled;
}

/**
 * Get safety sampling rate (H13)
 */
export function getSafetySamplingRate(settings: GuardianAiSettings): number {
  return settings.safety_sampling_rate;
}

/**
 * Get maximum daily AI calls quota
 */
export function getMaxDailyAiCalls(settings: GuardianAiSettings): number {
  return settings.max_daily_ai_calls;
}

/**
 * Get soft token limit
 */
export function getSoftTokenLimit(settings: GuardianAiSettings): number {
  return settings.soft_token_limit;
}

/**
 * Assert that an AI feature is enabled for a tenant
 * Throws typed error if disabled
 */
export async function assertAiFeatureEnabled(
  tenantId: string,
  featureKey: GuardianAiFeature
): Promise<void> {
  const settings = await getGuardianAiSettings(tenantId);

  // Check master toggle first
  if (!settings.ai_enabled) {
    throw new Error(
      `FEATURE_DISABLED: Guardian AI features are disabled for this tenant`
    );
  }

  // Check specific feature
  const featureMap = {
    rule_assistant: settings.rule_assistant_enabled,
    anomaly_detection: settings.anomaly_detection_enabled,
    correlation_refinement: settings.correlation_refinement_enabled,
    predictive_scoring: settings.predictive_scoring_enabled,
    briefing: settings.briefing_enabled, // H07
    investigation: settings.investigation_enabled, // H08
    explainability: settings.explainability_enabled, // H09
    optimization: settings.optimization_enabled, // H10
    rca: settings.rca_enabled, // H11
    playbook: settings.playbook_enabled, // H12
  };

  if (!featureMap[featureKey]) {
    throw new Error(
      `FEATURE_DISABLED: Guardian AI feature '${featureKey}' is disabled for this tenant`
    );
  }
}

/**
 * Check if daily AI call quota exceeded
 */
export async function checkDailyQuota(
  tenantId: string
): Promise<{ exceeded: boolean; current: number; limit: number }> {
  const settings = await getGuardianAiSettings(tenantId);
  const supabase = await createClient();

  // Count AI calls in last 24 hours across all AI tables
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [ruleSuggestions, anomalyScores, correlationReviews] = await Promise.all([
    supabase
      .from('guardian_ai_rule_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
    supabase
      .from('guardian_anomaly_scores')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
    supabase
      .from('guardian_ai_correlation_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', since),
  ]);

  const totalCalls =
    (ruleSuggestions.count ?? 0) +
    (anomalyScores.count ?? 0) +
    (correlationReviews.count ?? 0);

  return {
    exceeded: totalCalls >= settings.max_daily_ai_calls,
    current: totalCalls,
    limit: settings.max_daily_ai_calls,
  };
}
