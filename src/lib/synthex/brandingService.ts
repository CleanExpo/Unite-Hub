/**
 * Synthex Branding Service
 * Phase D06: Auto-Branding Engine
 *
 * AI-powered brand profile generation, voice analysis,
 * and brand consistency enforcement.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/client';

// =====================================================
// Types
// =====================================================

export type BrandTone =
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'formal'
  | 'playful'
  | 'authoritative'
  | 'empathetic'
  | 'inspirational';

export interface BrandProfile {
  id: string;
  tenant_id: string;
  brand_name: string;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  logo_url: string | null;
  color_primary: string;
  color_secondary: string | null;
  color_accent: string | null;
  color_background: string | null;
  color_text: string | null;
  font_heading: string | null;
  font_body: string | null;
  tone: BrandTone;
  voice_attributes: string[];
  communication_style: string | null;
  persona_name: string | null;
  persona_description: string | null;
  target_audience: Record<string, unknown>;
  industry: string | null;
  dos: string[];
  donts: string[];
  key_phrases: string[];
  banned_words: string[];
  ai_context: string | null;
  is_complete: boolean;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface BrandVoiceSample {
  id: string;
  tenant_id: string;
  brand_profile_id: string;
  content: string;
  content_type: string;
  source: string | null;
  is_on_brand: boolean;
  tone_detected: string | null;
  voice_attributes_detected: string[];
  created_at: string;
}

export interface BrandConsistencyCheck {
  id: string;
  content_type: string;
  content_id: string | null;
  is_consistent: boolean;
  overall_score: number;
  tone_score: number | null;
  voice_score: number | null;
  style_score: number | null;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
  checked_at: string;
}

export interface BrandGenerationJob {
  id: string;
  tenant_id: string;
  source_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  generated_profile: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

// =====================================================
// Brand Profile Operations
// =====================================================

/**
 * Get brand profile for tenant
 */
export async function getBrandProfile(
  tenantId: string
): Promise<BrandProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_brand_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get brand profile: ${error.message}`);
  }
  return data;
}

/**
 * Create or update brand profile
 */
export async function upsertBrandProfile(
  tenantId: string,
  data: Partial<Omit<BrandProfile, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<BrandProfile> {
  const { data: profile, error } = await supabaseAdmin
    .from('synthex_library_brand_profiles')
    .upsert(
      {
        tenant_id: tenantId,
        ...data,
      },
      { onConflict: 'tenant_id' }
    )
    .select()
    .single();

  if (error) {
throw new Error(`Failed to upsert brand profile: ${error.message}`);
}

  // Recalculate completion
  await supabaseAdmin.rpc('calculate_brand_completion', { profile_id: profile.id });

  return profile;
}

/**
 * Delete brand profile
 */
export async function deleteBrandProfile(tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_library_brand_profiles')
    .delete()
    .eq('tenant_id', tenantId);

  if (error) {
throw new Error(`Failed to delete brand profile: ${error.message}`);
}
}

// =====================================================
// AI Brand Generation
// =====================================================

/**
 * Generate brand profile from business information
 */
export async function generateBrandProfile(
  tenantId: string,
  input: {
    businessName: string;
    businessDescription: string;
    industry?: string;
    targetAudience?: string;
    existingBrandElements?: {
      colors?: string[];
      tone?: string;
      keywords?: string[];
    };
  }
): Promise<BrandProfile> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an expert brand strategist. Generate a comprehensive brand profile based on the business information provided.

Create:
1. Brand identity (name validation, tagline, mission, vision)
2. Color palette (primary, secondary, accent - provide hex codes)
3. Typography suggestions (heading and body fonts)
4. Voice & tone (select from: professional, friendly, casual, formal, playful, authoritative, empathetic, inspirational)
5. Voice attributes (3-5 adjectives like: confident, helpful, direct, warm, expert)
6. Communication style description
7. Brand persona (optional character)
8. Content guidelines (dos, don'ts, key phrases, banned words)

Respond in JSON format:
{
  "brand_name": "Validated brand name",
  "tagline": "Catchy tagline",
  "mission": "Mission statement",
  "vision": "Vision statement",
  "color_primary": "#HEX",
  "color_secondary": "#HEX",
  "color_accent": "#HEX",
  "color_background": "#FFFFFF",
  "color_text": "#1F2937",
  "font_heading": "Font name",
  "font_body": "Font name",
  "tone": "professional",
  "voice_attributes": ["confident", "helpful", "expert"],
  "communication_style": "Description of how the brand communicates",
  "persona_name": "Alex the Advisor",
  "persona_description": "Description of the brand persona",
  "target_audience": { "demographics": "...", "psychographics": "..." },
  "industry": "Industry name",
  "dos": ["Use active voice", "Be specific"],
  "donts": ["Avoid jargon", "Never be condescending"],
  "key_phrases": ["Your success is our mission", "Expert guidance"],
  "banned_words": ["cheap", "just", "actually"],
  "ai_context": "Extended context for AI to understand this brand"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate a brand profile for:

Business Name: ${input.businessName}
Description: ${input.businessDescription}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
${input.existingBrandElements?.colors ? `Existing Colors: ${input.existingBrandElements.colors.join(', ')}` : ''}
${input.existingBrandElements?.tone ? `Preferred Tone: ${input.existingBrandElements.tone}` : ''}`,
      },
    ],
    system: systemPrompt,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let generated;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      generated = JSON.parse(jsonMatch[0]);
    }
  } catch {
    throw new Error('Failed to parse generated brand profile');
  }

  // Save to database
  const profile = await upsertBrandProfile(tenantId, {
    ...generated,
    generated_by_ai: true,
    ai_model: 'claude-sonnet-4-5-20250514',
  });

  return profile;
}

