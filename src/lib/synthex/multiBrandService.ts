/**
 * Synthex Multi-Brand Service
 * Phase D11: Multi-Brand Profile Engine
 *
 * Support for multiple brand profiles per tenant with
 * asset management, guidelines, and brand switching.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

// =====================================================
// Types
// =====================================================

export interface BrandProfile {
  id: string;
  tenant_id: string;
  name: string;
  slug?: string;
  description?: string;
  tagline?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  color_palette: Record<string, string>[];
  heading_font?: string;
  body_font?: string;
  font_sizes: Record<string, string>;
  tone_profile_id?: string;
  voice_keywords: string[];
  personality_traits: Array<{ trait: string; score: number }>;
  value_proposition?: string;
  key_messages: string[];
  elevator_pitch?: string;
  mission_statement?: string;
  vision_statement?: string;
  email?: string;
  phone?: string;
  website?: string;
  address: Record<string, string>;
  social_links: Record<string, string>;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  copyright_text?: string;
  privacy_policy_url?: string;
  terms_url?: string;
  is_default: boolean;
  is_active: boolean;
  use_for_channels: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BrandAsset {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  description?: string;
  asset_type: "logo" | "icon" | "image" | "font" | "video" | "document" | "template" | "illustration" | "pattern";
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  dimensions: { width?: number; height?: number };
  variants: Array<{ name: string; url: string; size?: string }>;
  use_cases: string[];
  usage_guidelines?: string;
  status: "active" | "archived" | "pending";
  is_primary: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
}

export interface BrandGuideline {
  id: string;
  tenant_id: string;
  brand_id: string;
  title: string;
  category: "logo" | "color" | "typography" | "imagery" | "voice" | "layout" | "spacing" | "iconography" | "motion" | "general";
  priority: number;
  description?: string;
  dos: string[];
  donts: string[];
  examples: Array<{ type: string; url?: string; caption?: string }>;
  related_assets: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BrandTemplate {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  description?: string;
  template_type: "email" | "social_post" | "ad" | "landing_page" | "document" | "presentation" | "newsletter" | "signature";
  channel?: string;
  content: Record<string, unknown>;
  preview_url?: string;
  thumbnail_url?: string;
  variables: Array<{ name: string; type: string; required: boolean; default?: string }>;
  is_default: boolean;
  is_active: boolean;
  usage_count: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BrandValidation {
  id: string;
  tenant_id: string;
  brand_id: string;
  content_type: string;
  content_id?: string;
  content_snapshot?: Record<string, unknown>;
  is_compliant: boolean;
  compliance_score?: number;
  issues: Array<{
    category: string;
    severity: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
  ai_model?: string;
  ai_suggestions: string[];
  status: "pending" | "processing" | "completed" | "failed";
  validated_at: string;
  validated_by?: string;
}

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
      console.warn("[MultiBrandService] Anthropic SDK not available");
      anthropicFailed = true;
      return null;
    }
  }
  return anthropicClient;
}

// =====================================================
// Brand Profile CRUD
// =====================================================

/**
 * List brand profiles for a tenant
 */
export async function listBrands(
  tenantId: string,
  filters?: { is_active?: boolean; is_default?: boolean }
): Promise<BrandProfile[]> {
  let query = supabaseAdmin
    .from("synthex_library_brand_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_default !== undefined) {
    query = query.eq("is_default", filters.is_default);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list brands: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a brand profile by ID
 */
export async function getBrand(brandId: string): Promise<BrandProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .select("*")
    .eq("id", brandId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get brand: ${error.message}`);
  }

  return data;
}

/**
 * Get the default brand for a tenant
 */
export async function getDefaultBrand(tenantId: string): Promise<BrandProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get default brand: ${error.message}`);
  }

  return data;
}

/**
 * Create a brand profile
 */
export async function createBrand(
  tenantId: string,
  data: Partial<BrandProfile>,
  userId?: string
): Promise<BrandProfile> {
  const slug = data.slug || data.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data: brand, error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      slug,
      description: data.description,
      tagline: data.tagline,
      logo_url: data.logo_url,
      logo_dark_url: data.logo_dark_url,
      favicon_url: data.favicon_url,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      accent_color: data.accent_color,
      text_color: data.text_color,
      background_color: data.background_color,
      color_palette: data.color_palette || [],
      heading_font: data.heading_font,
      body_font: data.body_font,
      font_sizes: data.font_sizes || {},
      tone_profile_id: data.tone_profile_id,
      voice_keywords: data.voice_keywords || [],
      personality_traits: data.personality_traits || [],
      value_proposition: data.value_proposition,
      key_messages: data.key_messages || [],
      elevator_pitch: data.elevator_pitch,
      mission_statement: data.mission_statement,
      vision_statement: data.vision_statement,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address || {},
      social_links: data.social_links || {},
      legal_name: data.legal_name,
      registration_number: data.registration_number,
      tax_id: data.tax_id,
      copyright_text: data.copyright_text,
      privacy_policy_url: data.privacy_policy_url,
      terms_url: data.terms_url,
      is_default: data.is_default ?? false,
      is_active: data.is_active ?? true,
      use_for_channels: data.use_for_channels || [],
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }

  return brand;
}

