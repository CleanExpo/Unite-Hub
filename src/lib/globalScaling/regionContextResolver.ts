/**
 * Region Context Resolver
 * Phase 92: Resolve region context from various sources
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Resolve region for an agency from their license
 */
export async function resolveRegionForAgency(agencyId: string): Promise<string | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_licenses')
    .select('region_id')
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data.region_id;
}

/**
 * Resolve region for a client through their agency
 */
export async function resolveRegionForClient(clientId: string): Promise<string | null> {
  const supabase = await getSupabaseServer();

  // Get client's agency
  const { data: client, error: clientError } = await supabase
    .from('contacts')
    .select('tenant_id')
    .eq('id', clientId)
    .single();

  if (clientError || !client?.tenant_id) {
    return null;
  }

  // Get agency's region
  return resolveRegionForAgency(client.tenant_id);
}

/**
 * Resolve region from request headers
 */
export async function resolveRegionFromHeaders(
  headers: Headers
): Promise<string | null> {
  // Check for explicit region header
  const regionId = headers.get('x-region-id');
  if (regionId) {
    return regionId;
  }

  // Check for agency header and resolve from there
  const agencyId = headers.get('x-agency-id');
  if (agencyId) {
    return resolveRegionForAgency(agencyId);
  }

  return null;
}

/**
 * Get region details with scaling state
 */
export async function getRegionWithState(regionId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('regions')
    .select(`
      *,
      region_scaling_state (*)
    `)
    .eq('id', regionId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get all regions for an agency (including parent regions)
 */
export async function getAgencyRegions(agencyId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_licenses')
    .select(`
      region_id,
      regions (
        id,
        name,
        slug,
        country_code,
        state_code,
        parent_region_id
      )
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'active');

  if (error) {
    return [];
  }

  return data?.map(d => d.regions).filter(Boolean) || [];
}
