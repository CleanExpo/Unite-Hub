/**
 * Unified Memory Spine
 * Phase 121: Connects all memory sources into unified graph
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface SpineLink {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkMetadata: Record<string, unknown>;
  tenantId: string | null;
  createdAt: string;
}

export async function getLinks(
  sourceType?: string,
  tenantId?: string
): Promise<SpineLink[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('memory_spine_links')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (sourceType) query = query.eq('source_type', sourceType);
  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    targetType: row.target_type,
    targetId: row.target_id,
    linkMetadata: row.link_metadata,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
  }));
}

export async function createLink(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
  tenantId?: string
): Promise<SpineLink | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('memory_spine_links')
    .insert({
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      link_metadata: metadata,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    sourceType: data.source_type,
    sourceId: data.source_id,
    targetType: data.target_type,
    targetId: data.target_id,
    linkMetadata: data.link_metadata,
    tenantId: data.tenant_id,
    createdAt: data.created_at,
  };
}