/**
 * Generate brand profile from website URL
 */
export async function generateFromWebsite(
  tenantId: string,
  url: string,
  userId?: string
): Promise<BrandGenerationJob> {
  // Create job
  const { data: job, error } = await supabaseAdmin
    .from('synthex_library_brand_generation')
    .insert({
      tenant_id: tenantId,
      source_url: url,
      status: 'pending',
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create generation job: ${error.message}`);
}

  // Start processing in background (simplified - in production use a queue)
  processGenerationJob(job.id).catch(console.error);

  return job;
}

async function processGenerationJob(jobId: string): Promise<void> {
  try {
    // Update status
    await supabaseAdmin
      .from('synthex_library_brand_generation')
      .update({ status: 'processing', started_at: new Date().toISOString(), progress: 10 })
      .eq('id', jobId);

    const { data: job } = await supabaseAdmin
      .from('synthex_library_brand_generation')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
throw new Error('Job not found');
}

    const client = getAnthropicClient();

    // Update progress
    await supabaseAdmin
      .from('synthex_library_brand_generation')
      .update({ progress: 30 })
      .eq('id', jobId);

    const systemPrompt = `You are an expert brand analyst. Analyze the provided website URL and extract brand elements.
Note: You don't have direct web access, so work with what information is provided in the URL and common patterns.

Based on the URL, infer:
1. Business type and industry
2. Suggested color palette (make educated guesses based on industry norms)
3. Brand tone and voice
4. Target audience

Respond in JSON format with brand profile data.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analyze and generate a brand profile for this website: ${job.source_url}
${job.business_description ? `Additional context: ${job.business_description}` : ''}
${job.industry ? `Industry: ${job.industry}` : ''}`,
        },
      ],
      system: systemPrompt,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    let generated;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      }
    } catch {
      throw new Error('Failed to parse generated profile');
    }

    // Update job with results
    await supabaseAdmin
      .from('synthex_library_brand_generation')
      .update({
        status: 'completed',
        progress: 100,
        generated_profile: generated,
        preview_colors: {
          primary: generated.color_primary,
          secondary: generated.color_secondary,
          accent: generated.color_accent,
        },
        preview_tone: generated.tone,
        completed_at: new Date().toISOString(),
        ai_model: 'claude-sonnet-4-5-20250514',
      })
      .eq('id', jobId);
  } catch (error) {
    await supabaseAdmin
      .from('synthex_library_brand_generation')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', jobId);
  }
}

/**
 * Get generation job status
 */
export async function getGenerationJob(
  jobId: string
): Promise<BrandGenerationJob | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_brand_generation')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get job: ${error.message}`);
  }
  return data;
}

/**
 * Apply generated profile from job
 */
