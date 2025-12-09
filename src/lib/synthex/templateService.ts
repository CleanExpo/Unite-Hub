/**
 * Synthex Template Service
 * Phase D04: Template Library
 *
 * Centralized template management with versioning,
 * variable extraction, and usage analytics.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/client';

// =====================================================
// Types
// =====================================================

export type TemplateType =
  | 'email'
  | 'sms'
  | 'social_post'
  | 'landing_page'
  | 'ad_copy'
  | 'blog_post'
  | 'product_description'
  | 'meta_description'
  | 'headline'
  | 'cta'
  | 'testimonial'
  | 'case_study'
  | 'custom';

export type TemplateStatus = 'draft' | 'active' | 'archived' | 'deprecated';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  default?: string;
  required: boolean;
  description?: string;
  options?: string[]; // For select type
}

export interface TemplateCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Template {
  id: string;
  tenant_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  template_type: TemplateType;
  content: string;
  content_html: string | null;
  preview_text: string | null;
  variables: TemplateVariable[];
  version: number;
  is_latest: boolean;
  usage_count: number;
  last_used_at: string | null;
  status: TemplateStatus;
  ai_generated: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TemplateUsage {
  id: string;
  tenant_id: string;
  template_id: string;
  used_by: string | null;
  used_at: string;
  context: string | null;
  context_id: string | null;
  variables_used: Record<string, string>;
  output_generated: string | null;
  success: boolean;
}

// =====================================================
// Category Operations
// =====================================================

export async function listCategories(
  tenantId: string
): Promise<TemplateCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
throw new Error(`Failed to list categories: ${error.message}`);
}
  return data || [];
}

export async function createCategory(
  tenantId: string,
  data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    color?: string;
    parent_id?: string;
  }
): Promise<TemplateCategory> {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

  const { data: category, error } = await supabaseAdmin
    .from('synthex_library_categories')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      color: data.color,
      parent_id: data.parent_id,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create category: ${error.message}`);
}
  return category;
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<TemplateCategory> {
  const { data: category, error } = await supabaseAdmin
    .from('synthex_library_categories')
    .update(data)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update category: ${error.message}`);
}
  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_library_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
throw new Error(`Failed to delete category: ${error.message}`);
}
}

// =====================================================
// Template Operations
// =====================================================

export async function listTemplates(
  tenantId: string,
  filters?: {
    category_id?: string;
    template_type?: TemplateType;
    status?: TemplateStatus;
    tags?: string[];
    search?: string;
    limit?: number;
  }
): Promise<Template[]> {
  let query = supabaseAdmin
    .from('synthex_library_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_latest', true);

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.template_type) {
    query = query.eq('template_type', filters.template_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  query = query
    .order('updated_at', { ascending: false })
    .limit(filters?.limit || 100);

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return data || [];
}

export async function getTemplate(templateId: string): Promise<Template | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get template: ${error.message}`);
  }
  return data;
}

export async function createTemplate(
  tenantId: string,
  data: {
    title: string;
    template_type: TemplateType;
    content: string;
    category_id?: string;
    description?: string;
    content_html?: string;
    variables?: TemplateVariable[];
    tags?: string[];
    status?: TemplateStatus;
    ai_generated?: boolean;
    ai_model?: string;
    ai_prompt?: string;
  },
  userId?: string
): Promise<Template> {
  const slug = data.title.toLowerCase().replace(/\s+/g, '-');

  // Extract variables if not provided
  const variables = data.variables || (await extractVariables(data.content));

  const { data: template, error } = await supabaseAdmin
    .from('synthex_library_templates')
    .insert({
      tenant_id: tenantId,
      title: data.title,
      slug,
      template_type: data.template_type,
      content: data.content,
      content_html: data.content_html,
      description: data.description,
      category_id: data.category_id,
      variables,
      tags: data.tags || [],
      status: data.status || 'draft',
      ai_generated: data.ai_generated || false,
      ai_model: data.ai_model,
      ai_prompt: data.ai_prompt,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create template: ${error.message}`);
}

  // Create initial version
  await supabaseAdmin.from('synthex_library_versions').insert({
    tenant_id: tenantId,
    template_id: template.id,
    version: 1,
    content: data.content,
    content_html: data.content_html,
    variables,
    change_notes: 'Initial version',
    created_by: userId,
  });

  return template;
}

export async function updateTemplate(
  templateId: string,
  data: Partial<{
    title: string;
    content: string;
    content_html: string;
    description: string;
    category_id: string;
    variables: TemplateVariable[];
    tags: string[];
    status: TemplateStatus;
  }>,
  userId?: string,
  createVersion = true
): Promise<Template> {
  // Get current template for versioning
  const current = await getTemplate(templateId);
  if (!current) {
throw new Error('Template not found');
}

  // If content changed and versioning requested, create new version
  if (createVersion && data.content && data.content !== current.content) {
    const newVersion = current.version + 1;

    // Mark current as not latest
    await supabaseAdmin
      .from('synthex_library_templates')
      .update({ is_latest: false })
      .eq('id', templateId);

    // Create new version record
    await supabaseAdmin.from('synthex_library_versions').insert({
      tenant_id: current.tenant_id,
      template_id: templateId,
      version: newVersion,
      content: data.content,
      content_html: data.content_html,
      variables: data.variables || current.variables,
      change_notes: 'Updated content',
      created_by: userId,
    });

    // Update template with new version
    const { data: template, error } = await supabaseAdmin
      .from('synthex_library_templates')
      .update({
        ...data,
        version: newVersion,
        is_latest: true,
        updated_by: userId,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
throw new Error(`Failed to update template: ${error.message}`);
}
    return template;
  }

  // Simple update without versioning
  const { data: template, error } = await supabaseAdmin
    .from('synthex_library_templates')
    .update({ ...data, updated_by: userId })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update template: ${error.message}`);
}
  return template;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_library_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
throw new Error(`Failed to delete template: ${error.message}`);
}
}

export async function duplicateTemplate(
  templateId: string,
  newTitle: string,
  userId?: string
): Promise<Template> {
  const original = await getTemplate(templateId);
  if (!original) {
throw new Error('Template not found');
}

  return createTemplate(
    original.tenant_id,
    {
      title: newTitle,
      template_type: original.template_type,
      content: original.content,
      content_html: original.content_html || undefined,
      description: original.description || undefined,
      category_id: original.category_id || undefined,
      variables: original.variables,
      tags: original.tags,
      status: 'draft',
    },
    userId
  );
}

// =====================================================
// Version Operations
// =====================================================

export async function getTemplateVersions(
  templateId: string
): Promise<
  Array<{
    id: string;
    version: number;
    content: string;
    change_notes: string | null;
    created_at: string;
  }>
> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_versions')
    .select('id, version, content, change_notes, created_at')
    .eq('template_id', templateId)
    .order('version', { ascending: false });

  if (error) {
throw new Error(`Failed to get versions: ${error.message}`);
}
  return data || [];
}

export async function restoreVersion(
  templateId: string,
  version: number,
  userId?: string
): Promise<Template> {
  const { data: versionData, error: versionError } = await supabaseAdmin
    .from('synthex_library_versions')
    .select('*')
    .eq('template_id', templateId)
    .eq('version', version)
    .single();

  if (versionError) {
throw new Error(`Version not found: ${versionError.message}`);
}

  return updateTemplate(
    templateId,
    {
      content: versionData.content,
      content_html: versionData.content_html,
      variables: versionData.variables,
    },
    userId,
    true
  );
}

// =====================================================
// Usage Tracking
// =====================================================

export async function trackUsage(
  tenantId: string,
  templateId: string,
  data: {
    used_by?: string;
    context?: string;
    context_id?: string;
    variables_used?: Record<string, string>;
    output_generated?: string;
    success?: boolean;
  }
): Promise<void> {
  await supabaseAdmin.from('synthex_library_usage').insert({
    tenant_id: tenantId,
    template_id: templateId,
    used_by: data.used_by,
    context: data.context,
    context_id: data.context_id,
    variables_used: data.variables_used || {},
    output_generated: data.output_generated,
    success: data.success ?? true,
  });

  // Increment usage count
  await supabaseAdmin.rpc('increment_template_usage', {
    p_template_id: templateId,
  });
}

export async function getUsageStats(
  tenantId: string,
  templateId?: string
): Promise<{
  total_uses: number;
  success_rate: number;
  top_templates: Array<{ template_id: string; title: string; count: number }>;
}> {
  let query = supabaseAdmin
    .from('synthex_library_usage')
    .select('template_id, success')
    .eq('tenant_id', tenantId);

  if (templateId) {
    query = query.eq('template_id', templateId);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to get usage stats: ${error.message}`);
}

  const total_uses = data?.length || 0;
  const successful = data?.filter((u) => u.success).length || 0;
  const success_rate = total_uses > 0 ? successful / total_uses : 0;

  // Get top templates
  const usageCounts = (data || []).reduce(
    (acc, u) => {
      acc[u.template_id] = (acc[u.template_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topTemplateIds = Object.entries(usageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: templates } = await supabaseAdmin
    .from('synthex_library_templates')
    .select('id, title')
    .in('id', topTemplateIds);

  const top_templates = topTemplateIds.map((id) => ({
    template_id: id,
    title: templates?.find((t) => t.id === id)?.title || 'Unknown',
    count: usageCounts[id],
  }));

  return { total_uses, success_rate, top_templates };
}

// =====================================================
// Variable Extraction & Rendering
// =====================================================

/**
 * Extract variables from template content
 * Supports {{variable}}, {{variable:type}}, {{variable:type:default}}
 */
