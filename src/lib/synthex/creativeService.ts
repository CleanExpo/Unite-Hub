/**
 * Synthex Multi-Channel Creative Service
 * Phase D18: AI-Powered Cross-Channel Content Creation
 *
 * AI-powered creative generation with variant testing,
 * channel adaptation, and performance tracking.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// Lazy Anthropic client with circuit breaker
let anthropicClient: Anthropic | null = null;
let lastFailureTime: number | null = null;
const CIRCUIT_BREAKER_TIMEOUT = 60000;

function getAnthropicClient(): Anthropic {
  if (lastFailureTime && Date.now() - lastFailureTime < CIRCUIT_BREAKER_TIMEOUT) {
    throw new Error("Anthropic API circuit breaker open");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export interface CreativeBrief {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  objective: string;
  target_audience: string | null;
  audience_persona_id: string | null;
  brand_id: string | null;
  tone_profile_id: string | null;
  primary_message: string | null;
  supporting_messages: string[] | null;
  call_to_action: string | null;
  visual_style: string | null;
  color_scheme: Record<string, unknown>;
  imagery_direction: string | null;
  target_channels: string[];
  inspiration_urls: string[] | null;
  competitor_refs: string[] | null;
  reference_assets: string[] | null;
  word_limits: Record<string, number>;
  required_elements: string[] | null;
  forbidden_elements: string[] | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreativeAsset {
  id: string;
  tenant_id: string;
  brief_id: string | null;
  name: string;
  description: string | null;
  asset_type: string;
  channel: string;
  format: string | null;
  headline: string | null;
  subheadline: string | null;
  body: string | null;
  call_to_action: string | null;
  visual_description: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  links: Array<{ url: string; text: string; tracking?: string }>;
  content_blocks: unknown[];
  variables: Record<string, unknown>;
  is_variant: boolean;
  variant_of: string | null;
  variant_label: string | null;
  variant_changes: string[] | null;
  ai_model: string | null;
  ai_prompt: string | null;
  ai_reasoning: string | null;
  generation_params: Record<string, unknown>;
  tokens_used: number | null;
  generation_time_ms: number | null;
  quality_score: number | null;
  readability_score: number | null;
  engagement_prediction: number | null;
  brand_compliance_score: number | null;
  compliance_issues: unknown[];
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  engagement_rate: number | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreativeTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  channel: string;
  asset_type: string;
  format: string | null;
  headline_template: string | null;
  body_template: string | null;
  cta_template: string | null;
  variables: Array<{ name: string; type: string; required: boolean }>;
  tone: string | null;
  style: string | null;
  ai_instructions: string | null;
  example_outputs: unknown[];
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  avg_quality_score: number | null;
  avg_performance: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreativeGeneration {
  id: string;
  tenant_id: string;
  brief_id: string | null;
  template_id: string | null;
  input_prompt: string;
  input_context: Record<string, unknown>;
  channels_requested: string[] | null;
  variants_requested: number;
  assets_generated: string[];
  generation_count: number;
  ai_model: string;
  tokens_input: number | null;
  tokens_output: number | null;
  total_tokens: number | null;
  cost_estimate: number | null;
  generation_time_ms: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreativeFeedback {
  id: string;
  tenant_id: string;
  asset_id: string;
  rating: number | null;
  feedback_type: string | null;
  feedback_text: string | null;
  issues: Array<{ type: string; description: string }>;
  revision_instructions: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreativeABTest {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  control_asset_id: string;
  variant_asset_ids: string[];
  channel: string;
  traffic_split: Record<string, number>;
  primary_metric: string;
  secondary_metrics: string[] | null;
  audience_filter: Record<string, unknown>;
  sample_size_target: number | null;
  start_date: string | null;
  end_date: string | null;
  auto_select_winner: boolean;
  status: string;
  winner_asset_id: string | null;
  winning_confidence: number | null;
  results_summary: Record<string, unknown>;
  concluded_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Channel constraints for content generation
const CHANNEL_CONSTRAINTS: Record<string, Record<string, unknown>> = {
  twitter: {
    max_chars: 280,
    max_hashtags: 3,
    supports_images: true,
    supports_video: true,
  },
  instagram_feed: {
    max_chars: 2200,
    max_hashtags: 30,
    supports_images: true,
    supports_video: true,
    requires_image: true,
  },
  instagram_story: {
    max_chars: 125,
    supports_images: true,
    supports_video: true,
    max_duration: 15,
  },
  linkedin: {
    max_chars: 3000,
    max_hashtags: 5,
    supports_images: true,
    supports_video: true,
  },
  facebook: {
    max_chars: 63206,
    optimal_chars: 80,
    supports_images: true,
    supports_video: true,
  },
  email_subject: {
    max_chars: 60,
    optimal_chars: 40,
    supports_emoji: true,
  },
  google_ads_headline: {
    max_chars: 30,
    max_headlines: 15,
  },
  google_ads_description: {
    max_chars: 90,
    max_descriptions: 4,
  },
  sms: {
    max_chars: 160,
    supports_mms: true,
  },
};

// =====================================================
// Creative Brief Functions
// =====================================================

export async function listBriefs(
  tenantId: string,
  filters?: {
    status?: string;
    campaign_id?: string;
    objective?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CreativeBrief[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_creative_briefs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.campaign_id) {
    query = query.eq("campaign_id", filters.campaign_id);
  }
  if (filters?.objective) {
    query = query.eq("objective", filters.objective);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list briefs: ${error.message}`);
  }

  return data || [];
}

export async function getBrief(briefId: string): Promise<CreativeBrief | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_briefs")
    .select("*")
    .eq("id", briefId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get brief: ${error.message}`);
  }

  return data;
}

export async function createBrief(
  tenantId: string,
  brief: {
    name: string;
    description?: string;
    campaign_id?: string;
    campaign_name?: string;
    objective: string;
    target_audience?: string;
    audience_persona_id?: string;
    brand_id?: string;
    tone_profile_id?: string;
    primary_message?: string;
    supporting_messages?: string[];
    call_to_action?: string;
    visual_style?: string;
    color_scheme?: Record<string, unknown>;
    imagery_direction?: string;
    target_channels?: string[];
    inspiration_urls?: string[];
    competitor_refs?: string[];
    reference_assets?: string[];
    word_limits?: Record<string, number>;
    required_elements?: string[];
    forbidden_elements?: string[];
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<CreativeBrief> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_briefs")
    .insert({
      tenant_id: tenantId,
      ...brief,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create brief: ${error.message}`);
  }

  return data;
}

export async function updateBrief(
  briefId: string,
  updates: Partial<CreativeBrief>
): Promise<CreativeBrief> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_briefs")
    .update(updates)
    .eq("id", briefId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brief: ${error.message}`);
  }

  return data;
}

export async function approveBrief(
  briefId: string,
  userId: string
): Promise<CreativeBrief> {
  return updateBrief(briefId, {
    status: "approved",
    approved_by: userId,
    approved_at: new Date().toISOString(),
  } as Partial<CreativeBrief>);
}

export async function deleteBrief(briefId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_creative_briefs")
    .delete()
    .eq("id", briefId);

  if (error) {
    throw new Error(`Failed to delete brief: ${error.message}`);
  }
}

// =====================================================
// Creative Asset Functions
// =====================================================

export async function listAssets(
  tenantId: string,
  filters?: {
    brief_id?: string;
    channel?: string;
    asset_type?: string;
    status?: string;
    is_variant?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<CreativeAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_creative_assets")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.brief_id) {
    query = query.eq("brief_id", filters.brief_id);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.asset_type) {
    query = query.eq("asset_type", filters.asset_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.is_variant !== undefined) {
    query = query.eq("is_variant", filters.is_variant);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list assets: ${error.message}`);
  }

  return data || [];
}

export async function getAsset(assetId: string): Promise<CreativeAsset | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_assets")
    .select("*")
    .eq("id", assetId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get asset: ${error.message}`);
  }

  return data;
}

export async function createAsset(
  tenantId: string,
  asset: {
    name: string;
    description?: string;
    brief_id?: string;
    asset_type: string;
    channel: string;
    format?: string;
    headline?: string;
    subheadline?: string;
    body?: string;
    call_to_action?: string;
    visual_description?: string;
    hashtags?: string[];
    mentions?: string[];
    links?: Array<{ url: string; text: string; tracking?: string }>;
    content_blocks?: unknown[];
    variables?: Record<string, unknown>;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<CreativeAsset> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_assets")
    .insert({
      tenant_id: tenantId,
      ...asset,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  return data;
}

export async function createVariant(
  tenantId: string,
  originalAssetId: string,
  changes: {
    headline?: string;
    subheadline?: string;
    body?: string;
    call_to_action?: string;
    variant_label: string;
    variant_changes: string[];
  },
  userId?: string
): Promise<CreativeAsset> {
  const original = await getAsset(originalAssetId);
  if (!original) {
    throw new Error("Original asset not found");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_assets")
    .insert({
      tenant_id: tenantId,
      name: `${original.name} - Variant ${changes.variant_label}`,
      description: original.description,
      brief_id: original.brief_id,
      asset_type: original.asset_type,
      channel: original.channel,
      format: original.format,
      headline: changes.headline || original.headline,
      subheadline: changes.subheadline || original.subheadline,
      body: changes.body || original.body,
      call_to_action: changes.call_to_action || original.call_to_action,
      visual_description: original.visual_description,
      hashtags: original.hashtags,
      mentions: original.mentions,
      links: original.links,
      content_blocks: original.content_blocks,
      variables: original.variables,
      is_variant: true,
      variant_of: originalAssetId,
      variant_label: changes.variant_label,
      variant_changes: changes.variant_changes,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create variant: ${error.message}`);
  }

  return data;
}

export async function updateAsset(
  assetId: string,
  updates: Partial<CreativeAsset>
): Promise<CreativeAsset> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_assets")
    .update(updates)
    .eq("id", assetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return data;
}

export async function reviewAsset(
  assetId: string,
  status: "approved" | "review",
  userId: string
): Promise<CreativeAsset> {
  const updates: Partial<CreativeAsset> = {
    status,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  };

  if (status === "approved") {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }

  return updateAsset(assetId, updates);
}

export async function updateAssetPerformance(
  assetId: string,
  performance: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
  }
): Promise<CreativeAsset> {
  const asset = await getAsset(assetId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const impressions = (asset.impressions || 0) + (performance.impressions || 0);
  const clicks = (asset.clicks || 0) + (performance.clicks || 0);
  const conversions = (asset.conversions || 0) + (performance.conversions || 0);
  const engagement_rate = impressions > 0 ? clicks / impressions : null;

  return updateAsset(assetId, {
    impressions,
    clicks,
    conversions,
    engagement_rate,
  } as Partial<CreativeAsset>);
}

export async function deleteAsset(assetId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_creative_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
}

// =====================================================
// AI Creative Generation
// =====================================================

export async function generateCreative(
  tenantId: string,
  options: {
    brief_id?: string;
    template_id?: string;
    prompt: string;
    channels: string[];
    variants_count?: number;
    context?: Record<string, unknown>;
  },
  userId?: string
): Promise<{
  generation: CreativeGeneration;
  assets: CreativeAsset[];
}> {
  const supabase = await createClient();
  const startTime = Date.now();

  // Create generation record
  const { data: generation, error: genError } = await supabase
    .from("synthex_library_creative_generations")
    .insert({
      tenant_id: tenantId,
      brief_id: options.brief_id,
      template_id: options.template_id,
      input_prompt: options.prompt,
      input_context: options.context || {},
      channels_requested: options.channels,
      variants_requested: options.variants_count || 1,
      ai_model: "claude-sonnet-4-5-20250514",
      status: "generating",
      created_by: userId,
    })
    .select()
    .single();

  if (genError) {
    throw new Error(`Failed to create generation record: ${genError.message}`);
  }

  try {
    const client = getAnthropicClient();
    const assets: CreativeAsset[] = [];

    // Load brief if provided
    let brief: CreativeBrief | null = null;
    if (options.brief_id) {
      brief = await getBrief(options.brief_id);
    }

    // Load template if provided
    let template: CreativeTemplate | null = null;
    if (options.template_id) {
      template = await getTemplate(options.template_id);
    }

    // Generate content for each channel
    for (const channel of options.channels) {
      const constraints = CHANNEL_CONSTRAINTS[channel] || { max_chars: 5000 };

      const systemPrompt = `You are an expert marketing copywriter creating content for ${channel}.
Channel constraints: ${JSON.stringify(constraints)}

${brief ? `
Brief Details:
- Objective: ${brief.objective}
- Target Audience: ${brief.target_audience || "General"}
- Primary Message: ${brief.primary_message || "N/A"}
- Call to Action: ${brief.call_to_action || "N/A"}
- Tone/Style: ${brief.visual_style || "Professional"}
- Word Limits: ${JSON.stringify(brief.word_limits)}
${brief.required_elements?.length ? `- Must Include: ${brief.required_elements.join(", ")}` : ""}
${brief.forbidden_elements?.length ? `- Must NOT Include: ${brief.forbidden_elements.join(", ")}` : ""}
` : ""}

${template ? `
Template Instructions:
${template.ai_instructions || "Follow standard best practices."}
Tone: ${template.tone || "Professional"}
Style: ${template.style || "Clear and concise"}
` : ""}

Return your response as JSON with this structure:
{
  "headline": "string",
  "subheadline": "string or null",
  "body": "string",
  "call_to_action": "string",
  "hashtags": ["array", "of", "hashtags"] or null,
  "visual_description": "description for image generation",
  "quality_score": 0-100,
  "readability_score": 0-100,
  "engagement_prediction": 0-100,
  "reasoning": "explain your creative choices"
}`;

      const variantsToGenerate = options.variants_count || 1;

      for (let v = 0; v < variantsToGenerate; v++) {
        const variantPrompt = v > 0
          ? `${options.prompt}\n\nThis is variant ${v + 1}. Create a distinctly different version while maintaining the core message.`
          : options.prompt;

        const response = await client.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: variantPrompt,
            },
          ],
          system: systemPrompt,
        });

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          continue;
        }

        let parsed: Record<string, unknown>;
        try {
          // Extract JSON from response
          const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            continue;
          }
        } catch {
          continue;
        }

        // Determine asset type based on channel
        let assetType = "social_post";
        if (channel.includes("email")) {
assetType = "email";
}
        if (channel.includes("google_ads")) {
assetType = "ad_copy";
}
        if (channel.includes("sms")) {
assetType = "sms";
}

        // Create asset
        const asset = await createAsset(
          tenantId,
          {
            name: `${channel} - ${parsed.headline || "Generated Content"}`.slice(0, 100),
            description: `AI-generated content for ${channel}`,
            brief_id: options.brief_id,
            asset_type: assetType,
            channel,
            headline: parsed.headline as string,
            subheadline: parsed.subheadline as string | undefined,
            body: parsed.body as string,
            call_to_action: parsed.call_to_action as string,
            visual_description: parsed.visual_description as string | undefined,
            hashtags: parsed.hashtags as string[] | undefined,
          },
          userId
        );

        // Update with AI metadata
        await updateAsset(asset.id, {
          ai_model: "claude-sonnet-4-5-20250514",
          ai_prompt: options.prompt,
          ai_reasoning: parsed.reasoning as string,
          quality_score: parsed.quality_score as number,
          readability_score: parsed.readability_score as number,
          engagement_prediction: parsed.engagement_prediction as number,
          tokens_used: response.usage.input_tokens + response.usage.output_tokens,
          is_variant: v > 0,
          variant_label: v > 0 ? String.fromCharCode(65 + v) : undefined,
        } as Partial<CreativeAsset>);

        assets.push(asset);
      }
    }

    // Update generation record
    const generationTime = Date.now() - startTime;
    const { data: updatedGen, error: updateError } = await supabase
      .from("synthex_library_creative_generations")
      .update({
        assets_generated: assets.map((a) => a.id),
        generation_count: assets.length,
        generation_time_ms: generationTime,
        status: assets.length > 0 ? "completed" : "partial",
      })
      .eq("id", generation.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update generation: ${updateError.message}`);
    }

    return { generation: updatedGen, assets };
  } catch (error) {
    lastFailureTime = Date.now();

    // Update generation as failed
    await supabase
      .from("synthex_library_creative_generations")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", generation.id);

    throw error;
  }
}

export async function regenerateAsset(
  assetId: string,
  instructions: string,
  userId?: string
): Promise<CreativeAsset> {
  const asset = await getAsset(assetId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const client = getAnthropicClient();
  const constraints = CHANNEL_CONSTRAINTS[asset.channel] || { max_chars: 5000 };

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Original content:
Headline: ${asset.headline}
Body: ${asset.body}
CTA: ${asset.call_to_action}

Revision instructions: ${instructions}

Create an improved version following the instructions.`,
      },
    ],
    system: `You are an expert marketing copywriter revising content for ${asset.channel}.
Channel constraints: ${JSON.stringify(constraints)}

Return your response as JSON with this structure:
{
  "headline": "string",
  "subheadline": "string or null",
  "body": "string",
  "call_to_action": "string",
  "hashtags": ["array"] or null,
  "quality_score": 0-100,
  "reasoning": "explain your revisions"
}`,
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON in response");
    }
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return updateAsset(assetId, {
    headline: parsed.headline as string,
    subheadline: parsed.subheadline as string | undefined,
    body: parsed.body as string,
    call_to_action: parsed.call_to_action as string,
    hashtags: parsed.hashtags as string[] | undefined,
    quality_score: parsed.quality_score as number,
    ai_reasoning: `Revision: ${parsed.reasoning}`,
    status: "draft",
  } as Partial<CreativeAsset>);
}

// =====================================================
// Template Functions
// =====================================================

export async function listTemplates(
  tenantId: string,
  filters?: {
    channel?: string;
    asset_type?: string;
    category?: string;
    is_active?: boolean;
    limit?: number;
  }
): Promise<CreativeTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_creative_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("usage_count", { ascending: false });

  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.asset_type) {
    query = query.eq("asset_type", filters.asset_type);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  return data || [];
}

export async function getTemplate(templateId: string): Promise<CreativeTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get template: ${error.message}`);
  }

  return data;
}

export async function createTemplate(
  tenantId: string,
  template: {
    name: string;
    description?: string;
    category?: string;
    channel: string;
    asset_type: string;
    format?: string;
    headline_template?: string;
    body_template?: string;
    cta_template?: string;
    variables?: Array<{ name: string; type: string; required: boolean }>;
    tone?: string;
    style?: string;
    ai_instructions?: string;
    example_outputs?: unknown[];
    tags?: string[];
  },
  userId?: string
): Promise<CreativeTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_templates")
    .insert({
      tenant_id: tenantId,
      ...template,
      is_active: true,
      is_default: false,
      usage_count: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return data;
}

export async function updateTemplate(
  templateId: string,
  updates: Partial<CreativeTemplate>
): Promise<CreativeTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_templates")
    .update(updates)
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return data;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_creative_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}

// =====================================================
// Feedback Functions
// =====================================================

export async function addFeedback(
  tenantId: string,
  assetId: string,
  feedback: {
    rating?: number;
    feedback_type?: "approve" | "reject" | "request_revision" | "flag";
    feedback_text?: string;
    issues?: Array<{ type: string; description: string }>;
    revision_instructions?: string;
  },
  userId?: string
): Promise<CreativeFeedback> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_feedback")
    .insert({
      tenant_id: tenantId,
      asset_id: assetId,
      ...feedback,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add feedback: ${error.message}`);
  }

  // Update asset status based on feedback
  if (feedback.feedback_type === "approve") {
    await reviewAsset(assetId, "approved", userId || "");
  } else if (feedback.feedback_type === "reject") {
    await updateAsset(assetId, { status: "archived" } as Partial<CreativeAsset>);
  }

  return data;
}

export async function listFeedback(
  assetId: string
): Promise<CreativeFeedback[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_feedback")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list feedback: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// A/B Test Functions
// =====================================================

export async function listABTests(
  tenantId: string,
  filters?: {
    status?: string;
    channel?: string;
    limit?: number;
  }
): Promise<CreativeABTest[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_creative_ab_tests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list A/B tests: ${error.message}`);
  }

  return data || [];
}

export async function getABTest(testId: string): Promise<CreativeABTest | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get A/B test: ${error.message}`);
  }

  return data;
}

export async function createABTest(
  tenantId: string,
  test: {
    name: string;
    description?: string;
    hypothesis?: string;
    control_asset_id: string;
    variant_asset_ids: string[];
    channel: string;
    traffic_split: Record<string, number>;
    primary_metric: string;
    secondary_metrics?: string[];
    audience_filter?: Record<string, unknown>;
    sample_size_target?: number;
    start_date?: string;
    end_date?: string;
    auto_select_winner?: boolean;
  },
  userId?: string
): Promise<CreativeABTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .insert({
      tenant_id: tenantId,
      ...test,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create A/B test: ${error.message}`);
  }

  return data;
}

export async function startABTest(testId: string): Promise<CreativeABTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .update({
      status: "running",
      start_date: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start A/B test: ${error.message}`);
  }

  return data;
}

export async function pauseABTest(testId: string): Promise<CreativeABTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .update({ status: "paused" })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to pause A/B test: ${error.message}`);
  }

  return data;
}

export async function concludeABTest(
  testId: string,
  results: {
    winner_asset_id?: string;
    winning_confidence?: number;
    results_summary: Record<string, unknown>;
  }
): Promise<CreativeABTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .update({
      status: "completed",
      concluded_at: new Date().toISOString(),
      ...results,
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to conclude A/B test: ${error.message}`);
  }

  return data;
}

export async function cancelABTest(testId: string): Promise<CreativeABTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_creative_ab_tests")
    .update({
      status: "cancelled",
      concluded_at: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel A/B test: ${error.message}`);
  }

  return data;
}

// =====================================================
// Stats & Utilities
// =====================================================

export async function getCreativeStats(tenantId: string): Promise<{
  total_briefs: number;
  total_assets: number;
  total_templates: number;
  total_generations: number;
  active_ab_tests: number;
  avg_quality_score: number | null;
  assets_by_channel: Record<string, number>;
  assets_by_status: Record<string, number>;
}> {
  const supabase = await createClient();

  // Get counts
  const [
    { count: briefCount },
    { count: assetCount },
    { count: templateCount },
    { count: generationCount },
    { count: activeTestCount },
  ] = await Promise.all([
    supabase
      .from("synthex_library_creative_briefs")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_creative_assets")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_creative_templates")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_creative_generations")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_creative_ab_tests")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "running"),
  ]);

  // Get average quality score
  const { data: qualityData } = await supabase
    .from("synthex_library_creative_assets")
    .select("quality_score")
    .eq("tenant_id", tenantId)
    .not("quality_score", "is", null);

  const avgQuality = qualityData?.length
    ? qualityData.reduce((sum, a) => sum + (a.quality_score || 0), 0) / qualityData.length
    : null;

  // Get assets by channel
  const { data: channelData } = await supabase
    .from("synthex_library_creative_assets")
    .select("channel")
    .eq("tenant_id", tenantId);

  const assetsByChannel: Record<string, number> = {};
  channelData?.forEach((a) => {
    assetsByChannel[a.channel] = (assetsByChannel[a.channel] || 0) + 1;
  });

  // Get assets by status
  const { data: statusData } = await supabase
    .from("synthex_library_creative_assets")
    .select("status")
    .eq("tenant_id", tenantId);

  const assetsByStatus: Record<string, number> = {};
  statusData?.forEach((a) => {
    assetsByStatus[a.status] = (assetsByStatus[a.status] || 0) + 1;
  });

  return {
    total_briefs: briefCount || 0,
    total_assets: assetCount || 0,
    total_templates: templateCount || 0,
    total_generations: generationCount || 0,
    active_ab_tests: activeTestCount || 0,
    avg_quality_score: avgQuality,
    assets_by_channel: assetsByChannel,
    assets_by_status: assetsByStatus,
  };
}

export function getChannelConstraints(channel: string): Record<string, unknown> {
  return CHANNEL_CONSTRAINTS[channel] || { max_chars: 5000, supports_images: true };
}

export function getSupportedChannels(): string[] {
  return Object.keys(CHANNEL_CONSTRAINTS);
}
