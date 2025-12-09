/**
 * Synthex Template Marketplace Service
 * Phase B34: Template Marketplace for Campaigns, Content, and Automations
 *
 * Provides reusable templates for emails, campaigns, automations, journeys,
 * prompts, and landing pages that can be shared across tenants.
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// Lazy-loaded Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('Anthropic client initialized for template service');
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export type TemplateScope = 'global' | 'agency' | 'tenant';
export type TemplateType = 'email' | 'campaign' | 'automation' | 'journey' | 'prompt' | 'landing_page';

export interface Template {
  id: string;
  tenant_id?: string;
  scope: TemplateScope;
  type: TemplateType;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  content: Record<string, unknown>;
  preview_image_url?: string;
  is_public: boolean;
  is_featured: boolean;
  created_by: string;
  version: number;
  parent_template_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Stats (populated separately)
  avg_rating?: number;
  rating_count?: number;
  usage_count?: number;
}

export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  feedback?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateUsage {
  id: string;
  template_id: string;
  tenant_id: string;
  user_id: string;
  action: 'view' | 'clone' | 'use' | 'favorite';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TemplateListContext {
  tenantId?: string;
  userId?: string;
  scope?: TemplateScope;
  type?: TemplateType;
  category?: string;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  onlyMine?: boolean;
  limit?: number;
  offset?: number;
}

export interface TemplateStats {
  template_id: string;
  avg_rating: number;
  rating_count: number;
  usage_count: number;
  clone_count: number;
}

export interface AIImprovementSuggestion {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  implementation_hint?: string;
}

// =====================================================
// Template CRUD
// =====================================================

/**
 * List templates with filters
 */
