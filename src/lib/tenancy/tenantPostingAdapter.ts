/**
 * Tenant Posting Adapter
 * Phase 90: Tenant-scoped posting operations
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Get tenant's social tokens
 */
export async function getTenantTokens(tenantId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('provider', ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube']);

  if (error) {
    console.error('Failed to get tenant tokens:', error);
    return [];
  }

  return data || [];
}

/**
 * Post content for tenant
 */
export async function postForTenant(
  tenantId: string,
  channel: string,
  payload: {
    content: string;
    mediaUrls?: string[];
    scheduledAt?: string;
  }
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_engine_posts')
    .insert({
      tenant_id: tenantId,
      channel,
      content: payload.content,
      media_urls: payload.mediaUrls || [],
      scheduled_at: payload.scheduledAt,
      status: payload.scheduledAt ? 'scheduled' : 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data;
}

/**
 * Get tenant's posting queue
 */
export async function getTenantPostingQueue(tenantId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_engine_posts')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['scheduled', 'pending'])
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Failed to get posting queue:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant's recent posts
 */
export async function getTenantRecentPosts(
  tenantId: string,
  limit: number = 20
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_engine_posts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get recent posts:', error);
    return [];
  }

  return data || [];
}
