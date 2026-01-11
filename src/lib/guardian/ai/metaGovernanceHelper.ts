/**
 * Helper to access Z10 governance flags
 * Used by H01 and H02 for AI gating
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GovernanceFlags {
  aiUsagePolicy: 'enabled' | 'disabled';
  externalSharingPolicy: 'public' | 'restricted' | 'disabled';
}

/**
 * Get governance flags for a tenant
 * Reads from Z10 guardian_meta_feature_flags if available
 * Defaults to { aiUsagePolicy: 'disabled' } if Z10 absent
 */
export async function getTenantGovernanceFlags(tenantId: string): Promise<GovernanceFlags> {
  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('guardian_meta_feature_flags')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      // Z10 table doesn't exist or record not found
      console.warn('Z10 governance flags not available, defaulting to disabled:', error.message);
      return {
        aiUsagePolicy: 'disabled',
        externalSharingPolicy: 'disabled',
      };
    }

    return {
      aiUsagePolicy: data.enable_ai_hints ? 'enabled' : 'disabled',
      externalSharingPolicy: data.external_sharing_policy || 'disabled',
    };
  } catch (err) {
    console.warn('Error fetching governance flags:', err);
    return {
      aiUsagePolicy: 'disabled',
      externalSharingPolicy: 'disabled',
    };
  }
}

/**
 * Check if AI is enabled for a specific tenant
 */
export async function isAiEnabled(tenantId: string): Promise<boolean> {
  const flags = await getTenantGovernanceFlags(tenantId);
  return flags.aiUsagePolicy === 'enabled';
}

/**
 * Check if external sharing is allowed
 */
export async function isExternalSharingAllowed(tenantId: string): Promise<boolean> {
  const flags = await getTenantGovernanceFlags(tenantId);
  return flags.externalSharingPolicy !== 'disabled';
}
