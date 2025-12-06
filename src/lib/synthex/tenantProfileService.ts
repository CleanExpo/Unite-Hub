/**
 * Synthex Tenant Profile Service
 * Manages tenant profiles, team members, and settings
 * Phase B23: Multi-Business Tenant Onboarding & Profiles
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// TYPES
// =====================================================

export interface TenantProfile {
  tenant_id: string;
  name: string;
  legal_name: string | null;
  industry: string;
  region: string;
  timezone: string;
  default_domain: string | null;
  logo_url: string | null;
  brand_tone: TenantBrandTone | null;
  brand_voice: string | null;
  created_at: string;
  updated_at: string;
}

export type TenantBrandTone = 'formal' | 'casual' | 'friendly' | 'professional' | 'playful' | 'authoritative' | 'conversational';

export type TenantRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type TenantMemberStatus = 'active' | 'invited' | 'disabled';

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string | null;
  invited_email: string;
  role: TenantRole;
  status: TenantMemberStatus;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  defaults: TenantDefaults;
  feature_flags: TenantFeatureFlags;
  created_at: string;
  updated_at: string;
}

export interface TenantDefaults {
  email_from_name?: string | null;
  email_reply_to?: string | null;
  default_timezone?: string;
  default_currency?: string;
  locale?: string;
}

export interface TenantFeatureFlags {
  ai_content_enabled?: boolean;
  multi_channel_enabled?: boolean;
  advanced_analytics_enabled?: boolean;
  api_access_enabled?: boolean;
  white_label_enabled?: boolean;
  custom_domain_enabled?: boolean;
}

export interface TenantProfileInput {
  name: string;
  legal_name?: string;
  industry: string;
  region?: string;
  timezone?: string;
  default_domain?: string;
  logo_url?: string;
  brand_tone?: TenantBrandTone;
  brand_voice?: string;
}

export interface InviteMemberInput {
  invited_email: string;
  role: TenantRole;
  invited_by: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// TENANT PROFILE MANAGEMENT
// =====================================================

/**
 * Get tenant profile by tenant_id
 * Uses get_tenant_profile function for fallback to synthex_tenants
 */
