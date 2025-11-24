/**
 * Agency Hierarchy Service
 * Phase 91: Parent-child agency management
 */

import { getSupabaseServer } from '@/lib/supabase';
import { AgencyWithLicense } from './franchiseTypes';

/**
 * Get child agencies for a parent
 */
export async function getChildAgencies(parentId: string): Promise<AgencyWithLicense[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase.rpc('get_child_agencies', {
    p_parent_id: parentId,
  });

  if (error) {
    console.error('Failed to get child agencies:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    agencyId: row.agency_id,
    agencyName: row.agency_name,
    agencySlug: row.agency_slug,
    licenseStatus: row.license_status,
    tierName: row.tier_name,
    regionName: row.region_name,
  }));
}

/**
 * Get parent agency for a child
 */
export async function getParentAgency(childId: string) {
  const supabase = await getSupabaseServer();

  const { data: child } = await supabase
    .from('agencies')
    .select('parent_agency_id')
    .eq('id', childId)
    .single();

  if (!child?.parent_agency_id) {
    return null;
  }

  const { data: parent } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', child.parent_agency_id)
    .single();

  if (!parent) {
    return null;
  }

  return {
    id: parent.id,
    name: parent.name,
    slug: parent.slug,
    active: parent.active,
  };
}

/**
 * Validate parent has access to child
 */
export async function validateParentAccess(
  parentId: string,
  childId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('agencies')
    .select('id')
    .eq('id', childId)
    .eq('parent_agency_id', parentId)
    .single();

  return !!data;
}

/**
 * Get full agency hierarchy tree
 */
export async function getAgencyTree(rootId: string): Promise<any> {
  const supabase = await getSupabaseServer();

  // Get root agency
  const { data: root } = await supabase
    .from('agencies')
    .select('id, name, slug, active')
    .eq('id', rootId)
    .single();

  if (!root) {
    return null;
  }

  // Get all children recursively
  const children = await getChildAgencies(rootId);

  const childTrees = await Promise.all(
    children.map(async (child) => {
      const subtree = await getAgencyTree(child.agencyId);
      return subtree;
    })
  );

  return {
    ...root,
    children: childTrees.filter(Boolean),
  };
}

/**
 * Set parent agency for a child
 */
export async function setParentAgency(
  childId: string,
  parentId: string | null
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('agencies')
    .update({ parent_agency_id: parentId })
    .eq('id', childId);

  if (error) {
    console.error('Failed to set parent agency:', error);
    return false;
  }

  return true;
}

/**
 * Count total agencies in hierarchy
 */
export async function countHierarchyAgencies(rootId: string): Promise<number> {
  const children = await getChildAgencies(rootId);
  let count = 1; // Include root

  for (const child of children) {
    count += await countHierarchyAgencies(child.agencyId);
  }

  return count;
}
