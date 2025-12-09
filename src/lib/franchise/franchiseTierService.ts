/**
 * Franchise Tier Service
 * Phase 91: Tier limits and constraints
 */

import { getSupabaseServer } from '@/lib/supabase';
import { FranchiseTier, LicenseDetails } from './franchiseTypes';

/**
 * Get tier by ID
 */
export async function getTier(tierId: number): Promise<FranchiseTier | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('franchise_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToTier(data);
}

/**
 * Get all tiers
 */
export async function getAllTiers(): Promise<FranchiseTier[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('franchise_tiers')
    .select('*')
    .order('monthly_fee');

  if (error) {
    console.error('Failed to get tiers:', error);
    return [];
  }

  return (data || []).map(mapToTier);
}

/**
 * Get agency's license details
 */
export async function getAgencyLicense(agencyId: string): Promise<LicenseDetails | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_agency_license', {
    p_agency_id: agencyId,
  });

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    licenseId: row.license_id,
    regionName: row.region_name,
    tierName: row.tier_name,
    status: row.status,
    expiresOn: row.expires_on,
    maxClients: row.max_clients,
    currentClients: row.current_clients,
    maxUsers: row.max_users,
    currentUsers: row.current_users,
  };
}

/**
 * Apply tier limits for an action
 */
export async function applyTierLimits(
  agencyId: string,
  actionType: 'add_client' | 'add_user' | 'post'
): Promise<{ allowed: boolean; message?: string }> {
  const license = await getAgencyLicense(agencyId);

  if (!license) {
    return {
      allowed: false,
      message: 'No active license found',
    };
  }

  if (license.status !== 'active') {
    return {
      allowed: false,
      message: `License is ${license.status}`,
    };
  }

  // Check expiry
  if (new Date(license.expiresOn) < new Date()) {
    return {
      allowed: false,
      message: 'License has expired',
    };
  }

  switch (actionType) {
    case 'add_client':
      if (license.maxClients !== -1 && license.currentClients >= license.maxClients) {
        return {
          allowed: false,
          message: `Client limit reached (${license.currentClients}/${license.maxClients})`,
        };
      }
      break;

    case 'add_user':
      if (license.maxUsers !== -1 && license.currentUsers >= license.maxUsers) {
        return {
          allowed: false,
          message: `User limit reached (${license.currentUsers}/${license.maxUsers})`,
        };
      }
      break;

    case 'post':
      // Rate limiting would be checked elsewhere
      break;
  }

  return { allowed: true };
}

/**
 * Validate client limit
 */
export async function validateClientLimit(agencyId: string): Promise<boolean> {
  const result = await applyTierLimits(agencyId, 'add_client');
  return result.allowed;
}

/**
 * Validate user limit
 */
export async function validateUserLimit(agencyId: string): Promise<boolean> {
  const result = await applyTierLimits(agencyId, 'add_user');
  return result.allowed;
}

/**
 * Update license usage counts
 */
export async function updateLicenseUsage(
  agencyId: string,
  updates: { clients?: number; users?: number }
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updateData: any = {};
  if (updates.clients !== undefined) {
    updateData.current_clients = updates.clients;
  }
  if (updates.users !== undefined) {
    updateData.current_users = updates.users;
  }

  const { error } = await supabase
    .from('agency_licenses')
    .update(updateData)
    .eq('agency_id', agencyId)
    .eq('status', 'active');

  if (error) {
    console.error('Failed to update license usage:', error);
  }
}

/**
 * Check if feature is available for tier
 */
export async function hasFeature(
  agencyId: string,
  feature: keyof FranchiseTier['features']
): Promise<boolean> {
  const license = await getAgencyLicense(agencyId);
  if (!license) {
return false;
}

  const tier = await getTierByName(license.tierName);
  if (!tier) {
return false;
}

  return tier.features[feature] ?? false;
}

/**
 * Get tier by name
 */
async function getTierByName(name: string): Promise<FranchiseTier | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('franchise_tiers')
    .select('*')
    .eq('name', name)
    .single();

  if (!data) {
return null;
}
  return mapToTier(data);
}

// Helper
function mapToTier(row: any): FranchiseTier {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    description: row.description,
    maxClients: row.max_clients,
    maxUsers: row.max_users,
    maxSubAgencies: row.max_sub_agencies,
    postingRateLimitHour: row.posting_rate_limit_hour,
    aiBudgetMonthly: row.ai_budget_monthly,
    features: row.features,
    monthlyFee: row.monthly_fee,
    revenueSharePercent: parseFloat(row.revenue_share_percent),
    metadata: row.metadata,
  };
}