export async function listTemplates(context: TemplateListContext): Promise<Template[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_templates')
    .select('*')
    .order('created_at', { ascending: false });

  // Scope filter
  if (context.scope) {
    query = query.eq('scope', context.scope);
  }

  // Type filter
  if (context.type) {
    query = query.eq('type', context.type);
  }

  // Category filter
  if (context.category) {
    query = query.eq('category', context.category);
  }

  // Public filter
  if (context.isPublic !== undefined) {
    query = query.eq('is_public', context.isPublic);
  }

  // Featured filter
  if (context.isFeatured) {
    query = query.eq('is_featured', true);
  }

  // Only user's templates
  if (context.onlyMine && context.userId) {
    query = query.eq('created_by', context.userId);
  }

  // Tenant filter for tenant-scoped templates
  if (context.tenantId) {
    query = query.or(`tenant_id.eq.${context.tenantId},scope.eq.global`);
  }

  // Tags filter (contains any)
  if (context.tags && context.tags.length > 0) {
    query = query.overlaps('tags', context.tags);
  }

  // Search filter
  if (context.search) {
    query = query.or(`name.ilike.%${context.search}%,description.ilike.%${context.search}%`);
  }

  // Pagination
  if (context.limit) {
    query = query.limit(context.limit);
  }
  if (context.offset) {
    query = query.range(context.offset, context.offset + (context.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single template by ID
 */
export async function getTemplate(
  templateId: string,
  tenantContext?: string
): Promise<Template | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get template: ${error.message}`);
  }

  // Access check
  if (data.scope === 'tenant' && data.tenant_id !== tenantContext && !data.is_public) {
    return null; // Not accessible
  }

  return data;
}

/**
 * Get template with stats
 */
export async function getTemplateWithStats(templateId: string): Promise<Template & TemplateStats> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const supabase = supabaseAdmin;

  const { data: stats } = await supabase.rpc('get_template_with_stats', {
    p_template_id: templateId,
  });

  const templateStats = stats?.[0] || {
    avg_rating: 0,
    rating_count: 0,
    usage_count: 0,
    clone_count: 0,
  };

  return {
    ...template,
    ...templateStats,
  };
}

/**
 * Create a new template
 */
export async function createTemplate(
  payload: {
    name: string;
    type: TemplateType;
    content: Record<string, unknown>;
    description?: string;
    category?: string;
    tags?: string[];
    scope?: TemplateScope;
    is_public?: boolean;
    preview_image_url?: string;
    metadata?: Record<string, unknown>;
  },
  tenantContext: {
    tenantId?: string;
    userId: string;
  }
): Promise<Template> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_templates')
    .insert({
      tenant_id: payload.scope === 'tenant' ? tenantContext.tenantId : null,
      scope: payload.scope || 'tenant',
      type: payload.type,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      tags: payload.tags || [],
      content: payload.content,
      preview_image_url: payload.preview_image_url,
      is_public: payload.is_public || false,
      is_featured: false,
      created_by: tenantContext.userId,
      version: 1,
      metadata: payload.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return data;
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<{
    name: string;
    description: string;
    category: string;
    tags: string[];
    content: Record<string, unknown>;
    is_public: boolean;
    preview_image_url: string;
    metadata: Record<string, unknown>;
  }>,
  userId: string
): Promise<Template> {
  const supabase = supabaseAdmin;

  // Verify ownership
  const existing = await getTemplate(templateId);
  if (!existing || existing.created_by !== userId) {
    throw new Error('Template not found or access denied');
  }

  const { data, error } = await supabase
    .from('synthex_templates')
    .update({
      ...updates,
      version: existing.version + 1,
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return data;
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string, userId: string): Promise<void> {
  const supabase = supabaseAdmin;

  // Verify ownership
  const existing = await getTemplate(templateId);
  if (!existing || existing.created_by !== userId) {
    throw new Error('Template not found or access denied');
  }

  const { error } = await supabase
    .from('synthex_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}

// =====================================================
// Template Operations
// =====================================================

/**
 * Clone a template to a tenant
 */
export async function cloneTemplateToTenant(
  templateId: string,
  tenantId: string,
  userId: string,
  customizations?: {
    name?: string;
    content?: Record<string, unknown>;
  }
): Promise<Template> {
  const original = await getTemplate(templateId);
  if (!original) {
    throw new Error('Template not found');
  }

  // Record usage
  await recordTemplateUsage(templateId, tenantId, userId, 'clone');

  // Create cloned template
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_templates')
    .insert({
      tenant_id: tenantId,
      scope: 'tenant',
      type: original.type,
      name: customizations?.name || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      tags: original.tags,
      content: customizations?.content || original.content,
      preview_image_url: original.preview_image_url,
      is_public: false,
      is_featured: false,
      created_by: userId,
      version: 1,
      parent_template_id: templateId,
      metadata: {
        ...original.metadata,
        cloned_from: templateId,
        cloned_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to clone template: ${error.message}`);
  }

  return data;
}

/**
 * Generate a template from an existing campaign
 */
export async function generateTemplateFromExistingCampaign(
  campaignId: string,
  tenantId: string,
  userId: string,
  options?: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
  }
): Promise<Template> {
  const supabase = supabaseAdmin;

  // Fetch the campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('synthex_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }

  // Extract template content from campaign
  const templateContent = {
    campaign_type: campaign.type,
    subject: campaign.subject,
    content: campaign.content,
    settings: campaign.settings || {},
    schedule: campaign.schedule_config || {},
    // Anonymize any specific data
    variables: extractVariables(campaign.content || ''),
  };

  // Create the template
  return createTemplate(
    {
      name: options?.name || `Template from: ${campaign.name}`,
      type: 'campaign',
      description: options?.description || `Generated from campaign "${campaign.name}"`,
      category: options?.category || 'generated',
      content: templateContent,
      tags: ['generated', 'campaign'],
      scope: options?.isPublic ? 'global' : 'tenant',
      is_public: options?.isPublic || false,
      metadata: {
        source_campaign_id: campaignId,
        generated_at: new Date().toISOString(),
      },
    },
    { tenantId, userId }
  );
}

/**
 * Extract variable placeholders from content
 */
function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = content.match(regex) || [];
  const variables = matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim());
  return [...new Set(variables)];
}

// =====================================================
// Ratings
// =====================================================

/**
 * Rate a template
 */
export async function rateTemplate(
  templateId: string,
  userId: string,
  rating: number,
  feedback?: string
): Promise<TemplateRating> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_template_ratings')
    .upsert(
      {
        template_id: templateId,
        user_id: userId,
        rating,
        feedback,
      },
      {
        onConflict: 'template_id,user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to rate template: ${error.message}`);
  }

  return data;
}

/**
 * Get ratings for a template
 */
