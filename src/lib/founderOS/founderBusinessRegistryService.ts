/**
 * Founder Business Registry Service
 *
 * CRUD operations for founder_businesses table.
 * Manages the registry of all businesses owned by a founder.
 *
 * @module founderOS/founderBusinessRegistryService
 */

import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type BusinessStatus = 'active' | 'inactive' | 'archived';

export interface FounderBusiness {
  id: string;
  owner_user_id: string;
  code: string;
  display_name: string;
  description: string | null;
  industry: string | null;
  region: string | null;
  primary_domain: string | null;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessInput {
  code: string;
  display_name: string;
  description?: string;
  industry?: string;
  region?: string;
  primary_domain?: string;
}

export interface UpdateBusinessInput {
  code?: string;
  display_name?: string;
  description?: string | null;
  industry?: string | null;
  region?: string | null;
  primary_domain?: string | null;
  status?: BusinessStatus;
}

export interface BusinessRegistryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Create a new business for a founder
 *
 * @param ownerUserId - UUID of the business owner
 * @param data - Business creation data
 * @returns Created business or error
 */
export async function createBusiness(
  ownerUserId: string,
  data: CreateBusinessInput
): Promise<BusinessRegistryResult<FounderBusiness>> {
  try {
    const supabase = supabaseAdmin;

    const { data: business, error } = await supabase
      .from('founder_businesses')
      .insert({
        owner_user_id: ownerUserId,
        code: data.code.toUpperCase(),
        display_name: data.display_name,
        description: data.description || null,
        industry: data.industry || null,
        region: data.region || null,
        primary_domain: data.primary_domain || null,
        status: 'active' as BusinessStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('[FounderBusinessRegistry] Create error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: `Business code '${data.code}' already exists for this owner`,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: business as FounderBusiness,
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] Create exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating business',
    };
  }
}

/**
 * Get a single business by ID
 *
 * @param businessId - UUID of the business
 * @returns Business data or error
 */
export async function getBusiness(
  businessId: string
): Promise<BusinessRegistryResult<FounderBusiness>> {
  try {
    const supabase = await getSupabaseServer();

    const { data: business, error } = await supabase
      .from('founder_businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Business not found',
        };
      }
      console.error('[FounderBusinessRegistry] Get error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: business as FounderBusiness,
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] Get exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching business',
    };
  }
}

/**
 * List all businesses for a founder
 *
 * @param ownerUserId - UUID of the business owner
 * @param includeInactive - Include inactive/archived businesses (default: false)
 * @returns List of businesses
 */
export async function listBusinesses(
  ownerUserId: string,
  includeInactive = false
): Promise<BusinessRegistryResult<FounderBusiness[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_businesses')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data: businesses, error } = await query;

    if (error) {
      console.error('[FounderBusinessRegistry] List error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (businesses || []) as FounderBusiness[],
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] List exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error listing businesses',
    };
  }
}

/**
 * Update a business
 *
 * @param businessId - UUID of the business
 * @param data - Update data
 * @returns Updated business or error
 */
export async function updateBusiness(
  businessId: string,
  data: UpdateBusinessInput
): Promise<BusinessRegistryResult<FounderBusiness>> {
  try {
    const supabase = supabaseAdmin;

    // Transform code to uppercase if provided
    const updateData = { ...data };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const { data: business, error } = await supabase
      .from('founder_businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('[FounderBusinessRegistry] Update error:', error);

      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: `Business code '${data.code}' already exists for this owner`,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: business as FounderBusiness,
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] Update exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error updating business',
    };
  }
}

/**
 * Soft delete a business by setting status to 'inactive'
 *
 * @param businessId - UUID of the business
 * @returns Updated business or error
 */
export async function deactivateBusiness(
  businessId: string
): Promise<BusinessRegistryResult<FounderBusiness>> {
  return updateBusiness(businessId, { status: 'inactive' });
}

/**
 * Archive a business (different from deactivate - more permanent)
 *
 * @param businessId - UUID of the business
 * @returns Updated business or error
 */
export async function archiveBusiness(
  businessId: string
): Promise<BusinessRegistryResult<FounderBusiness>> {
  return updateBusiness(businessId, { status: 'archived' });
}

/**
 * Reactivate a deactivated/archived business
 *
 * @param businessId - UUID of the business
 * @returns Updated business or error
 */
export async function reactivateBusiness(
  businessId: string
): Promise<BusinessRegistryResult<FounderBusiness>> {
  return updateBusiness(businessId, { status: 'active' });
}

/**
 * Get business by code for a specific owner
 *
 * @param ownerUserId - UUID of the business owner
 * @param code - Business code (will be uppercased)
 * @returns Business data or error
 */
export async function getBusinessByCode(
  ownerUserId: string,
  code: string
): Promise<BusinessRegistryResult<FounderBusiness>> {
  try {
    const supabase = supabaseAdmin;

    const { data: business, error } = await supabase
      .from('founder_businesses')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: `Business with code '${code}' not found`,
        };
      }
      console.error('[FounderBusinessRegistry] GetByCode error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: business as FounderBusiness,
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] GetByCode exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching business by code',
    };
  }
}

/**
 * Count businesses for a founder
 *
 * @param ownerUserId - UUID of the business owner
 * @param status - Optional status filter
 * @returns Count result
 */
export async function countBusinesses(
  ownerUserId: string,
  status?: BusinessStatus
): Promise<BusinessRegistryResult<number>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_businesses')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[FounderBusinessRegistry] Count error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (err) {
    console.error('[FounderBusinessRegistry] Count exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error counting businesses',
    };
  }
}
