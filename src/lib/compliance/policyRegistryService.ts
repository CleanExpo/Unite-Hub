/**
 * Policy Registry Service
 * Phase 93: Load and manage compliance policies
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { CompliancePolicy } from './complianceTypes';

/**
 * List all policies for a region and platform
 */
export async function listPolicies(
  regionSlug: string,
  platform: string
): Promise<CompliancePolicy[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_policies')
    .select('*')
    .eq('region_slug', regionSlug)
    .or(`platform.eq.${platform},platform.eq.generic`)
    .order('severity', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(mapPolicyFromDb);
}

/**
 * Get only active policies for a region and platform
 */
export async function getActivePolicies(
  regionSlug: string,
  platform: string
): Promise<CompliancePolicy[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_policies')
    .select('*')
    .eq('region_slug', regionSlug)
    .or(`platform.eq.${platform},platform.eq.generic`)
    .eq('is_active', true)
    .order('severity', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(mapPolicyFromDb);
}

/**
 * Get a specific policy by code
 */
export async function getPolicyByCode(
  regionSlug: string,
  platform: string,
  policyCode: string
): Promise<CompliancePolicy | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_policies')
    .select('*')
    .eq('region_slug', regionSlug)
    .or(`platform.eq.${platform},platform.eq.generic`)
    .eq('policy_code', policyCode)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPolicyFromDb(data);
}

/**
 * Get all unique policy codes across all regions
 */
export async function getAllPolicyCodes(): Promise<string[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_policies')
    .select('policy_code')
    .eq('is_active', true);

  if (error || !data) {
    return [];
  }

  const codes = new Set(data.map(d => d.policy_code));
  return Array.from(codes).sort();
}

/**
 * Get coverage stats - which regions/platforms have policies
 */
export async function getPolicyCoverage(): Promise<{
  regions: string[];
  platforms: string[];
  totalPolicies: number;
}> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_policies')
    .select('region_slug, platform')
    .eq('is_active', true);

  if (error || !data) {
    return { regions: [], platforms: [], totalPolicies: 0 };
  }

  const regions = new Set(data.map(d => d.region_slug));
  const platforms = new Set(data.map(d => d.platform));

  return {
    regions: Array.from(regions).sort(),
    platforms: Array.from(platforms).sort(),
    totalPolicies: data.length,
  };
}

function mapPolicyFromDb(row: any): CompliancePolicy {
  return {
    id: row.id,
    regionSlug: row.region_slug,
    platform: row.platform,
    policyCode: row.policy_code,
    severity: row.severity,
    descriptionMarkdown: row.description_markdown,
    examplePatterns: row.example_patterns || [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
