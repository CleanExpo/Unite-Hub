/**
 * Content Service Layer
 *
 * Encapsulates all database operations for synthex_content table.
 * Used by API routes for content library functionality.
 *
 * Phase: B3 - Synthex Content Library
 *
 * @deprecated MIGRATING TO STANDALONE SYNTHEX
 * This service is being extracted to: github.com/CleanExpo/Synthex
 * New location: lib/services/content/contentService.ts
 *
 * DO NOT add new features here. All new development should happen in Synthex repo.
 * This file will be removed once Unite-Hub fully delegates to Synthex via webhooks.
 *
 * Migration date: 2026-01-24
 * Target removal: After Synthex V1 launch
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type ContentType = 'email' | 'blog' | 'social' | 'image' | 'landing_page' | 'ad_copy' | 'other';
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'archived';

export interface SynthexContent {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  content_markdown: string | null;
  content_html: string | null;
  content_plain: string | null;
  tags: string[] | null;
  category: string | null;
  prompt_used: string | null;
  model_version: string | null;
  generation_params: Record<string, unknown> | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  published_at: string | null;
  publish_url: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContentParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  title: string;
  type: ContentType;
  status?: ContentStatus;
  contentMarkdown?: string | null;
  contentHtml?: string | null;
  contentPlain?: string | null;
  tags?: string[] | null;
  category?: string | null;
  promptUsed?: string | null;
  modelVersion?: string | null;
  generationParams?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

export interface ListContentParams {
  tenantId: string;
  brandId?: string | null;
  type?: ContentType;
  status?: ContentStatus;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ListContentResult {
  content: SynthexContent[];
  total: number;
  hasMore: boolean;
}

export interface ContentStats {
  total: number;
  pending_review: number;
  approved: number;
  published: number;
  by_type: Record<ContentType, number>;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create new content
 */
export async function createContent(params: CreateContentParams): Promise<SynthexContent> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: params.tenantId,
    brand_id: params.brandId || null,
    user_id: params.userId,
    title: params.title,
    type: params.type,
    status: params.status || 'draft',
    content_markdown: params.contentMarkdown || null,
    content_html: params.contentHtml || null,
    content_plain: params.contentPlain || null,
    tags: params.tags || null,
    category: params.category || null,
    prompt_used: params.promptUsed || null,
    model_version: params.modelVersion || null,
    generation_params: params.generationParams ? JSON.stringify(params.generationParams) : null,
    meta: params.meta ? JSON.stringify(params.meta) : null,
  };

  const { data, error } = await supabase
    .from('synthex_content')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[contentService] Failed to create content:', error);
    throw new Error(`Failed to create content: ${error.message}`);
  }

  return parseContentRow(data);
}

/**
 * List content with filters and pagination
 */
export async function listContent(params: ListContentParams): Promise<ListContentResult> {
  const { tenantId, brandId, type, status, tags, limit = 20, offset = 0 } = params;

  const supabase = await createClient();

  let query = supabase
    .from('synthex_content')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[contentService] Failed to list content:', error);
    throw new Error(`Failed to list content: ${error.message}`);
  }

  const content = (data || []).map(parseContentRow);
  const total = count || 0;
  const hasMore = offset + content.length < total;

  return { content, total, hasMore };
}

/**
 * Get a single content item by ID
 */
export async function getContentById(contentId: string, tenantId: string): Promise<SynthexContent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_content')
    .select('*')
    .eq('id', contentId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[contentService] Failed to get content:', error);
    throw new Error(`Failed to get content: ${error.message}`);
  }

  return data ? parseContentRow(data) : null;
}

/**
 * Update content
 */
export async function updateContent(
  contentId: string,
  tenantId: string,
  updates: Partial<CreateContentParams>
): Promise<SynthexContent> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) {
updateData.title = updates.title;
}
  if (updates.type !== undefined) {
updateData.type = updates.type;
}
  if (updates.status !== undefined) {
updateData.status = updates.status;
}
  if (updates.contentMarkdown !== undefined) {
updateData.content_markdown = updates.contentMarkdown;
}
  if (updates.contentHtml !== undefined) {
updateData.content_html = updates.contentHtml;
}
  if (updates.contentPlain !== undefined) {
updateData.content_plain = updates.contentPlain;
}
  if (updates.tags !== undefined) {
updateData.tags = updates.tags;
}
  if (updates.category !== undefined) {
updateData.category = updates.category;
}
  if (updates.meta !== undefined) {
updateData.meta = updates.meta ? JSON.stringify(updates.meta) : null;
}

  const { data, error } = await supabase
    .from('synthex_content')
    .update(updateData)
    .eq('id', contentId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[contentService] Failed to update content:', error);
    throw new Error(`Failed to update content: ${error.message}`);
  }

  return parseContentRow(data);
}

/**
 * Update content status (for approval workflow)
 */
export async function updateContentStatus(
  contentId: string,
  tenantId: string,
  status: ContentStatus,
  reviewerId?: string,
  reviewNotes?: string
): Promise<SynthexContent> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'approved' || status === 'rejected') {
    updateData.reviewed_by = reviewerId || null;
    updateData.reviewed_at = new Date().toISOString();
    updateData.review_notes = reviewNotes || null;
  }

  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('synthex_content')
    .update(updateData)
    .eq('id', contentId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[contentService] Failed to update content status:', error);
    throw new Error(`Failed to update content status: ${error.message}`);
  }

  return parseContentRow(data);
}

/**
 * Delete content
 */
export async function deleteContent(contentId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('synthex_content')
    .delete({ count: 'exact' })
    .eq('id', contentId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[contentService] Failed to delete content:', error);
    throw new Error(`Failed to delete content: ${error.message}`);
  }

  return (count || 0) > 0;
}

/**
 * Get content stats for a tenant
 */
export async function getContentStats(tenantId: string, brandId?: string): Promise<ContentStats> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_content')
    .select('status, type')
    .eq('tenant_id', tenantId);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[contentService] Failed to get content stats:', error);
    throw new Error(`Failed to get content stats: ${error.message}`);
  }

  const stats: ContentStats = {
    total: 0,
    pending_review: 0,
    approved: 0,
    published: 0,
    by_type: {
      email: 0,
      blog: 0,
      social: 0,
      image: 0,
      landing_page: 0,
      ad_copy: 0,
      other: 0,
    },
  };

  for (const row of data || []) {
    stats.total++;

    if (row.status === 'pending_review') {
stats.pending_review++;
}
    if (row.status === 'approved') {
stats.approved++;
}
    if (row.status === 'published') {
stats.published++;
}

    if (row.type in stats.by_type) {
      stats.by_type[row.type as ContentType]++;
    }
  }

  return stats;
}

// ============================================================================
// Helpers
// ============================================================================

function parseContentRow(row: Record<string, unknown>): SynthexContent {
  return {
    ...row,
    generation_params: row.generation_params
      ? typeof row.generation_params === 'string'
        ? JSON.parse(row.generation_params)
        : row.generation_params
      : null,
    meta: row.meta
      ? typeof row.meta === 'string'
        ? JSON.parse(row.meta)
        : row.meta
      : null,
  } as SynthexContent;
}
