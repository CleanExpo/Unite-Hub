/**
 * Synthex Tone Service
 * Phase D10: AI Tone Manager
 *
 * AI-powered tone profiles for consistent brand voice
 * with content transformation and analysis capabilities.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

// =====================================================
// Types
// =====================================================

export interface ToneProfile {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  slug?: string;
  formality: number;
  enthusiasm: number;
  confidence: number;
  friendliness: number;
  humor: number;
  urgency: number;
  empathy: number;
  authority: number;
  sentence_length: "short" | "medium" | "long" | "mixed";
  vocabulary_level: "simple" | "intermediate" | "advanced" | "technical";
  use_contractions: boolean;
  use_first_person: boolean;
  use_second_person: boolean;
  active_voice_preference: number;
  preferred_words: string[];
  avoided_words: string[];
  industry_jargon: boolean;
  emoji_usage: "none" | "minimal" | "moderate" | "frequent";
  example_greetings: string[];
  example_closings: string[];
  example_ctas: string[];
  example_content?: string;
  ai_instructions?: string;
  negative_examples?: string;
  use_cases: string[];
  is_default: boolean;
  status: "active" | "draft" | "archived";
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ToneTransformation {
  id: string;
  tenant_id: string;
  tone_profile_id?: string;
  original_content: string;
  transformed_content: string;
  content_type?: string;
  tone_match_score?: number;
  readability_score?: number;
  confidence?: number;
  changes_summary?: string;
  word_count_original: number;
  word_count_transformed: number;
  ai_model?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
  user_rating?: number;
  user_feedback?: string;
  created_at: string;
  created_by?: string;
}

export interface TonePreset {
  id: string;
  name: string;
  description?: string;
  category: string;
  formality: number;
  enthusiasm: number;
  confidence: number;
  friendliness: number;
  humor: number;
  urgency: number;
  empathy: number;
  authority: number;
  sentence_length?: string;
  vocabulary_level?: string;
  use_contractions: boolean;
  emoji_usage?: string;
  example_content?: string;
  is_active: boolean;
  is_premium: boolean;
  usage_count: number;
}

export interface ToneAnalysis {
  id: string;
  tenant_id: string;
  content: string;
  content_type?: string;
  content_id?: string;
  detected_formality: number;
  detected_enthusiasm: number;
  detected_confidence: number;
  detected_friendliness: number;
  detected_humor: number;
  detected_urgency: number;
  detected_empathy: number;
  detected_authority: number;
  primary_tone: string;
  secondary_tones: string[];
  tone_consistency_score: number;
  flesch_kincaid_grade?: number;
  average_sentence_length?: number;
  vocabulary_complexity?: string;
  closest_profile_id?: string;
  profile_match_score?: number;
  ai_model?: string;
  confidence?: number;
  analyzed_at: string;
}

export interface TransformInput {
  content: string;
  contentType?: string;
  preserveLength?: boolean;
  preserveStructure?: boolean;
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
      console.warn("[ToneService] Anthropic SDK not available");
      anthropicFailed = true;
      return null;
    }
  }
  return anthropicClient;
}

// =====================================================
// Tone Profile CRUD
// =====================================================

/**
 * List tone profiles for a tenant
 */
export async function listProfiles(
  tenantId: string,
  filters?: { status?: string; is_default?: boolean }
): Promise<ToneProfile[]> {
  let query = supabaseAdmin
    .from("synthex_library_tone_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.is_default !== undefined) {
    query = query.eq("is_default", filters.is_default);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list tone profiles: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a tone profile by ID
 */
export async function getProfile(profileId: string): Promise<ToneProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get tone profile: ${error.message}`);
  }

  return data;
}

/**
 * Create a tone profile
 */
export async function createProfile(
  tenantId: string,
  data: Partial<ToneProfile>,
  userId?: string
): Promise<ToneProfile> {
  // Generate slug from name if not provided
  const slug = data.slug || data.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data: profile, error } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      slug,
      formality: data.formality ?? 0.5,
      enthusiasm: data.enthusiasm ?? 0.5,
      confidence: data.confidence ?? 0.7,
      friendliness: data.friendliness ?? 0.6,
      humor: data.humor ?? 0.2,
      urgency: data.urgency ?? 0.3,
      empathy: data.empathy ?? 0.5,
      authority: data.authority ?? 0.5,
      sentence_length: data.sentence_length || "mixed",
      vocabulary_level: data.vocabulary_level || "intermediate",
      use_contractions: data.use_contractions ?? true,
      use_first_person: data.use_first_person ?? true,
      use_second_person: data.use_second_person ?? true,
      active_voice_preference: data.active_voice_preference ?? 0.8,
      preferred_words: data.preferred_words || [],
      avoided_words: data.avoided_words || [],
      industry_jargon: data.industry_jargon ?? false,
      emoji_usage: data.emoji_usage || "minimal",
      example_greetings: data.example_greetings || [],
      example_closings: data.example_closings || [],
      example_ctas: data.example_ctas || [],
      example_content: data.example_content,
      ai_instructions: data.ai_instructions,
      negative_examples: data.negative_examples,
      use_cases: data.use_cases || [],
      is_default: data.is_default ?? false,
      status: data.status || "active",
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tone profile: ${error.message}`);
  }

  return profile;
}

