/**
 * Synthex Cross-Channel Service
 * Phase D08: Cross-Channel Template Sync
 *
 * Automatically adapts templates across different channels
 * while maintaining brand consistency.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

// =====================================================
// Types
// =====================================================

export type Channel =
  | "email"
  | "sms"
  | "push"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "slack"
  | "teams";

export interface ChannelConfig {
  id: string;
  tenant_id: string;
  channel: Channel;
  display_name: string;
  icon?: string;
  max_length?: number;
  supports_html: boolean;
  supports_images: boolean;
  supports_links: boolean;
  supports_emoji: boolean;
  supports_personalization: boolean;
  line_break_style: string;
  link_format: string;
  hashtag_style?: string;
  best_send_times: Array<{ day: string; hour: number; timezone: string }>;
  avoid_times: Array<{ day: string; hour: number }>;
  max_frequency?: string;
  tone_modifier?: string;
  emoji_density: string;
  cta_style: string;
  is_active: boolean;
  is_verified: boolean;
  integration_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChannelSync {
  id: string;
  tenant_id: string;
  source_template_id: string;
  source_channel: string;
  sync_group_id: string;
  target_channel: string;
  adapted_content: string;
  adapted_subject?: string;
  adapted_preview?: string;
  adapted_cta?: string;
  adaptation_type: "ai" | "rule_based" | "manual";
  adaptations_made: Array<{ type: string; description: string }>;
  brand_consistency_score?: number;
  message_coherence_score?: number;
  channel_optimization_score?: number;
  overall_score?: number;
  status: "draft" | "pending_review" | "approved" | "published" | "archived";
  approved_at?: string;
  approved_by?: string;
  published_at?: string;
  sends: number;
  opens: number;
  clicks: number;
  conversions: number;
  ai_model?: string;
  confidence?: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SyncRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  source_channel?: string;
  target_channel?: string;
  template_types: string[];
  conditions: Record<string, unknown>;
  priority: number;
  rules: Array<{
    action: string;
    target?: string;
    limit?: number;
    find?: string;
    replace?: string;
    emoji?: string;
    position?: string;
  }>;
  use_ai_enhancement: boolean;
  ai_instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SyncJob {
  id: string;
  tenant_id: string;
  name?: string;
  source_channel?: string;
  target_channels: string[];
  template_ids: string[];
  template_filters: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  error_message?: string;
  total_templates: number;
  synced_count: number;
  failed_count: number;
  skipped_count: number;
  results: Array<{ template_id: string; status: string; message?: string }>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  created_by?: string;
}

export interface AdaptTemplateInput {
  content: string;
  subject?: string;
  sourceChannel: Channel;
  targetChannel: Channel;
  brandContext?: string;
  preserveVariables?: boolean;
}

export interface AdaptTemplateResult {
  adapted_content: string;
  adapted_subject?: string;
  adapted_preview?: string;
  adapted_cta?: string;
  adaptations_made: Array<{ type: string; description: string }>;
  brand_consistency_score: number;
  message_coherence_score: number;
  channel_optimization_score: number;
  overall_score: number;
}

// =====================================================
// Channel Constraints (Default Values)
// =====================================================

const CHANNEL_DEFAULTS: Record<Channel, Partial<ChannelConfig>> = {
  email: {
    supports_html: true,
    supports_images: true,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "button",
  },
  sms: {
    max_length: 160,
    supports_html: false,
    supports_images: false,
    supports_links: true,
    emoji_density: "minimal",
    cta_style: "action-word",
  },
  push: {
    max_length: 200,
    supports_html: false,
    supports_images: true,
    supports_links: true,
    emoji_density: "minimal",
    cta_style: "action-word",
  },
  whatsapp: {
    max_length: 4096,
    supports_html: false,
    supports_images: true,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "link",
  },
  facebook: {
    max_length: 63206,
    supports_html: false,
    supports_images: true,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "link",
  },
  instagram: {
    max_length: 2200,
    supports_html: false,
    supports_images: true,
    supports_links: false,
    emoji_density: "heavy",
    cta_style: "link",
    hashtag_style: "#keyword",
  },
  twitter: {
    max_length: 280,
    supports_html: false,
    supports_images: true,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "link",
    hashtag_style: "#keyword",
  },
  linkedin: {
    max_length: 3000,
    supports_html: true,
    supports_images: true,
    supports_links: true,
    emoji_density: "minimal",
    cta_style: "link",
    tone_modifier: "more professional",
  },
  tiktok: {
    max_length: 2200,
    supports_html: false,
    supports_images: true,
    supports_links: false,
    emoji_density: "heavy",
    cta_style: "action-word",
    hashtag_style: "#keyword",
    tone_modifier: "more casual and energetic",
  },
  youtube: {
    max_length: 5000,
    supports_html: false,
    supports_images: false,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "link",
  },
  slack: {
    supports_html: false,
    supports_images: true,
    supports_links: true,
    emoji_density: "moderate",
    cta_style: "link",
    tone_modifier: "conversational",
  },
  teams: {
    supports_html: true,
    supports_images: true,
    supports_links: true,
    emoji_density: "minimal",
    cta_style: "button",
    tone_modifier: "professional",
  },
};

// =====================================================
// Lazy Anthropic Client
// =====================================================

let anthropicClient: import("@anthropic-ai/sdk").Anthropic | null = null;
let anthropicFailed = false;

async function getAnthropicClient(): Promise<import("@anthropic-ai/sdk").Anthropic | null> {
  if (anthropicFailed) {
return null;
}

  if (!anthropicClient) {
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch {
      console.warn("[CrossChannelService] Anthropic SDK not available");
      anthropicFailed = true;
      return null;
    }
  }
  return anthropicClient;
}

// =====================================================
// Channel Config Management
// =====================================================

/**
 * Get channel configuration for a tenant
 */
