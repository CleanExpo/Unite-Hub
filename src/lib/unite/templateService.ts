/**
 * Multi-Brand Template Library Service
 *
 * Phase: D57 - Multi-Brand Template Library & Provisioning
 * Tables: unite_templates, unite_template_blocks, unite_template_bindings
 *
 * Features:
 * - Reusable template library
 * - Block-based composition
 * - Template bindings to campaigns/journeys
 * - AI-powered template generation
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type TemplateScope = 'tenant' | 'global';
export type TemplateStatus = 'draft' | 'published' | 'archived';
export type BlockKind = 'text' | 'image' | 'cta' | 'hero' | 'footer' | 'section' | 'custom';

export interface Template {
  id: string;
  tenant_id?: string;
  scope: TemplateScope;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  channel?: string;
  status: TemplateStatus;
  structure?: Record<string, unknown>;
  ai_profile?: Record<string, unknown>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TemplateBlock {
  id: string;
  template_id: string;
  kind: BlockKind;
  order_index: number;
  label?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface TemplateBinding {
  id: string;
  tenant_id?: string;
  template_id: string;
  target_type: string;
  target_id?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  scope: TemplateScope;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  channel?: string;
  tags?: string[];
}

export interface CreateBlockInput {
  template_id: string;
  kind: BlockKind;
  order_index: number;
  label?: string;
  payload?: Record<string, unknown>;
}

export interface CreateBindingInput {
  template_id: string;
  target_type: string;
  target_id?: string;
  config?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Templates
// =============================================================================

export async function createTemplate(
  tenantId: string | null,
  input: CreateTemplateInput
): Promise<Template> {
  const { data, error } = await supabaseAdmin
    .from('unite_templates')
    .insert({
      tenant_id: tenantId,
      scope: input.scope,
      slug: input.slug,
      name: input.name,
      description: input.description,
      category: input.category,
      channel: input.channel,
      status: 'draft',
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create template: ${error.message}`);
  return data as Template;
}

export async function getTemplate(
  tenantId: string | null,
  templateId: string
): Promise<Template | null> {
  let query = supabaseAdmin
    .from('unite_templates')
    .select('*')
    .eq('id', templateId);

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to get template: ${error.message}`);
  return data as Template | null;
}

export async function listTemplates(
  tenantId: string | null,
  filters?: {
    category?: string;
    channel?: string;
    status?: TemplateStatus;
    tags?: string[];
    limit?: number;
  }
): Promise<Template[]> {
  let query = supabaseAdmin
    .from('unite_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list templates: ${error.message}`);
  return data as Template[];
}

export async function updateTemplate(
  tenantId: string | null,
  templateId: string,
  updates: Partial<Template>
): Promise<Template> {
  const { data, error } = await supabaseAdmin
    .from('unite_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update template: ${error.message}`);
  return data as Template;
}

export async function deleteTemplate(
  tenantId: string | null,
  templateId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw new Error(`Failed to delete template: ${error.message}`);
}

// =============================================================================
// Template Blocks
// =============================================================================

export async function createBlock(
  input: CreateBlockInput
): Promise<TemplateBlock> {
  const { data, error } = await supabaseAdmin
    .from('unite_template_blocks')
    .insert({
      template_id: input.template_id,
      kind: input.kind,
      order_index: input.order_index,
      label: input.label,
      payload: input.payload || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create block: ${error.message}`);
  return data as TemplateBlock;
}

export async function listBlocks(
  templateId: string
): Promise<TemplateBlock[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_template_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(`Failed to list blocks: ${error.message}`);
  return data as TemplateBlock[];
}

export async function deleteBlock(blockId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_template_blocks')
    .delete()
    .eq('id', blockId);

  if (error) throw new Error(`Failed to delete block: ${error.message}`);
}

// =============================================================================
// Template Bindings
// =============================================================================

export async function createBinding(
  tenantId: string | null,
  input: CreateBindingInput
): Promise<TemplateBinding> {
  const { data, error } = await supabaseAdmin
    .from('unite_template_bindings')
    .insert({
      tenant_id: tenantId,
      template_id: input.template_id,
      target_type: input.target_type,
      target_id: input.target_id,
      config: input.config || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create binding: ${error.message}`);
  return data as TemplateBinding;
}

export async function listBindings(
  tenantId: string | null,
  filters?: {
    templateId?: string;
    targetType?: string;
    targetId?: string;
  }
): Promise<TemplateBinding[]> {
  let query = supabaseAdmin
    .from('unite_template_bindings')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  if (filters?.templateId) {
    query = query.eq('template_id', filters.templateId);
  }

  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType);
  }

  if (filters?.targetId) {
    query = query.eq('target_id', filters.targetId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list bindings: ${error.message}`);
  return data as TemplateBinding[];
}

export async function deleteBinding(bindingId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_template_bindings')
    .delete()
    .eq('id', bindingId);

  if (error) throw new Error(`Failed to delete binding: ${error.message}`);
}

// =============================================================================
// AI-Powered Features
// =============================================================================

export async function aiGenerateTemplate(
  description: string,
  category: string,
  channel: string
): Promise<{
  name: string;
  description: string;
  blocks: Array<{
    kind: BlockKind;
    order_index: number;
    label: string;
    payload: Record<string, unknown>;
  }>;
  tags: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `Generate a ${category} template for ${channel} based on this description:

**Description**: ${description}

Provide template structure in JSON format:
{
  "name": "Template Name",
  "description": "Clear description of what this template does",
  "blocks": [
    {
      "kind": "hero",
      "order_index": 0,
      "label": "Hero Section",
      "payload": {
        "headline": "...",
        "subheadline": "...",
        "image_url": "placeholder"
      }
    },
    {
      "kind": "text",
      "order_index": 1,
      "label": "Main Content",
      "payload": {
        "content": "..."
      }
    }
  ],
  "tags": ["tag1", "tag2"]
}

Requirements:
- Include 3-5 blocks minimum
- Use appropriate block types: text, image, cta, hero, footer, section
- Provide realistic placeholder content
- Add relevant tags for discoverability`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse AI template response');
  }
}
