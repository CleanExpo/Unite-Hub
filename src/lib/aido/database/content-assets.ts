/**
 * AIDO Content Assets Database Access Layer
 * Algorithmic immunity content management
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ContentAsset {
  id: string;
  client_id: string;
  workspace_id: string;
  topic_id: string | null;
  intent_cluster_id: string | null;
  type: string;
  format: string;
  title: string;
  slug: string;
  summary: string | null;
  body_markdown: string | null;
  qa_blocks: Array<{ question: string; answer: string }>;
  schema_types: string[];
  media_assets: Array<{ type: string; url: string; alt?: string }>;
  localisation_tags: string[];
  authority_score: number;
  evergreen_score: number;
  ai_source_score: number;
  status: string;
  published_at: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentAssetInput {
  clientId: string;
  workspaceId: string;
  topicId?: string;
  intentClusterId?: string;
  type: string;
  format: string;
  title: string;
  slug: string;
  summary?: string;
  bodyMarkdown?: string;
  qaBlocks?: Array<{ question: string; answer: string }>;
  schemaTypes?: string[];
  mediaAssets?: Array<{ type: string; url: string; alt?: string }>;
  localisationTags?: string[];
  authorityScore?: number;
  evergreenScore?: number;
  aiSourceScore?: number;
  status?: string;
}

/**
 * Create a new content asset
 */
export async function createContentAsset(data: ContentAssetInput): Promise<ContentAsset> {
  const supabase = await getSupabaseServer();

  const { data: asset, error } = await supabase
    .from('content_assets')
    .insert({
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      topic_id: data.topicId || null,
      intent_cluster_id: data.intentClusterId || null,
      type: data.type,
      format: data.format,
      title: data.title,
      slug: data.slug,
      summary: data.summary || null,
      body_markdown: data.bodyMarkdown || null,
      qa_blocks: data.qaBlocks || [],
      schema_types: data.schemaTypes || [],
      media_assets: data.mediaAssets || [],
      localisation_tags: data.localisationTags || [],
      authority_score: data.authorityScore || 0.5,
      evergreen_score: data.evergreenScore || 0.5,
      ai_source_score: data.aiSourceScore || 0.5,
      status: data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A content asset with this slug already exists for this client');
    }
    console.error('[AIDO] Failed to create content asset:', error);
    throw new Error(`Failed to create content asset: ${error.message}`);
  }

  return asset;
}

/**
 * Get all content assets for a workspace
 * Optionally filter by client, topic, or status
 */
export async function getContentAssets(
  workspaceId: string,
  filters?: { clientId?: string; topicId?: string; status?: string }
): Promise<ContentAsset[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('content_assets')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.topicId) {
    query = query.eq('topic_id', filters.topicId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('ai_source_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch content assets:', error);
    throw new Error(`Failed to fetch content assets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single content asset by ID
 */
export async function getContentAsset(id: string, workspaceId: string): Promise<ContentAsset> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_assets')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Content asset not found or access denied');
    }
    console.error('[AIDO] Failed to fetch content asset:', error);
    throw new Error(`Failed to fetch content asset: ${error.message}`);
  }

  return data;
}

/**
 * Update a content asset
 */
export async function updateContentAsset(
  id: string,
  workspaceId: string,
  updates: Partial<Omit<ContentAssetInput, 'clientId' | 'workspaceId'>>
): Promise<ContentAsset> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.topicId !== undefined) updateData.topic_id = updates.topicId;
  if (updates.intentClusterId !== undefined) updateData.intent_cluster_id = updates.intentClusterId;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.format !== undefined) updateData.format = updates.format;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.summary !== undefined) updateData.summary = updates.summary;
  if (updates.bodyMarkdown !== undefined) updateData.body_markdown = updates.bodyMarkdown;
  if (updates.qaBlocks !== undefined) updateData.qa_blocks = updates.qaBlocks;
  if (updates.schemaTypes !== undefined) updateData.schema_types = updates.schemaTypes;
  if (updates.mediaAssets !== undefined) updateData.media_assets = updates.mediaAssets;
  if (updates.localisationTags !== undefined) updateData.localisation_tags = updates.localisationTags;
  if (updates.authorityScore !== undefined) updateData.authority_score = updates.authorityScore;
  if (updates.evergreenScore !== undefined) updateData.evergreen_score = updates.evergreenScore;
  if (updates.aiSourceScore !== undefined) updateData.ai_source_score = updates.aiSourceScore;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('content_assets')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Content asset not found or access denied');
    }
    if (error.code === '23505') {
      throw new Error('A content asset with this slug already exists for this client');
    }
    console.error('[AIDO] Failed to update content asset:', error);
    throw new Error(`Failed to update content asset: ${error.message}`);
  }

  return data;
}

/**
 * Publish a content asset
 * Sets status to 'published' and records published_at timestamp
 */
export async function publishContentAsset(
  id: string,
  workspaceId: string
): Promise<ContentAsset> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_assets')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Content asset not found or access denied');
    }
    console.error('[AIDO] Failed to publish content asset:', error);
    throw new Error(`Failed to publish content asset: ${error.message}`);
  }

  return data;
}

/**
 * Delete a content asset
 */
export async function deleteContentAsset(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('content_assets')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete content asset:', error);
    throw new Error(`Failed to delete content asset: ${error.message}`);
  }
}

/**
 * Get high-quality content assets
 * AI source score >= 0.8
 */
export async function getHighQualityContentAssets(
  clientId: string,
  workspaceId: string
): Promise<ContentAsset[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .gte('ai_source_score', 0.8)
    .eq('status', 'published')
    .order('ai_source_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch high-quality content assets:', error);
    throw new Error(`Failed to fetch content assets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get content asset by slug
 */
export async function getContentAssetBySlug(
  clientId: string,
  slug: string,
  workspaceId: string
): Promise<ContentAsset | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[AIDO] Failed to fetch content asset by slug:', error);
    throw new Error(`Failed to fetch content asset: ${error.message}`);
  }

  return data;
}