export async function getChannelConfig(
  tenantId: string,
  channel: Channel
): Promise<ChannelConfig | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("channel", channel)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get channel config: ${error.message}`);
  }

  return data;
}

/**
 * Get all channel configs for a tenant
 */
export async function listChannelConfigs(
  tenantId: string
): Promise<ChannelConfig[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("channel");

  if (error) {
    throw new Error(`Failed to list channel configs: ${error.message}`);
  }

  return data || [];
}

/**
 * Create or update channel configuration
 */
export async function upsertChannelConfig(
  tenantId: string,
  channel: Channel,
  config: Partial<ChannelConfig>
): Promise<ChannelConfig> {
  const defaults = CHANNEL_DEFAULTS[channel] || {};

  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_configs")
    .upsert(
      {
        tenant_id: tenantId,
        channel,
        display_name: config.display_name || channel.charAt(0).toUpperCase() + channel.slice(1),
        ...defaults,
        ...config,
      },
      { onConflict: "tenant_id,channel" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert channel config: ${error.message}`);
  }

  return data;
}

/**
 * Get effective channel constraints (config or defaults)
 */
export async function getChannelConstraints(
  tenantId: string,
  channel: Channel
): Promise<Partial<ChannelConfig>> {
  const config = await getChannelConfig(tenantId, channel);
  if (config) {
return config;
}

  return {
    channel,
    ...CHANNEL_DEFAULTS[channel],
  };
}

// =====================================================
// Template Adaptation
// =====================================================

/**
 * Adapt a template for a different channel using AI
 */
export async function adaptTemplate(
  tenantId: string,
  input: AdaptTemplateInput
): Promise<AdaptTemplateResult> {
  const sourceConstraints = await getChannelConstraints(tenantId, input.sourceChannel);
  const targetConstraints = await getChannelConstraints(tenantId, input.targetChannel);

  const anthropic = await getAnthropicClient();

  if (!anthropic) {
    // Fall back to rule-based adaptation
    return adaptTemplateRuleBased(input, targetConstraints);
  }

  const prompt = buildAdaptationPrompt(input, sourceConstraints, targetConstraints);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = JSON.parse(content.text);

    return {
      adapted_content: result.adapted_content,
      adapted_subject: result.adapted_subject,
      adapted_preview: result.adapted_preview,
      adapted_cta: result.adapted_cta,
      adaptations_made: result.adaptations_made || [],
      brand_consistency_score: result.brand_consistency_score || 0.8,
      message_coherence_score: result.message_coherence_score || 0.8,
      channel_optimization_score: result.channel_optimization_score || 0.8,
      overall_score: calculateOverallScore(
        result.brand_consistency_score,
        result.message_coherence_score,
        result.channel_optimization_score
      ),
    };
  } catch (err) {
    console.error("[CrossChannelService] AI adaptation failed:", err);
    return adaptTemplateRuleBased(input, targetConstraints);
  }
}

