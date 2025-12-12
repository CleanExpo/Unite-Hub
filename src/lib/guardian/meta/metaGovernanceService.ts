/**
 * Guardian Z10: Meta Governance Service
 * Manages feature flags and governance preferences for Z-series stack
 * Provides capability profile with master AI policy gating
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logMetaAuditEvent } from './metaAuditService';

// ===== TYPE DEFINITIONS =====

export type GuardianMetaFeatureFlagKey =
  | 'enable_z_ai_hints'
  | 'enable_z_success_narrative'
  | 'enable_z_playbook_ai'
  | 'enable_z_lifecycle_ai'
  | 'enable_z_goals_ai';

export type GuardianMetaRiskPosture = 'standard' | 'conservative' | 'experimental';
export type GuardianMetaAiUsagePolicy = 'off' | 'limited' | 'advisory';
export type GuardianMetaExternalSharingPolicy = 'internal_only' | 'cs_safe' | 'exec_ready';

export interface GuardianMetaFeatureFlags {
  enableZAiHints: boolean;
  enableZSuccessNarrative: boolean;
  enableZPlaybookAi: boolean;
  enableZLifecycleAi: boolean;
  enableZGoalsAi: boolean;
}

export interface GuardianMetaGovernancePrefs {
  riskPosture: GuardianMetaRiskPosture;
  aiUsagePolicy: GuardianMetaAiUsagePolicy;
  externalSharingPolicy: GuardianMetaExternalSharingPolicy;
}

export interface GuardianMetaCapabilityProfile {
  aiHintsAllowed: boolean;
  aiDraftsAllowed: boolean;
  externalNarrativesAllowed: boolean;
  riskPosture: GuardianMetaRiskPosture;
}

// ===== FEATURE FLAG OPERATIONS =====

/**
 * Load meta feature flags for tenant
 * Returns defaults if no row exists (conservative: all false = opt-in)
 */
export async function loadMetaFeatureFlagsForTenant(
  tenantId: string
): Promise<GuardianMetaFeatureFlags> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is ok (return defaults)
    throw error;
  }

  return {
    enableZAiHints: data?.enable_z_ai_hints ?? false,
    enableZSuccessNarrative: data?.enable_z_success_narrative ?? false,
    enableZPlaybookAi: data?.enable_z_playbook_ai ?? false,
    enableZLifecycleAi: data?.enable_z_lifecycle_ai ?? false,
    enableZGoalsAi: data?.enable_z_goals_ai ?? false,
  };
}

/**
 * Update meta feature flags with audit logging
 * Validates flag keys before updating
 */
export async function updateMetaFeatureFlags(
  tenantId: string,
  actor: string,
  updates: Partial<Record<GuardianMetaFeatureFlagKey, boolean>>
): Promise<GuardianMetaFeatureFlags> {
  const supabase = getSupabaseServer();

  // Validate keys
  const validKeys: GuardianMetaFeatureFlagKey[] = [
    'enable_z_ai_hints',
    'enable_z_success_narrative',
    'enable_z_playbook_ai',
    'enable_z_lifecycle_ai',
    'enable_z_goals_ai',
  ];

  for (const key of Object.keys(updates)) {
    if (!validKeys.includes(key as GuardianMetaFeatureFlagKey)) {
      throw new Error(`Invalid feature flag key: ${key}`);
    }
  }

  // Build update payload with snake_case keys
  const updatePayload: Record<string, boolean | string> = {
    updated_at: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(updates)) {
    updatePayload[key] = value;
  }

  // Upsert flags
  const { error } = await supabase
    .from('guardian_meta_feature_flags')
    .upsert({
      tenant_id: tenantId,
      ...updatePayload,
    });

  if (error) throw error;

  // Log audit event
  await logMetaAuditEvent({
    tenantId,
    actor,
    source: 'meta_governance',
    action: 'policy_change',
    entityType: 'meta_flag',
    summary: 'Updated meta feature flags',
    details: { changes: updates },
  });

  // Return updated flags
  return loadMetaFeatureFlagsForTenant(tenantId);
}

// ===== GOVERNANCE PREFERENCE OPERATIONS =====

/**
 * Load meta governance preferences for tenant
 * Returns defaults if no row exists (standard risk, limited AI, internal_only sharing)
 */
