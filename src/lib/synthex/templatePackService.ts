/**
 * Synthex Template Pack Service
 *
 * Provides template pack management for reusable email, campaign,
 * automation, and segment templates across businesses.
 *
 * Phase: B24 - Template Packs & Cross-Business Playbooks
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { anthropic } from '@/lib/anthropic/client';

// =============================================================================
// Types
// =============================================================================

export type TemplatePackVisibility = 'private' | 'shared' | 'global';
export type TemplatePackCategory = 'welcome' | 'promo' | 'drip' | 'seo' | 'nurture' | 're-engagement' | 'event' | 'other';
export type TemplateType = 'email' | 'campaign' | 'automation' | 'segment' | 'prompt' | 'form' | 'landing_page';

export interface TemplatePack {
  id: string;
  ownerTenantId: string | null;
  name: string;
  description: string | null;
  category: TemplatePackCategory;
  visibility: TemplatePackVisibility;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  packId: string;
  type: TemplateType;
  name: string;
  description: string | null;
  content: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateUsage {
  id: string;
  tenantId: string;
  templateId: string;
  usedAt: string;
  context: Record<string, any>;
}

export interface TemplatePackInput {
  name: string;
  description?: string;
  category: TemplatePackCategory;
  visibility?: TemplatePackVisibility;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateInput {
  type: TemplateType;
  name: string;
  description?: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CloneOptions {
  customizations?: {
    name?: string;
    description?: string;
    content?: Record<string, any>;
  };
  aiAdaptation?: {
    targetAudience?: string;
    brandVoice?: string;
    industry?: string;
  };
}

// =============================================================================
// Template Pack CRUD
// =============================================================================

/**
 * Create or update a template pack
 */
export async function createOrUpdatePack(
  tenantId: string,
  packData: TemplatePackInput,
  packId?: string
): Promise<TemplatePack> {
  const dbData = {
    owner_tenant_id: tenantId,
    name: packData.name,
    description: packData.description || null,
    category: packData.category,
    visibility: packData.visibility || 'private',
    tags: packData.tags || [],
    metadata: packData.metadata || {},
  };

  if (packId) {
    // Update existing pack
    const { data, error } = await supabaseAdmin
      .from('synthex_template_packs')
      .update(dbData)
      .eq('id', packId)
      .eq('owner_tenant_id', tenantId)
      .select()
      .single();

    if (error) {
throw new Error(`Failed to update pack: ${error.message}`);
}
    return mapPackFromDb(data);
  } else {
    // Create new pack
    const { data, error } = await supabaseAdmin
      .from('synthex_template_packs')
      .insert(dbData)
      .select()
      .single();

    if (error) {
throw new Error(`Failed to create pack: ${error.message}`);
}
    return mapPackFromDb(data);
  }
}

/**
 * Add a template to a pack
 */
export async function addTemplateToPack(
  packId: string,
  templateData: TemplateInput
): Promise<Template> {
  const dbData = {
    pack_id: packId,
    type: templateData.type,
    name: templateData.name,
    description: templateData.description || null,
    content: templateData.content,
    metadata: templateData.metadata || {},
  };

  const { data, error } = await supabaseAdmin
    .from('synthex_templates')
    .insert(dbData)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to add template: ${error.message}`);
}
  return mapTemplateFromDb(data);
}

/**
 * List all available template packs for a tenant
 * Includes: global, shared, and their own private packs
 */
export async function listAvailablePacks(
  tenantId: string,
  filters?: {
    category?: TemplatePackCategory;
    visibility?: TemplatePackVisibility;
    tags?: string[];
  }
): Promise<TemplatePack[]> {
  let query = supabaseAdmin
    .from('synthex_template_packs')
    .select('*')
    .or(`visibility.eq.global,visibility.eq.shared,owner_tenant_id.eq.${tenantId}`)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list packs: ${error.message}`);
}
  return (data || []).map(mapPackFromDb);
}