export async function extractVariables(
  content: string
): Promise<TemplateVariable[]> {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables: TemplateVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    const parts = match[1].split(':');
    const name = parts[0].trim();

    if (seen.has(name)) {
continue;
}
    seen.add(name);

    variables.push({
      name,
      type: (parts[1]?.trim() as TemplateVariable['type']) || 'text',
      default: parts[2]?.trim(),
      required: !parts[2], // Required if no default
    });
  }

  return variables;
}

/**
 * Render template with provided variables
 */
export function renderTemplate(
  content: string,
  variables: Record<string, string>
): string {
  let rendered = content;

  for (const [name, value] of Object.entries(variables)) {
    const patterns = [
      new RegExp(`\\{\\{${name}\\}\\}`, 'g'),
      new RegExp(`\\{\\{${name}:[^}]*\\}\\}`, 'g'),
    ];

    for (const pattern of patterns) {
      rendered = rendered.replace(pattern, value);
    }
  }

  return rendered;
}

// =====================================================
// AI-Powered Template Generation
// =====================================================

/**
 * Generate a template using AI based on a prompt
 */
export async function generateTemplate(
  tenantId: string,
  prompt: string,
  templateType: TemplateType,
  options?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    includeVariables?: boolean;
  }
): Promise<{
  title: string;
  content: string;
  variables: TemplateVariable[];
}> {
  const client = getAnthropicClient();

  const lengthGuide = {
    short: '50-100 words',
    medium: '150-300 words',
    long: '400-600 words',
  };

  const systemPrompt = `You are a professional copywriter creating ${templateType} templates.
Generate high-quality, conversion-focused content.
${options?.tone ? `Use a ${options.tone} tone.` : ''}
${options?.length ? `Target length: ${lengthGuide[options.length]}.` : ''}
${options?.includeVariables !== false ? 'Include placeholders using {{variable_name}} syntax for personalization.' : ''}

Respond in JSON format:
{
  "title": "Template title",
  "content": "The template content with {{variables}}",
  "variables": [{"name": "variable_name", "type": "text", "required": true, "description": "What this variable represents"}]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      { role: 'user', content: prompt },
    ],
    system: systemPrompt,
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback if JSON parsing fails
  }

  return {
    title: 'Generated Template',
    content: text,
    variables: await extractVariables(text),
  };
}

/**
 * Improve an existing template using AI
 */
export async function improveTemplate(
  content: string,
  improvementType: 'clarity' | 'engagement' | 'conversion' | 'brevity'
): Promise<string> {
  const client = getAnthropicClient();

  const instructions = {
    clarity: 'Make this template clearer and easier to understand. Remove jargon and simplify complex sentences.',
    engagement: 'Make this template more engaging and compelling. Add emotional hooks and storytelling elements.',
    conversion: 'Optimize this template for better conversion. Add urgency, social proof hints, and stronger CTAs.',
    brevity: 'Make this template more concise while keeping the key message. Remove redundancy.',
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${instructions[improvementType]}\n\nOriginal template:\n${content}\n\nProvide the improved template only, preserving all {{variable}} placeholders.`,
      },
    ],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : content;
}