function buildAdaptationPrompt(
  input: AdaptTemplateInput,
  sourceConstraints: Partial<ChannelConfig>,
  targetConstraints: Partial<ChannelConfig>
): string {
  return `Adapt this ${input.sourceChannel} content for ${input.targetChannel}.

ORIGINAL CONTENT:
${input.content}
${input.subject ? `\nSUBJECT: ${input.subject}` : ""}

SOURCE CHANNEL (${input.sourceChannel}):
- Max length: ${sourceConstraints.max_length || "unlimited"}
- Supports HTML: ${sourceConstraints.supports_html}
- Emoji style: ${sourceConstraints.emoji_density}

TARGET CHANNEL (${input.targetChannel}):
- Max length: ${targetConstraints.max_length || "unlimited"}
- Supports HTML: ${targetConstraints.supports_html}
- Emoji style: ${targetConstraints.emoji_density}
- CTA style: ${targetConstraints.cta_style}
${targetConstraints.tone_modifier ? `- Tone adjustment: ${targetConstraints.tone_modifier}` : ""}
${targetConstraints.hashtag_style ? `- Hashtag style: ${targetConstraints.hashtag_style}` : ""}

${input.brandContext ? `BRAND CONTEXT:\n${input.brandContext}\n` : ""}

${input.preserveVariables ? "IMPORTANT: Preserve all {{variable}} placeholders exactly as they appear." : ""}

Return a JSON object:
{
  "adapted_content": "The adapted content for ${input.targetChannel}",
  "adapted_subject": "Adapted subject line (if applicable)",
  "adapted_preview": "Short preview text (first 100 chars)",
  "adapted_cta": "The main call-to-action",
  "adaptations_made": [
    { "type": "length", "description": "Truncated to 280 characters" },
    { "type": "formatting", "description": "Removed HTML tags" },
    { "type": "tone", "description": "Made more casual" }
  ],
  "brand_consistency_score": 0.0-1.0,
  "message_coherence_score": 0.0-1.0,
  "channel_optimization_score": 0.0-1.0
}

Return ONLY valid JSON.`;
}

function adaptTemplateRuleBased(
  input: AdaptTemplateInput,
  targetConstraints: Partial<ChannelConfig>
): AdaptTemplateResult {
  let content = input.content;
  const adaptations: Array<{ type: string; description: string }> = [];

  // Remove HTML if not supported
  if (!targetConstraints.supports_html) {
    const originalLength = content.length;
    content = content.replace(/<[^>]*>/g, "");
    if (content.length !== originalLength) {
      adaptations.push({ type: "formatting", description: "Removed HTML tags" });
    }
  }

  // Truncate if needed
  if (targetConstraints.max_length && content.length > targetConstraints.max_length) {
    content = content.substring(0, targetConstraints.max_length - 3) + "...";
    adaptations.push({
      type: "length",
      description: `Truncated to ${targetConstraints.max_length} characters`,
    });
  }

  // Remove links if not supported
  if (!targetConstraints.supports_links) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    if (urlRegex.test(content)) {
      content = content.replace(urlRegex, "[link in bio]");
      adaptations.push({ type: "links", description: "Replaced links with bio reference" });
    }
  }

  return {
    adapted_content: content,
    adapted_subject: input.subject,
    adapted_preview: content.substring(0, 100),
    adapted_cta: extractCTA(content),
    adaptations_made: adaptations,
    brand_consistency_score: 0.7,
    message_coherence_score: 0.7,
    channel_optimization_score: 0.6,
    overall_score: 0.67,
  };
}