/**
 * Get a single template pack by ID
 */
export async function getPackById(packId: string): Promise<TemplatePack | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_template_packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
} // Not found
    throw new Error(`Failed to get pack: ${error.message}`);
  }

  return mapPackFromDb(data);
}

/**
 * Delete a template pack (must be owner)
 */
export async function deletePack(packId: string, tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_template_packs')
    .delete()
    .eq('id', packId)
    .eq('owner_tenant_id', tenantId);

  if (error) {
throw new Error(`Failed to delete pack: ${error.message}`);
}
}

// =============================================================================
// Template CRUD
// =============================================================================

/**
 * List all templates in a pack
 */
export async function listTemplatesInPack(
  packId: string,
  filters?: {
    type?: TemplateType;
  }
): Promise<Template[]> {
  let query = supabaseAdmin
    .from('synthex_templates')
    .select('*')
    .eq('pack_id', packId)
    .order('created_at', { ascending: false });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return (data || []).map(mapTemplateFromDb);
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
} // Not found
    throw new Error(`Failed to get template: ${error.message}`);
  }

  return mapTemplateFromDb(data);
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<TemplateInput>
): Promise<Template> {
  const dbData: any = {};

  if (updates.name !== undefined) {
dbData.name = updates.name;
}
  if (updates.description !== undefined) {
dbData.description = updates.description;
}
  if (updates.content !== undefined) {
dbData.content = updates.content;
}
  if (updates.metadata !== undefined) {
dbData.metadata = updates.metadata;
}

  const { data, error } = await supabaseAdmin
    .from('synthex_templates')
    .update(dbData)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update template: ${error.message}`);
}
  return mapTemplateFromDb(data);
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
throw new Error(`Failed to delete template: ${error.message}`);
}
}

// =============================================================================
// Template Cloning & AI Adaptation
// =============================================================================

/**
 * Clone a template to a tenant's private pack with optional AI adaptation
 */
export async function cloneTemplateToTenant(
  templateId: string,
  tenantId: string,
  options: CloneOptions = {}
): Promise<Template> {
  // Use database function for basic cloning
  const customizationsJson = options.customizations || {};

  const { data, error } = await supabaseAdmin
    .rpc('clone_template_to_tenant', {
      p_template_id: templateId,
      p_target_tenant_id: tenantId,
      p_customizations: customizationsJson,
    });

  if (error) {
throw new Error(`Failed to clone template: ${error.message}`);
}

  const clonedTemplateId = data;

  // If AI adaptation requested, enhance the cloned template
  if (options.aiAdaptation) {
    const template = await getTemplateById(clonedTemplateId);
    if (!template) {
throw new Error('Cloned template not found');
}

    const adaptedContent = await adaptTemplateWithAI(
      template,
      options.aiAdaptation
    );

    return await updateTemplate(clonedTemplateId, {
      content: adaptedContent,
    });
  }

  // Return the cloned template
  const template = await getTemplateById(clonedTemplateId);
  if (!template) {
throw new Error('Cloned template not found');
}

  return template;
}

/**
 * Use AI to adapt a template to specific brand/audience/industry
 */
async function adaptTemplateWithAI(
  template: Template,
  adaptation: {
    targetAudience?: string;
    brandVoice?: string;
    industry?: string;
  }
): Promise<Record<string, any>> {
  try {
    // Build adaptation prompt
    const prompt = buildAdaptationPrompt(template, adaptation);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const adaptedText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse AI response and merge with original content
    const adaptedContent = parseAdaptedContent(adaptedText, template.content);

    return adaptedContent;
  } catch (error) {
    console.error('AI adaptation failed, returning original content:', error);
    // Gracefully fall back to original content if AI fails
    return template.content;
  }
}

/**
 * Build AI prompt for template adaptation
 */
function buildAdaptationPrompt(
  template: Template,
  adaptation: {
    targetAudience?: string;
    brandVoice?: string;
    industry?: string;
  }
): string {
  const originalContent = JSON.stringify(template.content, null, 2);

  return `You are a marketing template adaptation expert. Adapt the following template to match the specified requirements while preserving its structure and variable placeholders.

**Original Template:**
Type: ${template.type}
Name: ${template.name}
Content:
${originalContent}

**Adaptation Requirements:**
${adaptation.targetAudience ? `- Target Audience: ${adaptation.targetAudience}` : ''}
${adaptation.brandVoice ? `- Brand Voice: ${adaptation.brandVoice}` : ''}
${adaptation.industry ? `- Industry: ${adaptation.industry}` : ''}

**Instructions:**
1. Maintain ALL variable placeholders (e.g., {{first_name}}, {{company_name}})
2. Preserve the JSON structure
3. Adapt the copy/messaging to fit the target audience, brand voice, and industry
4. Keep the same email structure (subject, preheader, body)
5. Return ONLY the adapted JSON content, no explanations

Adapted Content (JSON):`;
}

/**
 * Parse AI-adapted content
 */
function parseAdaptedContent(
  aiResponse: string,
  originalContent: Record<string, any>
): Record<string, any> {
  try {
    // Extract JSON from AI response (may have markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Merge with original to ensure no fields are lost
    return {
      ...originalContent,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to parse AI response, returning original:', error);
    return originalContent;
  }
}

// =============================================================================
// Template Usage Tracking
// =============================================================================

/**
 * Record template usage
 */
export async function recordTemplateUsage(
  tenantId: string,
  templateId: string,
  context: Record<string, any> = {}
): Promise<TemplateUsage> {
  const { data, error } = await supabaseAdmin
    .from('synthex_template_usage')
    .insert({
      tenant_id: tenantId,
      template_id: templateId,
      context,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record usage: ${error.message}`);
}
  return mapUsageFromDb(data);
}

