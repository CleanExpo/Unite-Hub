/**
 * Synthex Brand Intelligence + Tone Consistency Engine
 *
 * Provides brand voice management, tone analysis,
 * and content generation with brand consistency.
 *
 * Phase: B19 - Brand Intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export interface BrandVoice {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  // Core brand
  brandName: string;
  tagline: string | null;
  missionStatement: string | null;
  // Voice characteristics (1-10)
  formalityLevel: number;
  humorLevel: number;
  enthusiasmLevel: number;
  empathyLevel: number;
  technicalLevel: number;
  // Tone
  toneKeywords: string[];
  avoidKeywords: string[];
  // Style
  preferredSentenceLength: 'short' | 'medium' | 'long';
  useContractions: boolean;
  useEmoji: boolean;
  useExclamation: boolean;
  firstPerson: 'we' | 'I' | 'the team';
  // Audience
  audienceDescription: string | null;
  audiencePainPoints: string[];
  audienceGoals: string[];
  // Samples
  sampleGreetings: string[];
  sampleClosings: string[];
  sampleParagraphs: string[];
  // Rules
  dos: string[];
  donts: string[];
  // Industry
  industry: string | null;
  competitors: string[];
  differentiators: string[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface BrandVoiceInput {
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  brandName: string;
  tagline?: string;
  missionStatement?: string;
  formalityLevel?: number;
  humorLevel?: number;
  enthusiasmLevel?: number;
  empathyLevel?: number;
  technicalLevel?: number;
  toneKeywords?: string[];
  avoidKeywords?: string[];
  preferredSentenceLength?: 'short' | 'medium' | 'long';
  useContractions?: boolean;
  useEmoji?: boolean;
  useExclamation?: boolean;
  firstPerson?: 'we' | 'I' | 'the team';
  audienceDescription?: string;
  audiencePainPoints?: string[];
  audienceGoals?: string[];
  sampleGreetings?: string[];
  sampleClosings?: string[];
  sampleParagraphs?: string[];
  dos?: string[];
  donts?: string[];
  industry?: string;
  competitors?: string[];
  differentiators?: string[];
}

export interface ToneAnalysisResult {
  formalityScore: number;
  sentimentScore: number;
  readabilityScore: number;
  brandAlignmentScore: number;
  toneIssues: Array<{ issue: string; severity: string; suggestion: string }>;
  terminologyIssues: Array<{ term: string; issue: string; suggestion: string }>;
  styleIssues: Array<{ issue: string; severity: string; suggestion: string }>;
  suggestions: string[];
  correctedText: string | null;
}

export interface ContentGenerationOptions {
  contentType: 'email' | 'social' | 'ad' | 'landing_page' | 'blog' | 'other';
  topic: string;
  context?: string;
  length?: 'short' | 'medium' | 'long';
  tone?: string;
  includeCallToAction?: boolean;
  callToActionText?: string;
  targetAudience?: string;
}

export interface GeneratedContent {
  content: string;
  subject?: string;
  toneAnalysis: ToneAnalysisResult;
  alternativeVersions?: string[];
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Lazy Anthropic Client (same pattern as other services)
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// =============================================================================
// Brand Voice Management
// =============================================================================

/**
 * Get all brand voices for a tenant
 */
export async function getBrandVoices(
  tenantId: string,
  activeOnly = true
): Promise<ServiceResult<BrandVoice[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_brand_voices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const voices: BrandVoice[] = (data || []).map(mapDbToBrandVoice);
    return { success: true, data: voices };
  } catch (error) {
    console.error('[BrandEngine] getBrandVoices error:', error);
    return { success: false, error: 'Failed to fetch brand voices' };
  }
}

/**
 * Get the default brand voice for a tenant
 */
export async function getDefaultBrandVoice(
  tenantId: string
): Promise<ServiceResult<BrandVoice | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_brand_voices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    return { success: true, data: mapDbToBrandVoice(data) };
  } catch (error) {
    console.error('[BrandEngine] getDefaultBrandVoice error:', error);
    return { success: false, error: 'Failed to fetch default brand voice' };
  }
}

/**
 * Create a new brand voice
 */