function extractCTA(content: string): string {
  // Simple CTA extraction - look for action words
  const ctaPatterns = [
    /(?:click|tap|visit|learn|discover|get|start|try|join|sign up|subscribe|download|buy|shop|order)[^.!?]*/i,
  ];

  for (const pattern of ctaPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return "";
}

function calculateOverallScore(brand: number, coherence: number, channel: number): number {
  return Math.round((brand * 0.4 + coherence * 0.35 + channel * 0.25) * 100) / 100;
}

// =====================================================
// Channel Sync
// =====================================================

/**
 * Sync a template to multiple channels
 */
export async function syncTemplateToChannels(
  tenantId: string,
  templateId: string,
  sourceChannel: Channel,
  targetChannels: Channel[],
  options?: {
    brandContext?: string;
    preserveVariables?: boolean;
    autoApprove?: boolean;
  }
): Promise<ChannelSync[]> {
  // Get source template content
  const { data: template, error: templateError } = await supabaseAdmin
    .from("synthex_library_templates")
    .select("content, title")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    throw new Error("Template not found");
  }

  const syncGroupId = uuidv4();
  const results: ChannelSync[] = [];

  for (const targetChannel of targetChannels) {
    if (targetChannel === sourceChannel) {
continue;
}

    const adaptation = await adaptTemplate(tenantId, {
      content: template.content,
      subject: template.title,
      sourceChannel,
      targetChannel,
      brandContext: options?.brandContext,
      preserveVariables: options?.preserveVariables,
    });

    const { data: sync, error: syncError } = await supabaseAdmin
      .from("synthex_library_channel_sync")
      .insert({
        tenant_id: tenantId,
        source_template_id: templateId,
        source_channel: sourceChannel,
        sync_group_id: syncGroupId,
        target_channel: targetChannel,
        adapted_content: adaptation.adapted_content,
        adapted_subject: adaptation.adapted_subject,
        adapted_preview: adaptation.adapted_preview,
        adapted_cta: adaptation.adapted_cta,
        adaptation_type: "ai",
        adaptations_made: adaptation.adaptations_made,
        brand_consistency_score: adaptation.brand_consistency_score,
        message_coherence_score: adaptation.message_coherence_score,
        channel_optimization_score: adaptation.channel_optimization_score,
        overall_score: adaptation.overall_score,
        status: options?.autoApprove ? "approved" : "draft",
        ai_model: "claude-sonnet-4-5-20250514",
      })
      .select()
      .single();

    if (syncError) {
      console.error(`[CrossChannelService] Failed to sync to ${targetChannel}:`, syncError);
      continue;
    }

    results.push(sync);
  }

  return results;
}

/**
 * Get synced versions of a template
 */
export async function getTemplateSyncs(
  templateId: string
): Promise<ChannelSync[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_sync")
    .select("*")
    .eq("source_template_id", templateId)
    .order("target_channel");

  if (error) {
    throw new Error(`Failed to get template syncs: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all syncs in a sync group
 */
export async function getSyncGroup(syncGroupId: string): Promise<ChannelSync[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_sync")
    .select("*")
    .eq("sync_group_id", syncGroupId)
    .order("target_channel");

  if (error) {
    throw new Error(`Failed to get sync group: ${error.message}`);
  }

  return data || [];
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  syncId: string,
  status: ChannelSync["status"],
  userId?: string
): Promise<ChannelSync> {
  const updateData: Record<string, unknown> = { status };

  if (status === "approved") {
    updateData.approved_at = new Date().toISOString();
    updateData.approved_by = userId;
  } else if (status === "published") {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_sync")
    .update(updateData)
    .eq("id", syncId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sync status: ${error.message}`);
  }

  return data;
}

/**
 * Update sync content (manual edit)
 */
