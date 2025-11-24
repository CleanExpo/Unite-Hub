/**
 * Region Ownership Service
 * Phase 91: Region assignment and validation
 */

import { getSupabaseServer } from '@/lib/supabase';
import { Region, AgencyLicense, AssignRegionInput } from './franchiseTypes';

/**
 * Assign region to agency with tier
 */
export async function assignRegion(input: AssignRegionInput): Promise<AgencyLicense> {
  const supabase = await getSupabaseServer();

  // Generate license key
  const licenseKey = `LIC-${input.agencyId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from('agency_licenses')
    .insert({
      agency_id: input.agencyId,
      region_id: input.regionId,
      tier_id: input.tierId,
      license_key: licenseKey,
      expires_on: input.expiresOn,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign region: ${error.message}`);
  }

  return mapToLicense(data);
}

/**
 * List regions for an agency
 */
export async function listRegionsForAgency(agencyId: string): Promise<Region[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_licenses')
    .select(`
      regions (*)
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'active');

  if (error) {
    console.error('Failed to list regions:', error);
    return [];
  }

  return (data || [])
    .map((row: any) => row.regions)
    .filter(Boolean)
    .map(mapToRegion);
}

/**
 * Check if region is owned by agency
 */
export async function isRegionOwnedByAgency(
  regionId: string,
  agencyId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('agency_licenses')
    .select('id')
    .eq('agency_id', agencyId)
    .eq('region_id', regionId)
    .eq('status', 'active')
    .single();

  return !!data;
}

/**
 * Get all available regions
 */
export async function getAllRegions(): Promise<Region[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Failed to get regions:', error);
    return [];
  }

  return (data || []).map(mapToRegion);
}

/**
 * Get region by ID
 */
export async function getRegion(regionId: string): Promise<Region | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', regionId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToRegion(data);
}

/**
 * Create a new region
 */
export async function createRegion(region: Partial<Region>): Promise<Region> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('regions')
    .insert({
      name: region.name,
      slug: region.slug,
      country_code: region.countryCode,
      state_code: region.stateCode,
      timezone: region.timezone,
      boundary_geojson: region.boundaryGeojson,
      parent_region_id: region.parentRegionId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create region: ${error.message}`);
  }

  return mapToRegion(data);
}

/**
 * Get regions by country
 */
export async function getRegionsByCountry(countryCode: string): Promise<Region[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('country_code', countryCode)
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Failed to get regions by country:', error);
    return [];
  }

  return (data || []).map(mapToRegion);
}

// Helpers
function mapToRegion(row: any): Region {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    slug: row.slug,
    countryCode: row.country_code,
    stateCode: row.state_code,
    timezone: row.timezone,
    boundaryGeojson: row.boundary_geojson,
    parentRegionId: row.parent_region_id,
    active: row.active,
    metadata: row.metadata,
  };
}

function mapToLicense(row: any): AgencyLicense {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    agencyId: row.agency_id,
    regionId: row.region_id,
    tierId: row.tier_id,
    licenseKey: row.license_key,
    startedOn: row.started_on,
    expiresOn: row.expires_on,
    status: row.status,
    currentClients: row.current_clients,
    currentUsers: row.current_users,
    nextBillingDate: row.next_billing_date,
    billingStatus: row.billing_status,
    metadata: row.metadata,
  };
}