export async function getTenantProfile(
  tenantId: string
): Promise<ServiceResult<TenantProfile>> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_tenant_profile', {
      tenant_id_param: tenantId,
    });

    if (error) {
      console.error('[TenantProfileService] Error fetching tenant profile:', error);
      return {
        success: false,
        error: `Failed to fetch tenant profile: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Tenant profile not found',
      };
    }

    return {
      success: true,
      data: data[0],
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Upsert tenant profile
 * Creates or updates profile for a tenant
 */
export async function upsertTenantProfile(
  tenantId: string,
  profileData: TenantProfileInput
): Promise<ServiceResult<TenantProfile>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_profiles')
      .upsert(
        {
          tenant_id: tenantId,
          ...profileData,
        },
        {
          onConflict: 'tenant_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[TenantProfileService] Error upserting tenant profile:', error);
      return {
        success: false,
        error: `Failed to upsert tenant profile: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// =====================================================
// TENANT MEMBER MANAGEMENT
// =====================================================

/**
 * List all members for a tenant
 */
export async function listTenantMembers(
  tenantId: string
): Promise<ServiceResult<TenantMember[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TenantProfileService] Error listing tenant members:', error);
      return {
        success: false,
        error: `Failed to list tenant members: ${error.message}`,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Invite a new member to tenant
 * Creates invitation record with 'invited' status
 */
export async function inviteTenantMember(
  tenantId: string,
  memberData: InviteMemberInput
): Promise<ServiceResult<TenantMember>> {
  try {
    // Check if member already exists
    const { data: existingMember } = await supabaseAdmin
      .from('synthex_tenant_members')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('invited_email', memberData.invited_email)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return {
          success: false,
          error: 'Member already exists and is active',
        };
      }
      // Update existing invitation
      const { data, error } = await supabaseAdmin
        .from('synthex_tenant_members')
        .update({
          role: memberData.role,
          status: 'invited',
          invited_by: memberData.invited_by,
          invited_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id)
        .select()
        .single();

      if (error) {
        console.error('[TenantProfileService] Error updating member invitation:', error);
        return {
          success: false,
          error: `Failed to update member invitation: ${error.message}`,
        };
      }

      return {
        success: true,
        data,
      };
    }

    // Create new invitation
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_members')
      .insert({
        tenant_id: tenantId,
        invited_email: memberData.invited_email,
        role: memberData.role,
        status: 'invited',
        invited_by: memberData.invited_by,
      })
      .select()
      .single();

    if (error) {
      console.error('[TenantProfileService] Error inviting tenant member:', error);
      return {
        success: false,
        error: `Failed to invite tenant member: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Update member role or status
 */
export async function updateTenantMember(
  memberId: string,
  updates: Partial<Pick<TenantMember, 'role' | 'status'>>
): Promise<ServiceResult<TenantMember>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('[TenantProfileService] Error updating tenant member:', error);
      return {
        success: false,
        error: `Failed to update tenant member: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Remove member from tenant
 */
export async function removeTenantMember(memberId: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_tenant_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('[TenantProfileService] Error removing tenant member:', error);
      return {
        success: false,
        error: `Failed to remove tenant member: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// =====================================================
// TENANT SETTINGS MANAGEMENT
// =====================================================

/**
 * Get tenant settings
 */
export async function getTenantSettings(
  tenantId: string
): Promise<ServiceResult<TenantSettings>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      // If settings don't exist, create default settings
      if (error.code === 'PGRST116') {
        const createResult = await createDefaultTenantSettings(tenantId);
        if (!createResult.success) {
          return createResult;
        }
        return {
          success: true,
          data: createResult.data!,
        };
      }

      console.error('[TenantProfileService] Error fetching tenant settings:', error);
      return {
        success: false,
        error: `Failed to fetch tenant settings: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: string,
  updates: {
    defaults?: Partial<TenantDefaults>;
    feature_flags?: Partial<TenantFeatureFlags>;
  }
): Promise<ServiceResult<TenantSettings>> {
  try {
    // Get current settings
    const currentResult = await getTenantSettings(tenantId);
    if (!currentResult.success) {
      return currentResult;
    }

    const current = currentResult.data!;

    // Merge updates with current values
    const newDefaults = updates.defaults
      ? { ...current.defaults, ...updates.defaults }
      : current.defaults;

    const newFeatureFlags = updates.feature_flags
      ? { ...current.feature_flags, ...updates.feature_flags }
      : current.feature_flags;

    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_settings')
      .update({
        defaults: newDefaults,
        feature_flags: newFeatureFlags,
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('[TenantProfileService] Error updating tenant settings:', error);
      return {
        success: false,
        error: `Failed to update tenant settings: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Create default tenant settings (internal helper)
 */
async function createDefaultTenantSettings(
  tenantId: string
): Promise<ServiceResult<TenantSettings>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_tenant_settings')
      .insert({
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      console.error('[TenantProfileService] Error creating default settings:', error);
      return {
        success: false,
        error: `Failed to create default settings: ${error.message}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user is member of tenant
 */
export async function isTenantMember(
  tenantId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('is_tenant_member', {
      tenant_id_param: tenantId,
      user_id_param: userId,
    });

    if (error) {
      console.error('[TenantProfileService] Error checking tenant membership:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return false;
  }
}

/**
 * Get member role for user in tenant
 */
export async function getTenantMemberRole(
  tenantId: string,
  userId: string
): Promise<TenantRole | 'none'> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_tenant_member_role', {
      tenant_id_param: tenantId,
      user_id_param: userId,
    });

    if (error) {
      console.error('[TenantProfileService] Error getting member role:', error);
      return 'none';
    }

    return (data as TenantRole) || 'none';
  } catch (err) {
    console.error('[TenantProfileService] Unexpected error:', err);
    return 'none';
  }
}