/**
 * Update a tone profile
 */
export async function updateProfile(
  profileId: string,
  data: Partial<ToneProfile>
): Promise<ToneProfile> {
  const { id, tenant_id, created_at, created_by, ...updateData } = data as ToneProfile;

  const { data: profile, error } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .update(updateData)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tone profile: ${error.message}`);
  }

  return profile;
}

/**
 * Delete a tone profile
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to delete tone profile: ${error.message}`);
  }
}

/**
 * Set a profile as default
 */
export async function setDefaultProfile(tenantId: string, profileId: string): Promise<void> {
  // Clear existing default
  await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .update({ is_default: false })
    .eq("tenant_id", tenantId)
    .eq("is_default", true);

  // Set new default
  const { error } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .update({ is_default: true })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to set default profile: ${error.message}`);
  }
}

/**
 * Create profile from a preset
 */
export async function createFromPreset(
  tenantId: string,
  presetId: string,
  name: string,
  userId?: string
): Promise<ToneProfile> {
  const { data: preset, error: presetError } = await supabaseAdmin
    .from("synthex_library_tone_presets")
    .select("*")
    .eq("id", presetId)
    .single();

  if (presetError || !preset) {
    throw new Error("Preset not found");
  }

  // Increment usage count
  await supabaseAdmin
    .from("synthex_library_tone_presets")
    .update({ usage_count: (preset.usage_count || 0) + 1 })
    .eq("id", presetId);

  return createProfile(
    tenantId,
    {
      name,
      description: `Based on "${preset.name}" preset`,
      formality: preset.formality,
      enthusiasm: preset.enthusiasm,
      confidence: preset.confidence,
      friendliness: preset.friendliness,
      humor: preset.humor,
      urgency: preset.urgency,
      empathy: preset.empathy,
      authority: preset.authority,
      sentence_length: preset.sentence_length,
      vocabulary_level: preset.vocabulary_level,
      use_contractions: preset.use_contractions,
      emoji_usage: preset.emoji_usage,
      example_content: preset.example_content,
    },
    userId
  );
}

// =====================================================
// Presets
// =====================================================

/**
 * List available presets
 */
export async function listPresets(category?: string): Promise<TonePreset[]> {
  let query = supabaseAdmin
    .from("synthex_library_tone_presets")
    .select("*")
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list presets: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Content Transformation
// =====================================================

/**
 * Transform content to match a tone profile
 */
export async function transformContent(
  tenantId: string,
  profileId: string,
  input: TransformInput,
  userId?: string
): Promise<ToneTransformation> {
  const profile = await getProfile(profileId);
  if (!profile) {
    throw new Error("Tone profile not found");
  }

  const startTime = Date.now();

  // Create transformation record
  const { data: transformation, error: createError } = await supabaseAdmin
    .from("synthex_library_tone_transformations")
    .insert({
      tenant_id: tenantId,
      tone_profile_id: profileId,
      original_content: input.content,
      transformed_content: "", // Will be updated
      content_type: input.contentType,
      word_count_original: input.content.split(/\s+/).length,
      word_count_transformed: 0,
      status: "processing",
      created_by: userId,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create transformation: ${createError.message}`);
  }

  const anthropic = await getAnthropicClient();

  if (!anthropic) {
    await supabaseAdmin
      .from("synthex_library_tone_transformations")
      .update({
        status: "failed",
        error_message: "AI service unavailable",
      })
      .eq("id", transformation.id);

    return { ...transformation, status: "failed", error_message: "AI service unavailable" };
  }

  try {
    const prompt = buildTransformPrompt(input.content, profile, input);

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
    const processingTime = Date.now() - startTime;

    // Update transformation with results
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("synthex_library_tone_transformations")
      .update({
        transformed_content: result.transformed_content,
        tone_match_score: result.tone_match_score || 0.85,
        readability_score: result.readability_score || 0.8,
        confidence: result.confidence || 0.85,
        changes_summary: result.changes_summary,
        word_count_transformed: result.transformed_content.split(/\s+/).length,
        ai_model: "claude-sonnet-4-5-20250514",
        tokens_used: response.usage.input_tokens + response.usage.output_tokens,
        processing_time_ms: processingTime,
        status: "completed",
      })
      .eq("id", transformation.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabaseAdmin
      .from("synthex_library_tone_transformations")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", transformation.id);

    throw new Error(`Transformation failed: ${errorMessage}`);
  }
}