export async function updateSyncContent(
  syncId: string,
  content: Partial<Pick<ChannelSync, "adapted_content" | "adapted_subject" | "adapted_preview" | "adapted_cta">>
): Promise<ChannelSync> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_channel_sync")
    .update({
      ...content,
      adaptation_type: "manual",
    })
    .eq("id", syncId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sync content: ${error.message}`);
  }

  return data;
}

// =====================================================
// Sync Rules
// =====================================================

/**
 * List sync rules
 */
export async function listSyncRules(
  tenantId: string,
  filters?: { source_channel?: string; target_channel?: string; is_active?: boolean }
): Promise<SyncRule[]> {
  let query = supabaseAdmin
    .from("synthex_library_sync_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  if (filters?.source_channel) {
    query = query.eq("source_channel", filters.source_channel);
  }
  if (filters?.target_channel) {
    query = query.eq("target_channel", filters.target_channel);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list sync rules: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a sync rule
 */
export async function createSyncRule(
  tenantId: string,
  rule: Partial<SyncRule>,
  userId?: string
): Promise<SyncRule> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_sync_rules")
    .insert({
      tenant_id: tenantId,
      name: rule.name,
      description: rule.description,
      source_channel: rule.source_channel,
      target_channel: rule.target_channel,
      template_types: rule.template_types || [],
      conditions: rule.conditions || {},
      priority: rule.priority || 50,
      rules: rule.rules || [],
      use_ai_enhancement: rule.use_ai_enhancement ?? true,
      ai_instructions: rule.ai_instructions,
      is_active: rule.is_active ?? true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sync rule: ${error.message}`);
  }

  return data;
}

/**
 * Update a sync rule
 */
export async function updateSyncRule(
  ruleId: string,
  updates: Partial<SyncRule>
): Promise<SyncRule> {
  const { id, tenant_id, created_at, created_by, ...updateData } = updates as SyncRule;

  const { data, error } = await supabaseAdmin
    .from("synthex_library_sync_rules")
    .update(updateData)
    .eq("id", ruleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sync rule: ${error.message}`);
  }

  return data;
}

/**
 * Delete a sync rule
 */
export async function deleteSyncRule(ruleId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_sync_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    throw new Error(`Failed to delete sync rule: ${error.message}`);
  }
}

// =====================================================
// Sync Jobs
// =====================================================

/**
 * Create a batch sync job
 */
export async function createSyncJob(
  tenantId: string,
  config: {
    name?: string;
    source_channel?: string;
    target_channels: string[];
    template_ids?: string[];
    template_filters?: Record<string, unknown>;
  },
  userId?: string
): Promise<SyncJob> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_sync_jobs")
    .insert({
      tenant_id: tenantId,
      name: config.name,
      source_channel: config.source_channel,
      target_channels: config.target_channels,
      template_ids: config.template_ids || [],
      template_filters: config.template_filters || {},
      status: "pending",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sync job: ${error.message}`);
  }

  return data;
}

/**
 * Get sync job status
 */