export async function createBrandVoice(
  tenantId: string,
  input: BrandVoiceInput
): Promise<ServiceResult<BrandVoice>> {
  try {
    // If this is set as default, unset other defaults first
    if (input.isDefault) {
      await supabaseAdmin
        .from('synthex_brand_voices')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_brand_voices')
      .insert({
        tenant_id: tenantId,
        name: input.name || 'Default Brand Voice',
        is_default: input.isDefault ?? false,
        is_active: input.isActive ?? true,
        brand_name: input.brandName,
        tagline: input.tagline,
        mission_statement: input.missionStatement,
        formality_level: input.formalityLevel ?? 5,
        humor_level: input.humorLevel ?? 3,
        enthusiasm_level: input.enthusiasmLevel ?? 5,
        empathy_level: input.empathyLevel ?? 7,
        technical_level: input.technicalLevel ?? 5,
        tone_keywords: input.toneKeywords ?? [],
        avoid_keywords: input.avoidKeywords ?? [],
        preferred_sentence_length: input.preferredSentenceLength ?? 'medium',
        use_contractions: input.useContractions ?? true,
        use_emoji: input.useEmoji ?? false,
        use_exclamation: input.useExclamation ?? true,
        first_person: input.firstPerson ?? 'we',
        audience_description: input.audienceDescription,
        audience_pain_points: input.audiencePainPoints ?? [],
        audience_goals: input.audienceGoals ?? [],
        sample_greetings: input.sampleGreetings ?? [],
        sample_closings: input.sampleClosings ?? [],
        sample_paragraphs: input.sampleParagraphs ?? [],
        dos: input.dos ?? [],
        donts: input.donts ?? [],
        industry: input.industry,
        competitors: input.competitors ?? [],
        differentiators: input.differentiators ?? [],
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToBrandVoice(data) };
  } catch (error) {
    console.error('[BrandEngine] createBrandVoice error:', error);
    return { success: false, error: 'Failed to create brand voice' };
  }
}

/**
 * Update an existing brand voice
 */
export async function updateBrandVoice(
  tenantId: string,
  voiceId: string,
  input: Partial<BrandVoiceInput>
): Promise<ServiceResult<BrandVoice>> {
  try {
    // If setting as default, unset other defaults first
    if (input.isDefault) {
      await supabaseAdmin
        .from('synthex_brand_voices')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .neq('id', voiceId);
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) {
updateData.name = input.name;
}
    if (input.isDefault !== undefined) {
updateData.is_default = input.isDefault;
}
    if (input.isActive !== undefined) {
updateData.is_active = input.isActive;
}
    if (input.brandName !== undefined) {
updateData.brand_name = input.brandName;
}
    if (input.tagline !== undefined) {
updateData.tagline = input.tagline;
}
    if (input.missionStatement !== undefined) {
updateData.mission_statement = input.missionStatement;
}
    if (input.formalityLevel !== undefined) {
updateData.formality_level = input.formalityLevel;
}
    if (input.humorLevel !== undefined) {
updateData.humor_level = input.humorLevel;
}
    if (input.enthusiasmLevel !== undefined) {
updateData.enthusiasm_level = input.enthusiasmLevel;
}
    if (input.empathyLevel !== undefined) {
updateData.empathy_level = input.empathyLevel;
}
    if (input.technicalLevel !== undefined) {
updateData.technical_level = input.technicalLevel;
}
    if (input.toneKeywords !== undefined) {
updateData.tone_keywords = input.toneKeywords;
}
    if (input.avoidKeywords !== undefined) {
updateData.avoid_keywords = input.avoidKeywords;
}
    if (input.preferredSentenceLength !== undefined) {
updateData.preferred_sentence_length = input.preferredSentenceLength;
}
    if (input.useContractions !== undefined) {
updateData.use_contractions = input.useContractions;
}
    if (input.useEmoji !== undefined) {
updateData.use_emoji = input.useEmoji;
}
    if (input.useExclamation !== undefined) {
updateData.use_exclamation = input.useExclamation;
}
    if (input.firstPerson !== undefined) {
updateData.first_person = input.firstPerson;
}
    if (input.audienceDescription !== undefined) {
updateData.audience_description = input.audienceDescription;
}
    if (input.audiencePainPoints !== undefined) {
updateData.audience_pain_points = input.audiencePainPoints;
}
    if (input.audienceGoals !== undefined) {
updateData.audience_goals = input.audienceGoals;
}
    if (input.sampleGreetings !== undefined) {
updateData.sample_greetings = input.sampleGreetings;
}
    if (input.sampleClosings !== undefined) {
updateData.sample_closings = input.sampleClosings;
}
    if (input.sampleParagraphs !== undefined) {
updateData.sample_paragraphs = input.sampleParagraphs;
}
    if (input.dos !== undefined) {
updateData.dos = input.dos;
}
    if (input.donts !== undefined) {
updateData.donts = input.donts;
}
    if (input.industry !== undefined) {
updateData.industry = input.industry;
}
    if (input.competitors !== undefined) {
updateData.competitors = input.competitors;
}
    if (input.differentiators !== undefined) {
updateData.differentiators = input.differentiators;
}

    const { data, error } = await supabaseAdmin
      .from('synthex_brand_voices')
      .update(updateData)
      .eq('id', voiceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToBrandVoice(data) };
  } catch (error) {
    console.error('[BrandEngine] updateBrandVoice error:', error);
    return { success: false, error: 'Failed to update brand voice' };
  }
}

/**
 * Delete a brand voice
 */
export async function deleteBrandVoice(
  tenantId: string,
  voiceId: string
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_brand_voices')
      .delete()
      .eq('id', voiceId)
      .eq('tenant_id', tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[BrandEngine] deleteBrandVoice error:', error);
    return { success: false, error: 'Failed to delete brand voice' };
  }
}

// =============================================================================
// Tone Analysis
// =============================================================================

/**
 * Analyze content for tone and brand alignment
 */
export async function analyzeContentTone(
  tenantId: string,
  content: string,
  contentType: string,
  voiceId?: string
): Promise<ServiceResult<ToneAnalysisResult>> {
  try {
    // Get brand voice
    let voice: BrandVoice | null = null;
    if (voiceId) {
      const { data } = await supabaseAdmin
        .from('synthex_brand_voices')
        .select('*')
        .eq('id', voiceId)
        .eq('tenant_id', tenantId)
        .single();
      if (data) {
voice = mapDbToBrandVoice(data);
}
    } else {
      const result = await getDefaultBrandVoice(tenantId);
      if (result.success) {
voice = result.data ?? null;
}
    }

    if (!voice) {
      return {
        success: true,
        data: {
          formalityScore: 50,
          sentimentScore: 0,
          readabilityScore: 50,
          brandAlignmentScore: 0,
          toneIssues: [],
          terminologyIssues: [],
          styleIssues: [],
          suggestions: ['No brand voice configured. Create a brand voice profile for analysis.'],
          correctedText: null,
        },
      };
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = buildBrandVoiceSystemPrompt(voice);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze the following ${contentType} content for tone and brand voice alignment.

CONTENT TO ANALYZE:
${content}

Provide your analysis in the following JSON format:
{
  "formalityScore": <0-100>,
  "sentimentScore": <-1 to 1>,
  "readabilityScore": <0-100>,
  "brandAlignmentScore": <0-100>,
  "toneIssues": [{"issue": "...", "severity": "low|medium|high", "suggestion": "..."}],
  "terminologyIssues": [{"term": "...", "issue": "...", "suggestion": "..."}],
  "styleIssues": [{"issue": "...", "severity": "low|medium|high", "suggestion": "..."}],
  "suggestions": ["..."],
  "correctedText": "<improved version if needed, or null>"
}

Return ONLY valid JSON, no additional text.`,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Failed to parse analysis response' };
    }

    const analysis = JSON.parse(jsonMatch[0]) as ToneAnalysisResult;

    // Log the analysis
    await supabaseAdmin.from('synthex_tone_analysis_log').insert({
      tenant_id: tenantId,
      voice_id: voice.id,
      content_type: contentType,
      original_text: content,
      analyzed_text: analysis.correctedText,
      formality_score: analysis.formalityScore,
      sentiment_score: analysis.sentimentScore,
      readability_score: analysis.readabilityScore,
      brand_alignment_score: analysis.brandAlignmentScore,
      tone_issues: analysis.toneIssues,
      terminology_issues: analysis.terminologyIssues,
      style_issues: analysis.styleIssues,
      auto_corrected: false,
      model_version: 'claude-sonnet-4.5',
    });

    return { success: true, data: analysis };
  } catch (error) {
    console.error('[BrandEngine] analyzeContentTone error:', error);
    return { success: false, error: 'Failed to analyze content tone' };
  }
}

// =============================================================================
// Content Generation with Brand Voice
// =============================================================================

/**
 * Generate content using the brand voice
 */
export async function generateBrandedContent(
  tenantId: string,
  options: ContentGenerationOptions,
  voiceId?: string
): Promise<ServiceResult<GeneratedContent>> {
  try {
    // Get brand voice
    let voice: BrandVoice | null = null;
    if (voiceId) {
      const { data } = await supabaseAdmin
        .from('synthex_brand_voices')
        .select('*')
        .eq('id', voiceId)
        .eq('tenant_id', tenantId)
        .single();
      if (data) {
voice = mapDbToBrandVoice(data);
}
    } else {
      const result = await getDefaultBrandVoice(tenantId);
      if (result.success) {
voice = result.data ?? null;
}
    }

    if (!voice) {
      return { success: false, error: 'No brand voice configured. Please create a brand voice profile first.' };
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = buildBrandVoiceSystemPrompt(voice);

    const lengthGuide = {
      short: '50-100 words',
      medium: '150-250 words',
      long: '300-500 words',
    };

    let userPrompt = `Generate ${options.contentType} content about: ${options.topic}

Length: ${lengthGuide[options.length || 'medium']}`;

    if (options.context) {
      userPrompt += `\nContext: ${options.context}`;
    }

    if (options.targetAudience) {
      userPrompt += `\nTarget Audience: ${options.targetAudience}`;
    }

    if (options.includeCallToAction && options.callToActionText) {
      userPrompt += `\nInclude a call-to-action: ${options.callToActionText}`;
    }

    if (options.tone) {
      userPrompt += `\nTone emphasis: ${options.tone}`;
    }

    if (options.contentType === 'email') {
      userPrompt += `\n\nProvide the response in JSON format:
{
  "subject": "email subject line",
  "content": "email body content"
}`;
    } else {
      userPrompt += `\n\nProvide the response in JSON format:
{
  "content": "the generated content"
}`;
    }

    userPrompt += `\n\nReturn ONLY valid JSON, no additional text.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Failed to parse generation response' };
    }

    const generated = JSON.parse(jsonMatch[0]) as { content: string; subject?: string };

    // Analyze the generated content for quality
    const analysisResult = await analyzeContentTone(
      tenantId,
      generated.content,
      options.contentType,
      voice.id
    );

    return {
      success: true,
      data: {
        content: generated.content,
        subject: generated.subject,
        toneAnalysis: analysisResult.data || {
          formalityScore: 50,
          sentimentScore: 0,
          readabilityScore: 50,
          brandAlignmentScore: 50,
          toneIssues: [],
          terminologyIssues: [],
          styleIssues: [],
          suggestions: [],
          correctedText: null,
        },
      },
    };
  } catch (error) {
    console.error('[BrandEngine] generateBrandedContent error:', error);
    return { success: false, error: 'Failed to generate branded content' };
  }
}

/**
 * Get the brand voice prompt for use in other AI flows
 * This allows other services to incorporate brand voice
 */
export async function getBrandVoicePrompt(
  tenantId: string,
  voiceId?: string
): Promise<ServiceResult<string>> {
  try {
    let voice: BrandVoice | null = null;
    if (voiceId) {
      const { data } = await supabaseAdmin
        .from('synthex_brand_voices')
        .select('*')
        .eq('id', voiceId)
        .eq('tenant_id', tenantId)
        .single();
      if (data) {
voice = mapDbToBrandVoice(data);
}
    } else {
      const result = await getDefaultBrandVoice(tenantId);
      if (result.success) {
voice = result.data ?? null;
}
    }

    if (!voice) {
      return { success: true, data: '' };
    }

    return { success: true, data: buildBrandVoiceSystemPrompt(voice) };
  } catch (error) {
    console.error('[BrandEngine] getBrandVoicePrompt error:', error);
    return { success: false, error: 'Failed to get brand voice prompt' };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapDbToBrandVoice(row: Record<string, unknown>): BrandVoice {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    isDefault: row.is_default as boolean,
    isActive: row.is_active as boolean,
    brandName: row.brand_name as string,
    tagline: row.tagline as string | null,
    missionStatement: row.mission_statement as string | null,
    formalityLevel: row.formality_level as number,
    humorLevel: row.humor_level as number,
    enthusiasmLevel: row.enthusiasm_level as number,
    empathyLevel: row.empathy_level as number,
    technicalLevel: row.technical_level as number,
    toneKeywords: row.tone_keywords as string[],
    avoidKeywords: row.avoid_keywords as string[],
    preferredSentenceLength: row.preferred_sentence_length as 'short' | 'medium' | 'long',
    useContractions: row.use_contractions as boolean,
    useEmoji: row.use_emoji as boolean,
    useExclamation: row.use_exclamation as boolean,
    firstPerson: row.first_person as 'we' | 'I' | 'the team',
    audienceDescription: row.audience_description as string | null,
    audiencePainPoints: row.audience_pain_points as string[],
    audienceGoals: row.audience_goals as string[],
    sampleGreetings: row.sample_greetings as string[],
    sampleClosings: row.sample_closings as string[],
    sampleParagraphs: row.sample_paragraphs as string[],
    dos: row.dos as string[],
    donts: row.donts as string[],
    industry: row.industry as string | null,
    competitors: row.competitors as string[],
    differentiators: row.differentiators as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function buildBrandVoiceSystemPrompt(voice: BrandVoice): string {
  const formalityDesc = voice.formalityLevel <= 3 ? 'casual' : voice.formalityLevel >= 8 ? 'very formal' : 'balanced';
  const humorDesc = voice.humorLevel <= 3 ? 'serious' : voice.humorLevel >= 8 ? 'playful with humor' : 'occasionally lighthearted';
  const enthusiasmDesc = voice.enthusiasmLevel <= 3 ? 'measured and calm' : voice.enthusiasmLevel >= 8 ? 'highly enthusiastic' : 'moderately enthusiastic';
  const empathyDesc = voice.empathyLevel <= 3 ? 'direct and factual' : voice.empathyLevel >= 8 ? 'highly empathetic and understanding' : 'warm and considerate';
  const technicalDesc = voice.technicalLevel <= 3 ? 'simple and accessible' : voice.technicalLevel >= 8 ? 'technical and detailed' : 'clear with some technical terms';

  let prompt = `You are writing as ${voice.brandName}.

BRAND IDENTITY:
- Brand Name: ${voice.brandName}
${voice.tagline ? `- Tagline: ${voice.tagline}` : ''}
${voice.missionStatement ? `- Mission: ${voice.missionStatement}` : ''}
${voice.industry ? `- Industry: ${voice.industry}` : ''}

VOICE CHARACTERISTICS:
- Formality: ${formalityDesc} (${voice.formalityLevel}/10)
- Humor: ${humorDesc} (${voice.humorLevel}/10)
- Enthusiasm: ${enthusiasmDesc} (${voice.enthusiasmLevel}/10)
- Empathy: ${empathyDesc} (${voice.empathyLevel}/10)
- Technical: ${technicalDesc} (${voice.technicalLevel}/10)

TONE KEYWORDS: ${voice.toneKeywords.length > 0 ? voice.toneKeywords.join(', ') : 'professional, friendly, helpful'}

WRITING STYLE:
- Sentence length: ${voice.preferredSentenceLength}
- Use contractions: ${voice.useContractions ? 'yes' : 'no'}
- Use emoji: ${voice.useEmoji ? 'yes, sparingly' : 'no'}
- Use exclamation marks: ${voice.useExclamation ? 'yes, appropriately' : 'avoid'}
- First person: use "${voice.firstPerson}"
`;

  if (voice.audienceDescription) {
    prompt += `\nTARGET AUDIENCE: ${voice.audienceDescription}`;
  }

  if (voice.audiencePainPoints.length > 0) {
    prompt += `\nAUDIENCE PAIN POINTS:\n${voice.audiencePainPoints.map(p => `- ${p}`).join('\n')}`;
  }

  if (voice.audienceGoals.length > 0) {
    prompt += `\nAUDIENCE GOALS:\n${voice.audienceGoals.map(g => `- ${g}`).join('\n')}`;
  }

  if (voice.dos.length > 0) {
    prompt += `\n\nDO:\n${voice.dos.map(d => `- ${d}`).join('\n')}`;
  }

  if (voice.donts.length > 0) {
    prompt += `\n\nDON'T:\n${voice.donts.map(d => `- ${d}`).join('\n')}`;
  }

  if (voice.avoidKeywords.length > 0) {
    prompt += `\n\nAVOID THESE WORDS/PHRASES: ${voice.avoidKeywords.join(', ')}`;
  }

  if (voice.differentiators.length > 0) {
    prompt += `\n\nKEY DIFFERENTIATORS:\n${voice.differentiators.map(d => `- ${d}`).join('\n')}`;
  }

  if (voice.sampleParagraphs.length > 0) {
    prompt += `\n\nEXAMPLE CONTENT (match this style):\n${voice.sampleParagraphs.slice(0, 2).join('\n\n')}`;
  }

  prompt += `\n\nAlways maintain brand consistency and voice characteristics in your response.`;

  return prompt;
}