/**
 * Get usage stats for a template
 */
export async function getTemplateUsageStats(
  templateId: string
): Promise<{
  totalUsage: number;
  uniqueTenants: number;
  recentUsage: TemplateUsage[];
}> {
  // Total usage count
  const { count: totalUsage, error: countError } = await supabaseAdmin
    .from('synthex_template_usage')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', templateId);

  if (countError) {
throw new Error(`Failed to count usage: ${countError.message}`);
}

  // Unique tenants
  const { data: uniqueData, error: uniqueError } = await supabaseAdmin
    .from('synthex_template_usage')
    .select('tenant_id')
    .eq('template_id', templateId);

  if (uniqueError) {
throw new Error(`Failed to count unique tenants: ${uniqueError.message}`);
}

  const uniqueTenants = new Set(uniqueData?.map(u => u.tenant_id) || []).size;

  // Recent usage (last 10)
  const { data: recentData, error: recentError } = await supabaseAdmin
    .from('synthex_template_usage')
    .select('*')
    .eq('template_id', templateId)
    .order('used_at', { ascending: false })
    .limit(10);

  if (recentError) {
throw new Error(`Failed to fetch recent usage: ${recentError.message}`);
}

  return {
    totalUsage: totalUsage || 0,
    uniqueTenants,
    recentUsage: (recentData || []).map(mapUsageFromDb),
  };
}

// =============================================================================
// Mapping Functions
// =============================================================================

function mapPackFromDb(row: any): TemplatePack {
  return {
    id: row.id,
    ownerTenantId: row.owner_tenant_id,
    name: row.name,
    description: row.description,
    category: row.category,
    visibility: row.visibility,
    tags: row.tags || [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplateFromDb(row: any): Template {
  return {
    id: row.id,
    packId: row.pack_id,
    type: row.type,
    name: row.name,
    description: row.description,
    content: row.content || {},
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUsageFromDb(row: any): TemplateUsage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    templateId: row.template_id,
    usedAt: row.used_at,
    context: row.context || {},
  };
}