export async function loadMetaGovernancePrefsForTenant(
  tenantId: string
): Promise<GuardianMetaGovernancePrefs> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_governance_prefs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is ok (return defaults)
    throw error;
  }

  return {
    riskPosture: (data?.risk_posture as GuardianMetaRiskPosture) ?? 'standard',
    aiUsagePolicy: (data?.ai_usage_policy as GuardianMetaAiUsagePolicy) ?? 'limited',
    externalSharingPolicy: (data?.external_sharing_policy as GuardianMetaExternalSharingPolicy) ?? 'internal_only',
  };
}

/**
 * Update meta governance preferences with validation and audit logging
 */
export async function updateMetaGovernancePrefs(
  tenantId: string,
  actor: string,
  updates: Partial<GuardianMetaGovernancePrefs>
): Promise<GuardianMetaGovernancePrefs> {
  const supabase = getSupabaseServer();

  // Validate enums
  if (updates.riskPosture && !['standard', 'conservative', 'experimental'].includes(updates.riskPosture)) {
    throw new Error(`Invalid risk posture: ${updates.riskPosture}`);
  }
  if (updates.aiUsagePolicy && !['off', 'limited', 'advisory'].includes(updates.aiUsagePolicy)) {
    throw new Error(`Invalid AI usage policy: ${updates.aiUsagePolicy}`);
  }
  if (
    updates.externalSharingPolicy &&
    !['internal_only', 'cs_safe', 'exec_ready'].includes(updates.externalSharingPolicy)
  ) {
    throw new Error(`Invalid external sharing policy: ${updates.externalSharingPolicy}`);
  }

  // Build update payload
  const updatePayload: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.riskPosture) updatePayload.risk_posture = updates.riskPosture;
  if (updates.aiUsagePolicy) updatePayload.ai_usage_policy = updates.aiUsagePolicy;
  if (updates.externalSharingPolicy) updatePayload.external_sharing_policy = updates.externalSharingPolicy;

  // Upsert prefs
  const { error } = await supabase
    .from('guardian_meta_governance_prefs')
    .upsert({
      tenant_id: tenantId,
      ...updatePayload,
    });

  if (error) throw error;

  // Log audit event
  await logMetaAuditEvent({
    tenantId,
    actor,
    source: 'meta_governance',
    action: 'policy_change',
    entityType: 'governance_prefs',
    summary: 'Updated meta governance preferences',
    details: { changes: updates },
  });

  // Return updated prefs
  return loadMetaGovernancePrefsForTenant(tenantId);
}

// ===== CAPABILITY PROFILE (MASTER AI GATE) =====

/**
 * Get combined capability profile with master AI policy gating
 * AI usage policy acts as master kill-switch for all AI calls
 * Individual flags only matter if master policy allows AI
 */
export async function getMetaCapabilityProfile(
  tenantId: string
): Promise<GuardianMetaCapabilityProfile> {
  const flags = await loadMetaFeatureFlagsForTenant(tenantId);
  const prefs = await loadMetaGovernancePrefsForTenant(tenantId);

  // Master AI policy gates individual flags
  const aiAllowed = prefs.aiUsagePolicy !== 'off';
  const aiAdvisoryAllowed = prefs.aiUsagePolicy === 'advisory';
  const externalSharingAllowed = prefs.externalSharingPolicy !== 'internal_only';

  return {
    aiHintsAllowed: aiAllowed && flags.enableZAiHints,
    aiDraftsAllowed: aiAdvisoryAllowed && (
      flags.enableZPlaybookAi ||
      flags.enableZLifecycleAi ||
      flags.enableZGoalsAi
    ),
    externalNarrativesAllowed: externalSharingAllowed && flags.enableZSuccessNarrative,
    riskPosture: prefs.riskPosture,
  };
}

// ===== VALIDATION HELPERS =====

/**
 * Validate risk posture enum
 */
export function isValidRiskPosture(value: unknown): value is GuardianMetaRiskPosture {
  return ['standard', 'conservative', 'experimental'].includes(String(value));
}

/**
 * Validate AI usage policy enum
 */
export function isValidAiUsagePolicy(value: unknown): value is GuardianMetaAiUsagePolicy {
  return ['off', 'limited', 'advisory'].includes(String(value));
}

/**
 * Validate external sharing policy enum
 */
export function isValidExternalSharingPolicy(value: unknown): value is GuardianMetaExternalSharingPolicy {
  return ['internal_only', 'cs_safe', 'exec_ready'].includes(String(value));
}