export async function applyGeneratedProfile(
  jobId: string
): Promise<BrandProfile> {
  const job = await getGenerationJob(jobId);
  if (!job) {
throw new Error('Job not found');
}
  if (job.status !== 'completed') {
throw new Error('Job not completed');
}
  if (!job.generated_profile) {
throw new Error('No generated profile');
}

  return upsertBrandProfile(job.tenant_id, {
    ...job.generated_profile as Record<string, unknown>,
    generated_by_ai: true,
    ai_model: 'claude-sonnet-4-5-20250514',
    source_url: job.source_url,
  } as Partial<BrandProfile>);
}

// =====================================================
// Voice Samples
// =====================================================

/**
 * Add voice sample
 */
export async function addVoiceSample(
  tenantId: string,
  data: {
    content: string;
    content_type: string;
    source?: string;
    source_url?: string;
  }
): Promise<BrandVoiceSample> {
  // Get brand profile
  const profile = await getBrandProfile(tenantId);
  if (!profile) {
throw new Error('Brand profile not found');
}

  const { data: sample, error } = await supabaseAdmin
    .from('synthex_library_brand_voice_samples')
    .insert({
      tenant_id: tenantId,
      brand_profile_id: profile.id,
      ...data,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to add voice sample: ${error.message}`);
}
  return sample;
}

/**
 * List voice samples
 */
export async function listVoiceSamples(
  tenantId: string,
  filters?: { content_type?: string; is_approved?: boolean }
): Promise<BrandVoiceSample[]> {
  let query = supabaseAdmin
    .from('synthex_library_brand_voice_samples')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.content_type) {
    query = query.eq('content_type', filters.content_type);
  }
  if (filters?.is_approved !== undefined) {
    query = query.eq('is_approved', filters.is_approved);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
throw new Error(`Failed to list samples: ${error.message}`);
}
  return data || [];
}

/**
 * Analyze voice sample
 */
export async function analyzeVoiceSample(
  sampleId: string
): Promise<{
  tone_detected: string;
  voice_attributes_detected: string[];
  readability_score: number;
  is_on_brand: boolean;
}> {
  const { data: sample } = await supabaseAdmin
    .from('synthex_library_brand_voice_samples')
    .select('*, synthex_library_brand_profiles(*)')
    .eq('id', sampleId)
    .single();

  if (!sample) {
throw new Error('Sample not found');
}

  const client = getAnthropicClient();
  const profile = sample.synthex_library_brand_profiles;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this content for brand voice alignment:

Content: ${sample.content}

Brand Profile:
- Tone: ${profile?.tone}
- Voice Attributes: ${profile?.voice_attributes?.join(', ')}
- Dos: ${profile?.dos?.join(', ')}
- Don'ts: ${profile?.donts?.join(', ')}

Respond in JSON:
{
  "tone_detected": "detected tone",
  "voice_attributes_detected": ["attribute1", "attribute2"],
  "readability_score": 0.85,
  "is_on_brand": true,
  "alignment_notes": "Notes about alignment"
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  let analysis;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    analysis = {
      tone_detected: 'unknown',
      voice_attributes_detected: [],
      readability_score: 0.5,
      is_on_brand: false,
    };
  }

  // Update sample with analysis
  await supabaseAdmin
    .from('synthex_library_brand_voice_samples')
    .update({
      analyzed: true,
      tone_detected: analysis.tone_detected,
      voice_attributes_detected: analysis.voice_attributes_detected,
      readability_score: analysis.readability_score,
      is_on_brand: analysis.is_on_brand,
    })
    .eq('id', sampleId);

  return analysis;
}

// =====================================================
// Brand Consistency
// =====================================================

/**
 * Check content for brand consistency
 */
export async function checkBrandConsistency(
  tenantId: string,
  content: string,
  contentType: string,
  contentId?: string
): Promise<BrandConsistencyCheck> {
  const profile = await getBrandProfile(tenantId);
  if (!profile) {
throw new Error('Brand profile not found');
}

  const client = getAnthropicClient();

  const systemPrompt = `You are a brand consistency auditor. Check if the provided content aligns with the brand guidelines.

Brand Profile:
- Brand Name: ${profile.brand_name}
- Tone: ${profile.tone}
- Voice Attributes: ${profile.voice_attributes.join(', ')}
- Dos: ${profile.dos.join(', ')}
- Don'ts: ${profile.donts.join(', ')}
- Key Phrases: ${profile.key_phrases.join(', ')}
- Banned Words: ${profile.banned_words.join(', ')}

Analyze for:
1. Tone alignment (0.0-1.0)
2. Voice consistency (0.0-1.0)
3. Style adherence (0.0-1.0)
4. Overall brand consistency

Identify specific issues and provide suggestions.

Respond in JSON:
{
  "is_consistent": true,
  "overall_score": 0.85,
  "tone_score": 0.90,
  "voice_score": 0.80,
  "style_score": 0.85,
  "issues": [
    {
      "type": "tone",
      "severity": "warning",
      "description": "Some phrases are too casual",
      "suggestion": "Replace 'hey there' with 'Hello'"
    }
  ],
  "suggestions": ["Consider using brand phrase 'Your success is our mission'"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Check this ${contentType} for brand consistency:\n\n${content}`,
      },
    ],
    system: systemPrompt,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let analysis;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    analysis = {
      is_consistent: false,
      overall_score: 0.5,
      issues: [],
      suggestions: [],
    };
  }

  // Store result
  const { data: check, error } = await supabaseAdmin
    .from('synthex_library_brand_consistency')
    .insert({
      tenant_id: tenantId,
      brand_profile_id: profile.id,
      content_type: contentType,
      content_id: contentId,
      content_preview: content.substring(0, 500),
      is_consistent: analysis.is_consistent,
      overall_score: analysis.overall_score,
      tone_score: analysis.tone_score,
      voice_score: analysis.voice_score,
      style_score: analysis.style_score,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      ai_model: 'claude-sonnet-4-5-20250514',
      confidence: 0.85,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save consistency check: ${error.message}`);
}
  return check;
}

/**
 * Get consistency check history
 */
export async function getConsistencyHistory(
  tenantId: string,
  limit = 20
): Promise<BrandConsistencyCheck[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_brand_consistency')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error) {
throw new Error(`Failed to get history: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Brand Context for AI
// =====================================================

/**
 * Get brand context for AI prompts
 */
export async function getBrandContextForAI(
  tenantId: string
): Promise<string> {
  const profile = await getBrandProfile(tenantId);
  if (!profile) {
return '';
}

  return `
BRAND GUIDELINES FOR ${profile.brand_name.toUpperCase()}:

Tone: ${profile.tone}
Voice Attributes: ${profile.voice_attributes.join(', ')}

DOs:
${profile.dos.map((d) => `- ${d}`).join('\n')}

DON'Ts:
${profile.donts.map((d) => `- ${d}`).join('\n')}

Key Phrases to Use:
${profile.key_phrases.map((p) => `- "${p}"`).join('\n')}

Words to Avoid:
${profile.banned_words.join(', ')}

${profile.communication_style ? `Communication Style: ${profile.communication_style}` : ''}
${profile.ai_context ? `Additional Context: ${profile.ai_context}` : ''}
`.trim();
}

// =====================================================
// Statistics
// =====================================================

export async function getBrandingStats(tenantId: string): Promise<{
  hasProfile: boolean;
  completionPercentage: number;
  voiceSamplesCount: number;
  assetsCount: number;
  consistencyChecksCount: number;
  averageConsistencyScore: number;
}> {
  const profile = await getBrandProfile(tenantId);

  const [samples, assets, checks] = await Promise.all([
    supabaseAdmin
      .from('synthex_library_brand_voice_samples')
      .select('id')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_library_brand_assets')
      .select('id')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_library_brand_consistency')
      .select('overall_score')
      .eq('tenant_id', tenantId),
  ]);

  const checksData = checks.data || [];
  const avgScore =
    checksData.length > 0
      ? checksData.reduce((sum, c) => sum + (c.overall_score || 0), 0) / checksData.length
      : 0;

  return {
    hasProfile: !!profile,
    completionPercentage: profile?.completion_percentage || 0,
    voiceSamplesCount: samples.data?.length || 0,
    assetsCount: assets.data?.length || 0,
    consistencyChecksCount: checksData.length,
    averageConsistencyScore: avgScore,
  };
}