function buildTransformPrompt(
  content: string,
  profile: ToneProfile,
  options: TransformInput
): string {
  const toneDescriptions = [];

  if (profile.formality >= 0.7) {
toneDescriptions.push("formal and professional");
} else if (profile.formality <= 0.3) {
toneDescriptions.push("casual and relaxed");
}

  if (profile.enthusiasm >= 0.7) {
toneDescriptions.push("enthusiastic and energetic");
}
  if (profile.friendliness >= 0.7) {
toneDescriptions.push("warm and friendly");
}
  if (profile.humor >= 0.5) {
toneDescriptions.push("with touches of humor");
}
  if (profile.urgency >= 0.7) {
toneDescriptions.push("with urgency");
}
  if (profile.empathy >= 0.7) {
toneDescriptions.push("empathetic and understanding");
}
  if (profile.authority >= 0.8) {
toneDescriptions.push("authoritative and expert");
}

  return `Rewrite this content to match the following tone profile:

TONE PROFILE: "${profile.name}"
${profile.description ? `Description: ${profile.description}` : ""}

TONE CHARACTERISTICS:
${toneDescriptions.length > 0 ? `- Overall: ${toneDescriptions.join(", ")}` : ""}
- Formality: ${Math.round(profile.formality * 100)}% (0=casual, 100=formal)
- Enthusiasm: ${Math.round(profile.enthusiasm * 100)}%
- Confidence: ${Math.round(profile.confidence * 100)}%
- Friendliness: ${Math.round(profile.friendliness * 100)}%

WRITING STYLE:
- Sentence length: ${profile.sentence_length}
- Vocabulary: ${profile.vocabulary_level}
- Use contractions: ${profile.use_contractions ? "Yes" : "No"}
- Emoji usage: ${profile.emoji_usage}
- Prefer active voice: ${Math.round(profile.active_voice_preference * 100)}%

${profile.preferred_words.length > 0 ? `PREFERRED WORDS: ${profile.preferred_words.join(", ")}` : ""}
${profile.avoided_words.length > 0 ? `AVOIDED WORDS: ${profile.avoided_words.join(", ")}` : ""}

${profile.example_content ? `EXAMPLE OF DESIRED TONE:\n${profile.example_content}` : ""}

${profile.ai_instructions ? `ADDITIONAL INSTRUCTIONS:\n${profile.ai_instructions}` : ""}

${profile.negative_examples ? `WHAT TO AVOID:\n${profile.negative_examples}` : ""}

ORIGINAL CONTENT:
${content}

${options.preserveLength ? "IMPORTANT: Keep the output approximately the same length as the original." : ""}
${options.preserveStructure ? "IMPORTANT: Preserve the overall structure (paragraphs, bullet points, etc.)." : ""}

Return a JSON object:
{
  "transformed_content": "The rewritten content matching the tone",
  "changes_summary": "Brief summary of key changes made",
  "tone_match_score": 0.0-1.0,
  "readability_score": 0.0-1.0,
  "confidence": 0.0-1.0
}

Return ONLY valid JSON.`;
}

/**
 * Get transformation history
 */