export async function getSyncJob(jobId: string): Promise<SyncJob | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_sync_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get sync job: ${error.message}`);
  }

  return data;
}

/**
 * Execute a sync job (process templates)
 */
export async function executeSyncJob(jobId: string): Promise<SyncJob> {
  const job = await getSyncJob(jobId);
  if (!job) {
    throw new Error("Sync job not found");
  }

  // Update status to processing
  await supabaseAdmin
    .from("synthex_library_sync_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  try {
    // Get templates to sync
    let templatesQuery = supabaseAdmin
      .from("synthex_library_templates")
      .select("id, content, title, template_type")
      .eq("tenant_id", job.tenant_id);

    if (job.template_ids.length > 0) {
      templatesQuery = templatesQuery.in("id", job.template_ids);
    }

    const { data: templates, error: templatesError } = await templatesQuery;

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    const results: Array<{ template_id: string; status: string; message?: string }> = [];
    let synced = 0;
    let failed = 0;
    const skipped = 0;

    for (const template of templates || []) {
      try {
        await syncTemplateToChannels(
          job.tenant_id,
          template.id,
          (job.source_channel as Channel) || "email",
          job.target_channels as Channel[]
        );
        synced++;
        results.push({ template_id: template.id, status: "success" });
      } catch (err) {
        failed++;
        results.push({
          template_id: template.id,
          status: "failed",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }

      // Update progress
      const progress = Math.round(((synced + failed + skipped) / (templates?.length || 1)) * 100);
      await supabaseAdmin
        .from("synthex_library_sync_jobs")
        .update({ progress })
        .eq("id", jobId);
    }

    // Update final status
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from("synthex_library_sync_jobs")
      .update({
        status: "completed",
        progress: 100,
        total_templates: templates?.length || 0,
        synced_count: synced,
        failed_count: failed,
        skipped_count: skipped,
        results,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedJob;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabaseAdmin
      .from("synthex_library_sync_jobs")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", jobId);

    throw new Error(`Sync job failed: ${errorMessage}`);
  }
}

// =====================================================
// Analytics
// =====================================================

/**
 * Get cross-channel performance analytics
 */
export async function getChannelAnalytics(
  tenantId: string,
  options?: {
    channel?: Channel;
    syncGroupId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  byChannel: Record<string, { sends: number; opens: number; clicks: number; conversions: number }>;
  topPerforming: ChannelSync[];
  recommendations: Array<{ channel: string; recommendation: string }>;
}> {
  let query = supabaseAdmin
    .from("synthex_library_channel_sync")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("status", ["approved", "published"]);

  if (options?.channel) {
    query = query.eq("target_channel", options.channel);
  }
  if (options?.syncGroupId) {
    query = query.eq("sync_group_id", options.syncGroupId);
  }

  const { data: syncs, error } = await query;

  if (error) {
    throw new Error(`Failed to get channel analytics: ${error.message}`);
  }

  // Aggregate by channel
  const byChannel: Record<string, { sends: number; opens: number; clicks: number; conversions: number }> = {};

  for (const sync of syncs || []) {
    if (!byChannel[sync.target_channel]) {
      byChannel[sync.target_channel] = { sends: 0, opens: 0, clicks: 0, conversions: 0 };
    }
    byChannel[sync.target_channel].sends += sync.sends || 0;
    byChannel[sync.target_channel].opens += sync.opens || 0;
    byChannel[sync.target_channel].clicks += sync.clicks || 0;
    byChannel[sync.target_channel].conversions += sync.conversions || 0;
  }

  // Get top performing
  const topPerforming = [...(syncs || [])]
    .filter((s) => s.sends > 0)
    .sort((a, b) => (b.clicks / b.sends) - (a.clicks / a.sends))
    .slice(0, 5);

  // Generate recommendations
  const recommendations: Array<{ channel: string; recommendation: string }> = [];

  for (const [channel, stats] of Object.entries(byChannel)) {
    if (stats.sends > 0) {
      const clickRate = stats.clicks / stats.sends;
      if (clickRate < 0.02) {
        recommendations.push({
          channel,
          recommendation: `Low click rate (${(clickRate * 100).toFixed(1)}%). Consider stronger CTAs or more compelling content.`,
        });
      }
    }
  }

  return { byChannel, topPerforming, recommendations };
}

// =====================================================
// Stats
// =====================================================

/**
 * Get sync statistics
 */
export async function getSyncStats(tenantId: string): Promise<{
  total_syncs: number;
  syncs_by_channel: Record<string, number>;
  syncs_by_status: Record<string, number>;
  avg_quality_score: number;
  active_rules: number;
  pending_jobs: number;
}> {
  const { data: syncs } = await supabaseAdmin
    .from("synthex_library_channel_sync")
    .select("target_channel, status, overall_score")
    .eq("tenant_id", tenantId);

  const { count: activeRules } = await supabaseAdmin
    .from("synthex_library_sync_rules")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { count: pendingJobs } = await supabaseAdmin
    .from("synthex_library_sync_jobs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "processing"]);

  const syncsByChannel: Record<string, number> = {};
  const syncsByStatus: Record<string, number> = {};
  let totalScore = 0;
  let scoreCount = 0;

  for (const sync of syncs || []) {
    syncsByChannel[sync.target_channel] = (syncsByChannel[sync.target_channel] || 0) + 1;
    syncsByStatus[sync.status] = (syncsByStatus[sync.status] || 0) + 1;
    if (sync.overall_score) {
      totalScore += sync.overall_score;
      scoreCount++;
    }
  }

  return {
    total_syncs: syncs?.length || 0,
    syncs_by_channel: syncsByChannel,
    syncs_by_status: syncsByStatus,
    avg_quality_score: scoreCount > 0 ? Math.round((totalScore / scoreCount) * 100) / 100 : 0,
    active_rules: activeRules || 0,
    pending_jobs: pendingJobs || 0,
  };
}