/**
 * Update a brand profile
 */
export async function updateBrand(
  brandId: string,
  data: Partial<BrandProfile>
): Promise<BrandProfile> {
  const { id, tenant_id, created_at, created_by, ...updateData } = data as BrandProfile;

  const { data: brand, error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .update(updateData)
    .eq("id", brandId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }

  return brand;
}

/**
 * Delete a brand profile
 */
export async function deleteBrand(brandId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .delete()
    .eq("id", brandId);

  if (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }
}

/**
 * Set a brand as default
 */
export async function setDefaultBrand(tenantId: string, brandId: string): Promise<void> {
  // The trigger handles clearing other defaults
  const { error } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .update({ is_default: true })
    .eq("id", brandId);

  if (error) {
    throw new Error(`Failed to set default brand: ${error.message}`);
  }
}

/**
 * Duplicate a brand profile
 */
export async function duplicateBrand(
  brandId: string,
  newName: string,
  userId?: string
): Promise<BrandProfile> {
  const original = await getBrand(brandId);
  if (!original) {
    throw new Error("Brand not found");
  }

  const { id, created_at, updated_at, slug, is_default, ...brandData } = original;

  return createBrand(
    original.tenant_id,
    {
      ...brandData,
      name: newName,
      is_default: false,
    },
    userId
  );
}

// =====================================================
// Brand Assets
// =====================================================

/**
 * List assets for a brand
 */
export async function listAssets(
  brandId: string,
  filters?: { asset_type?: string; status?: string }
): Promise<BrandAsset[]> {
  let query = supabaseAdmin
    .from("synthex_library_brand_assets")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (filters?.asset_type) {
    query = query.eq("asset_type", filters.asset_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list assets: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a brand asset
 */
export async function createAsset(
  tenantId: string,
  brandId: string,
  data: Partial<BrandAsset>,
  userId?: string
): Promise<BrandAsset> {
  const { data: asset, error } = await supabaseAdmin
    .from("synthex_library_brand_assets")
    .insert({
      tenant_id: tenantId,
      brand_id: brandId,
      name: data.name,
      description: data.description,
      asset_type: data.asset_type,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      mime_type: data.mime_type,
      dimensions: data.dimensions || {},
      variants: data.variants || [],
      use_cases: data.use_cases || [],
      usage_guidelines: data.usage_guidelines,
      status: data.status || "active",
      is_primary: data.is_primary ?? false,
      tags: data.tags || [],
      metadata: data.metadata || {},
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  return asset;
}

/**
 * Update a brand asset
 */
export async function updateAsset(
  assetId: string,
  data: Partial<BrandAsset>
): Promise<BrandAsset> {
  const { id, tenant_id, brand_id, created_at, uploaded_by, ...updateData } = data as BrandAsset;

  const { data: asset, error } = await supabaseAdmin
    .from("synthex_library_brand_assets")
    .update(updateData)
    .eq("id", assetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return asset;
}

/**
 * Delete a brand asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_brand_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
}

// =====================================================
// Brand Guidelines
// =====================================================

/**
 * List guidelines for a brand
 */
export async function listGuidelines(
  brandId: string,
  category?: string
): Promise<BrandGuideline[]> {
  let query = supabaseAdmin
    .from("synthex_library_brand_guidelines")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list guidelines: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a brand guideline
 */
export async function createGuideline(
  tenantId: string,
  brandId: string,
  data: Partial<BrandGuideline>,
  userId?: string
): Promise<BrandGuideline> {
  const { data: guideline, error } = await supabaseAdmin
    .from("synthex_library_brand_guidelines")
    .insert({
      tenant_id: tenantId,
      brand_id: brandId,
      title: data.title,
      category: data.category,
      priority: data.priority ?? 0,
      description: data.description,
      dos: data.dos || [],
      donts: data.donts || [],
      examples: data.examples || [],
      related_assets: data.related_assets || [],
      is_active: data.is_active ?? true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create guideline: ${error.message}`);
  }

  return guideline;
}

/**
 * Update a brand guideline
 */
export async function updateGuideline(
  guidelineId: string,
  data: Partial<BrandGuideline>
): Promise<BrandGuideline> {
  const { id, tenant_id, brand_id, created_at, created_by, ...updateData } = data as BrandGuideline;

  const { data: guideline, error } = await supabaseAdmin
    .from("synthex_library_brand_guidelines")
    .update(updateData)
    .eq("id", guidelineId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update guideline: ${error.message}`);
  }

  return guideline;
}

/**
 * Delete a brand guideline
 */
export async function deleteGuideline(guidelineId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_brand_guidelines")
    .delete()
    .eq("id", guidelineId);

  if (error) {
    throw new Error(`Failed to delete guideline: ${error.message}`);
  }
}

// =====================================================
// Brand Templates
// =====================================================

/**
 * List templates for a brand
 */
export async function listTemplates(
  brandId: string,
  filters?: { template_type?: string; channel?: string }
): Promise<BrandTemplate[]> {
  let query = supabaseAdmin
    .from("synthex_library_brand_templates")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  if (filters?.template_type) {
    query = query.eq("template_type", filters.template_type);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a brand template
 */
export async function createTemplate(
  tenantId: string,
  brandId: string,
  data: Partial<BrandTemplate>,
  userId?: string
): Promise<BrandTemplate> {
  const { data: template, error } = await supabaseAdmin
    .from("synthex_library_brand_templates")
    .insert({
      tenant_id: tenantId,
      brand_id: brandId,
      name: data.name,
      description: data.description,
      template_type: data.template_type,
      channel: data.channel,
      content: data.content || {},
      preview_url: data.preview_url,
      thumbnail_url: data.thumbnail_url,
      variables: data.variables || [],
      is_default: data.is_default ?? false,
      is_active: data.is_active ?? true,
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return template;
}

/**
 * Update a brand template
 */
export async function updateTemplate(
  templateId: string,
  data: Partial<BrandTemplate>
): Promise<BrandTemplate> {
  const { id, tenant_id, brand_id, created_at, created_by, usage_count, ...updateData } = data as BrandTemplate;

  const { data: template, error } = await supabaseAdmin
    .from("synthex_library_brand_templates")
    .update(updateData)
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return template;
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("increment", {
    table_name: "synthex_library_brand_templates",
    row_id: templateId,
    column_name: "usage_count",
  });

  if (error) {
    // Fallback to manual update
    const { data: template } = await supabaseAdmin
      .from("synthex_library_brand_templates")
      .select("usage_count")
      .eq("id", templateId)
      .single();

    if (template) {
      await supabaseAdmin
        .from("synthex_library_brand_templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", templateId);
    }
  }
}

/**
 * Delete a brand template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_brand_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}

// =====================================================
// Brand Switching
// =====================================================

/**
 * Log a brand switch
 */
export async function logBrandSwitch(
  tenantId: string,
  fromBrandId: string | null,
  toBrandId: string,
  userId: string,
  context?: string,
  contextId?: string
): Promise<void> {
  await supabaseAdmin.from("synthex_library_brand_switches").insert({
    tenant_id: tenantId,
    from_brand_id: fromBrandId,
    to_brand_id: toBrandId,
    context,
    context_id: contextId,
    switched_by: userId,
  });
}

/**
 * Get brand switch history
 */
export async function getSwitchHistory(
  tenantId: string,
  limit = 50
): Promise<Array<{
  id: string;
  from_brand_id: string | null;
  to_brand_id: string;
  context?: string;
  switched_by: string;
  switched_at: string;
}>> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_brand_switches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("switched_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get switch history: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Brand Validation
// =====================================================

/**
 * Validate content against brand guidelines
 */
export async function validateContent(
  tenantId: string,
  brandId: string,
  content: Record<string, unknown>,
  contentType: string,
  contentId?: string,
  userId?: string
): Promise<BrandValidation> {
  const brand = await getBrand(brandId);
  if (!brand) {
    throw new Error("Brand not found");
  }

  const guidelines = await listGuidelines(brandId);

  // Create validation record
  const { data: validation, error: createError } = await supabaseAdmin
    .from("synthex_library_brand_validations")
    .insert({
      tenant_id: tenantId,
      brand_id: brandId,
      content_type: contentType,
      content_id: contentId,
      content_snapshot: content,
      is_compliant: true,
      status: "processing",
      validated_by: userId,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create validation: ${createError.message}`);
  }

  const anthropic = await getAnthropicClient();

  if (!anthropic) {
    await supabaseAdmin
      .from("synthex_library_brand_validations")
      .update({
        status: "failed",
        issues: [{ category: "system", severity: "error", message: "AI service unavailable" }],
      })
      .eq("id", validation.id);

    return { ...validation, status: "failed" };
  }

  try {
    const prompt = buildValidationPrompt(brand, guidelines, content, contentType);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseContent = response.content[0];
    if (responseContent.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = JSON.parse(responseContent.text);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("synthex_library_brand_validations")
      .update({
        is_compliant: result.is_compliant,
        compliance_score: result.compliance_score,
        issues: result.issues || [],
        ai_model: "claude-sonnet-4-5-20250514",
        ai_suggestions: result.suggestions || [],
        status: "completed",
      })
      .eq("id", validation.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabaseAdmin
      .from("synthex_library_brand_validations")
      .update({
        status: "failed",
        issues: [{ category: "system", severity: "error", message: errorMessage }],
      })
      .eq("id", validation.id);

    throw new Error(`Validation failed: ${errorMessage}`);
  }
}

function buildValidationPrompt(
  brand: BrandProfile,
  guidelines: BrandGuideline[],
  content: Record<string, unknown>,
  contentType: string
): string {
  return `Validate this ${contentType} content against the brand guidelines.

BRAND: "${brand.name}"
${brand.tagline ? `Tagline: ${brand.tagline}` : ""}
${brand.voice_keywords.length > 0 ? `Voice: ${brand.voice_keywords.join(", ")}` : ""}

VISUAL IDENTITY:
- Primary Color: ${brand.primary_color || "Not specified"}
- Secondary Color: ${brand.secondary_color || "Not specified"}
- Accent Color: ${brand.accent_color || "Not specified"}
- Heading Font: ${brand.heading_font || "Not specified"}
- Body Font: ${brand.body_font || "Not specified"}

BRAND GUIDELINES:
${guidelines.map((g) => `
[${g.category.toUpperCase()}] ${g.title}
${g.description || ""}
DO: ${g.dos.join(", ") || "None specified"}
DON'T: ${g.donts.join(", ") || "None specified"}
`).join("\n")}

CONTENT TO VALIDATE:
${JSON.stringify(content, null, 2)}

Analyze the content and return a JSON object:
{
  "is_compliant": true/false,
  "compliance_score": 0.0-1.0,
  "issues": [
    {
      "category": "color|typography|voice|imagery|layout|general",
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": ["General improvement suggestions"]
}

Return ONLY valid JSON.`;
}

/**
 * Get validation history
 */
export async function listValidations(
  brandId: string,
  limit = 20
): Promise<BrandValidation[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_brand_validations")
    .select("*")
    .eq("brand_id", brandId)
    .order("validated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list validations: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Brand Context for AI
// =====================================================

/**
 * Get brand context for AI content generation
 */
export async function getBrandContextForAI(
  brandId: string
): Promise<{
  brand: Partial<BrandProfile>;
  guidelines: BrandGuideline[];
  assets: BrandAsset[];
}> {
  const brand = await getBrand(brandId);
  if (!brand) {
    throw new Error("Brand not found");
  }

  const guidelines = await listGuidelines(brandId);
  const assets = await listAssets(brandId, { status: "active" });

  return {
    brand: {
      name: brand.name,
      tagline: brand.tagline,
      voice_keywords: brand.voice_keywords,
      personality_traits: brand.personality_traits,
      value_proposition: brand.value_proposition,
      key_messages: brand.key_messages,
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      accent_color: brand.accent_color,
      heading_font: brand.heading_font,
      body_font: brand.body_font,
    },
    guidelines,
    assets: assets.filter((a) => a.is_primary || a.asset_type === "logo"),
  };
}

// =====================================================
// Stats
// =====================================================

/**
 * Get brand statistics
 */
export async function getBrandStats(tenantId: string): Promise<{
  total_brands: number;
  active_brands: number;
  total_assets: number;
  total_templates: number;
  total_guidelines: number;
  recent_switches: number;
  brands_by_channel: Array<{ channel: string; count: number }>;
}> {
  const { data: brands } = await supabaseAdmin
    .from("synthex_library_brand_profiles")
    .select("id, is_active, use_for_channels")
    .eq("tenant_id", tenantId);

  const brandIds = brands?.map((b) => b.id) || [];

  const { count: assetCount } = await supabaseAdmin
    .from("synthex_library_brand_assets")
    .select("id", { count: "exact", head: true })
    .in("brand_id", brandIds);

  const { count: templateCount } = await supabaseAdmin
    .from("synthex_library_brand_templates")
    .select("id", { count: "exact", head: true })
    .in("brand_id", brandIds);

  const { count: guidelineCount } = await supabaseAdmin
    .from("synthex_library_brand_guidelines")
    .select("id", { count: "exact", head: true })
    .in("brand_id", brandIds);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count: switchCount } = await supabaseAdmin
    .from("synthex_library_brand_switches")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("switched_at", oneWeekAgo.toISOString());

  // Count brands by channel
  const channelCounts: Record<string, number> = {};
  for (const brand of brands || []) {
    for (const channel of brand.use_for_channels || []) {
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    }
  }

  return {
    total_brands: brands?.length || 0,
    active_brands: brands?.filter((b) => b.is_active).length || 0,
    total_assets: assetCount || 0,
    total_templates: templateCount || 0,
    total_guidelines: guidelineCount || 0,
    recent_switches: switchCount || 0,
    brands_by_channel: Object.entries(channelCounts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count),
  };
}