export async function listTransformations(
  tenantId: string,
  filters?: { profile_id?: string; limit?: number }
): Promise<ToneTransformation[]> {
  let query = supabaseAdmin
    .from("synthex_library_tone_transformations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.profile_id) {
    query = query.eq("tone_profile_id", filters.profile_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list transformations: ${error.message}`);
  }

  return data || [];
}

/**
 * Rate a transformation
 */
export async function rateTransformation(
  transformationId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_tone_transformations")
    .update({
      user_rating: rating,
      user_feedback: feedback,
    })
    .eq("id", transformationId);

  if (error) {
    throw new Error(`Failed to rate transformation: ${error.message}`);
  }
}

// =====================================================
// Content Analysis
// =====================================================

/**
 * Analyze content for tone characteristics
 */
export async function analyzeContent(
  tenantId: string,
  content: string,
  contentType?: string,
  contentId?: string
): Promise<ToneAnalysis> {
  const anthropic = await getAnthropicClient();

  if (!anthropic) {
    throw new Error("AI service unavailable");
  }

  const prompt = `Analyze the tone of this content:

CONTENT:
${content}

Return a JSON object with detected tone characteristics (all values 0.0-1.0):
{
  "detected_formality": 0.0-1.0,
  "detected_enthusiasm": 0.0-1.0,
  "detected_confidence": 0.0-1.0,
  "detected_friendliness": 0.0-1.0,
  "detected_humor": 0.0-1.0,
  "detected_urgency": 0.0-1.0,
  "detected_empathy": 0.0-1.0,
  "detected_authority": 0.0-1.0,
  "primary_tone": "professional|casual|urgent|friendly|authoritative|playful|empathetic",
  "secondary_tones": ["array of secondary tones"],
  "tone_consistency_score": 0.0-1.0,
  "flesch_kincaid_grade": 0-18,
  "average_sentence_length": number,
  "vocabulary_complexity": "simple|intermediate|advanced|technical",
  "confidence": 0.0-1.0
}

Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseContent = response.content[0];
    if (responseContent.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = JSON.parse(responseContent.text);

    // Find closest matching profile
    const profiles = await listProfiles(tenantId, { status: "active" });
    let closestProfile: ToneProfile | null = null;
    let bestScore = 0;

    for (const profile of profiles) {
      const score = calculateToneSimilarity(
        result.detected_formality,
        result.detected_enthusiasm,
        result.detected_confidence,
        result.detected_friendliness,
        profile.formality,
        profile.enthusiasm,
        profile.confidence,
        profile.friendliness
      );
      if (score > bestScore) {
        bestScore = score;
        closestProfile = profile;
      }
    }

    // Save analysis
    const { data: analysis, error } = await supabaseAdmin
      .from("synthex_library_tone_analysis")
      .insert({
        tenant_id: tenantId,
        content,
        content_type: contentType,
        content_id: contentId,
        ...result,
        closest_profile_id: closestProfile?.id,
        profile_match_score: bestScore,
        ai_model: "claude-sonnet-4-5-20250514",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return analysis;
  } catch (err) {
    throw new Error(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

function calculateToneSimilarity(
  f1: number, e1: number, c1: number, fr1: number,
  f2: number, e2: number, c2: number, fr2: number
): number {
  const diff =
    Math.abs((f1 || 0.5) - (f2 || 0.5)) +
    Math.abs((e1 || 0.5) - (e2 || 0.5)) +
    Math.abs((c1 || 0.5) - (c2 || 0.5)) +
    Math.abs((fr1 || 0.5) - (fr2 || 0.5));

  return Math.round((1 - diff / 4) * 100) / 100;
}

/**
 * Get analysis history
 */
export async function listAnalyses(
  tenantId: string,
  limit = 20
): Promise<ToneAnalysis[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_tone_analysis")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("analyzed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list analyses: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Stats
// =====================================================

/**
 * Get tone usage statistics
 */
export async function getToneStats(tenantId: string): Promise<{
  total_profiles: number;
  active_profiles: number;
  total_transformations: number;
  avg_tone_match_score: number;
  avg_rating: number;
  transformations_by_profile: Array<{ profile_name: string; count: number }>;
}> {
  const { data: profiles } = await supabaseAdmin
    .from("synthex_library_tone_profiles")
    .select("id, name, status")
    .eq("tenant_id", tenantId);

  const { data: transformations } = await supabaseAdmin
    .from("synthex_library_tone_transformations")
    .select("tone_profile_id, tone_match_score, user_rating")
    .eq("tenant_id", tenantId)
    .eq("status", "completed");

  const total_profiles = profiles?.length || 0;
  const active_profiles = profiles?.filter((p) => p.status === "active").length || 0;
  const total_transformations = transformations?.length || 0;

  let scoreSum = 0;
  let scoreCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  const byProfile: Record<string, number> = {};

  for (const t of transformations || []) {
    if (t.tone_match_score) {
      scoreSum += t.tone_match_score;
      scoreCount++;
    }
    if (t.user_rating) {
      ratingSum += t.user_rating;
      ratingCount++;
    }
    if (t.tone_profile_id) {
      byProfile[t.tone_profile_id] = (byProfile[t.tone_profile_id] || 0) + 1;
    }
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);
  const transformations_by_profile = Object.entries(byProfile)
    .map(([id, count]) => ({
      profile_name: profileMap.get(id) || "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total_profiles,
    active_profiles,
    total_transformations,
    avg_tone_match_score: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : 0,
    avg_rating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
    transformations_by_profile,
  };
}