// =====================================================
// Statistics
// =====================================================

export async function getTemplateStats(tenantId: string): Promise<{
  totalTemplates: number;
  activeTemplates: number;
  draftTemplates: number;
  totalCategories: number;
  totalUsage: number;
  templatesByType: Record<TemplateType, number>;
}> {
  const [templates, categories, usage] = await Promise.all([
    supabaseAdmin
      .from('synthex_library_templates')
      .select('status, template_type')
      .eq('tenant_id', tenantId)
      .eq('is_latest', true),
    supabaseAdmin
      .from('synthex_library_categories')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabaseAdmin
      .from('synthex_library_usage')
      .select('id')
      .eq('tenant_id', tenantId),
  ]);

  const templateData = templates.data || [];
  const templatesByType = templateData.reduce(
    (acc, t) => {
      acc[t.template_type as TemplateType] =
        (acc[t.template_type as TemplateType] || 0) + 1;
      return acc;
    },
    {} as Record<TemplateType, number>
  );

  return {
    totalTemplates: templateData.length,
    activeTemplates: templateData.filter((t) => t.status === 'active').length,
    draftTemplates: templateData.filter((t) => t.status === 'draft').length,
    totalCategories: categories.data?.length || 0,
    totalUsage: usage.data?.length || 0,
    templatesByType,
  };
}

// =====================================================
// Default Categories Initialization
// =====================================================

export async function initializeDefaultCategories(
  tenantId: string
): Promise<void> {
  const defaultCategories = [
    { name: 'Email', slug: 'email', icon: 'Mail', color: '#3B82F6' },
    { name: 'Social Media', slug: 'social', icon: 'Share2', color: '#8B5CF6' },
    { name: 'Advertising', slug: 'ads', icon: 'Megaphone', color: '#F59E0B' },
    { name: 'Website', slug: 'website', icon: 'Globe', color: '#10B981' },
    { name: 'Sales', slug: 'sales', icon: 'Target', color: '#EF4444' },
  ];

  for (const cat of defaultCategories) {
    try {
      await createCategory(tenantId, cat);
    } catch {
      // Category might already exist, skip
    }
  }
}