export async function getTemplateRatings(
  templateId: string,
  limit: number = 10
): Promise<TemplateRating[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_template_ratings')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get ratings: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Usage Tracking
// =====================================================

/**
 * Record template usage
 */
export async function recordTemplateUsage(
  templateId: string,
  tenantId: string,
  userId: string,
  action: 'view' | 'clone' | 'use' | 'favorite',
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = supabaseAdmin;

  const { error } = await supabase.from('synthex_template_usage').insert({
    template_id: templateId,
    tenant_id: tenantId,
    user_id: userId,
    action,
    metadata: metadata || {},
  });

  if (error) {
    console.error('Failed to record template usage:', error);
    // Don't throw - usage tracking shouldn't break main flow
  }
}

/**
 * Get popular templates
 */
export async function getPopularTemplates(
  type?: TemplateType,
  category?: string,
  limit: number = 10
): Promise<Template[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase.rpc('get_popular_templates', {
    p_type: type || null,
    p_category: category || null,
    p_limit: limit,
  });

  if (error) {
    console.error('Failed to get popular templates:', error);
    // Fall back to simple query
    return listTemplates({
      isPublic: true,
      scope: 'global',
      type,
      category,
      limit,
    });
  }

  return data || [];
}

// =====================================================
// AI Features
// =====================================================

/**
 * Get AI suggestions for improving a template
 */
export async function suggestTemplateImprovements(
  templateId: string
): Promise<AIImprovementSuggestion[]> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const anthropic = getAnthropicClient();

  const prompt = `Analyze this ${template.type} template and suggest improvements:

Name: ${template.name}
Description: ${template.description || 'None'}
Category: ${template.category || 'Uncategorized'}
Tags: ${template.tags.join(', ') || 'None'}
Content: ${JSON.stringify(template.content, null, 2)}

Provide 3-5 specific, actionable suggestions to improve this template. Focus on:
1. Effectiveness (will it achieve its goal?)
2. Best practices for ${template.type} templates
3. User experience and clarity
4. Missing elements or opportunities
5. Tag and categorization improvements

Format each suggestion as JSON:
{
  "category": "string (e.g., 'content', 'structure', 'personalization', 'best_practice', 'seo')",
  "suggestion": "string (the improvement suggestion)",
  "priority": "high|medium|low",
  "implementation_hint": "string (optional, how to implement)"
}

Return ONLY a JSON array of suggestions, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return [];
  }

  try {
    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIImprovementSuggestion[];
    }
    return [];
  } catch {
    console.error('Failed to parse AI suggestions');
    return [];
  }
}

/**
 * Auto-generate tags for a template using AI
 */
export async function autoGenerateTags(templateId: string): Promise<string[]> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const anthropic = getAnthropicClient();

  const prompt = `Generate relevant tags for this ${template.type} template.

Name: ${template.name}
Description: ${template.description || 'None'}
Category: ${template.category || 'None'}
Content preview: ${JSON.stringify(template.content).slice(0, 500)}

Return 5-10 relevant tags as a JSON array of strings. Tags should be:
- Lowercase
- Single words or short hyphenated phrases
- Relevant to the template's purpose and content
- Useful for search and categorization

Return ONLY a JSON array, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return [];
  }

  try {
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as string[];
    }
    return [];
  } catch {
    return [];
  }
}

// =====================================================
// Categories
// =====================================================

/**
 * Get all template categories
 */
export async function getTemplateCategories(): Promise<string[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_templates')
    .select('category')
    .not('category', 'is', null)
    .eq('is_public', true);

  if (error) {
    throw new Error(`Failed to get categories: ${error.message}`);
  }

  const categories = [...new Set((data || []).map((t: { category: string }) => t.category))];
  return categories.filter(Boolean).sort();
}

/**
 * Get template type counts
 */
export async function getTemplateTypeCounts(): Promise<Record<TemplateType, number>> {
  const supabase = supabaseAdmin;

  const types: TemplateType[] = ['email', 'campaign', 'automation', 'journey', 'prompt', 'landing_page'];
  const counts: Record<TemplateType, number> = {} as Record<TemplateType, number>;

  for (const type of types) {
    const { count } = await supabase
      .from('synthex_templates')
      .select('*', { count: 'exact', head: true })
      .eq('type', type)
      .eq('is_public', true);

    counts[type] = count || 0;
  }

  return counts;
}
