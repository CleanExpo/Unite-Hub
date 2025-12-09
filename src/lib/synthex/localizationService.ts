/**
 * Synthex Localization Service
 * Phase D15: Multi-Language AI Localization
 *
 * AI-powered translation and localization with cultural adaptation,
 * glossary management, translation memory, and quality scoring.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

// Lazy Anthropic client with circuit breaker
let anthropicClient: Anthropic | null = null;
let lastFailureTime: number | null = null;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

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

export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  direction: "ltr" | "rtl";
  region_code: string | null;
  full_code: string | null;
  is_active: boolean;
  is_default: boolean;
  supports_formal_informal: boolean;
  ai_model_preference: string | null;
  cultural_notes: string | null;
  usage_count: number;
  created_at: string;
}

export interface Glossary {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  source_language: string;
  is_active: boolean;
  priority: number;
  term_count: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface GlossaryTerm {
  id: string;
  glossary_id: string;
  tenant_id: string;
  source_term: string;
  source_language: string;
  context: string | null;
  part_of_speech: string | null;
  notes: string | null;
  case_sensitive: boolean;
  is_approved: boolean;
  do_not_translate: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  translations?: TermTranslation[];
}

export interface TermTranslation {
  id: string;
  term_id: string;
  tenant_id: string;
  target_language: string;
  translation: string;
  formal_translation: string | null;
  informal_translation: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Translation {
  id: string;
  tenant_id: string;
  source_content: string;
  source_language: string;
  source_content_type: string | null;
  source_content_id: string | null;
  target_language: string;
  translated_content: string;
  formality: "formal" | "informal" | "auto" | null;
  preserve_formatting: boolean;
  cultural_adaptation: boolean;
  quality_score: number | null;
  fluency_score: number | null;
  accuracy_score: number | null;
  cultural_appropriateness: number | null;
  ai_model: string | null;
  ai_reasoning: string | null;
  tokens_used: number | null;
  processing_time_ms: number | null;
  glossary_id: string | null;
  terms_applied: number;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  was_edited: boolean;
  edited_content: string | null;
  edited_by: string | null;
  edited_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export interface TranslationMemory {
  id: string;
  tenant_id: string;
  source_segment: string;
  source_language: string;
  source_hash: string;
  target_language: string;
  target_segment: string;
  match_score: number;
  usage_count: number;
  last_used_at: string;
  source_translation_id: string | null;
  created_at: string;
}

export interface LocalizationProject {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  source_language: string;
  target_languages: string[];
  content_type: string | null;
  content_ids: string[];
  glossary_id: string | null;
  default_formality: string;
  cultural_adaptation: boolean;
  status: string;
  total_segments: number;
  translated_segments: number;
  approved_segments: number;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TranslateOptions {
  formality?: "formal" | "informal" | "auto";
  preserveFormatting?: boolean;
  culturalAdaptation?: boolean;
  glossaryId?: string;
  contentType?: string;
  contentId?: string;
}

// =====================================================
// Languages
// =====================================================

export async function listLanguages(
  activeOnly: boolean = true
): Promise<Language[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_languages")
    .select("*")
    .order("name");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function getLanguage(code: string): Promise<Language | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_languages")
    .select("*")
    .eq("code", code)
    .single();

  if (error && error.code !== "PGRST116") {
throw error;
}
  return data;
}

export async function incrementLanguageUsage(code: string): Promise<void> {
  const supabase = await createClient();

  await supabase.rpc("increment_language_usage", { p_code: code });
}

// =====================================================
// Glossaries
// =====================================================

export async function listGlossaries(
  tenantId: string,
  filters?: {
    brandId?: string;
    activeOnly?: boolean;
    limit?: number;
  }
): Promise<Glossary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_glossaries")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false })
    .order("name");

  if (filters?.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }

  if (filters?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function getGlossary(glossaryId: string): Promise<Glossary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_glossaries")
    .select("*")
    .eq("id", glossaryId)
    .single();

  if (error && error.code !== "PGRST116") {
throw error;
}
  return data;
}

export async function createGlossary(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    source_language?: string;
    brand_id?: string;
    priority?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<Glossary> {
  const supabase = await createClient();

  const { data: glossary, error } = await supabase
    .from("synthex_library_glossaries")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      source_language: data.source_language || "en",
      brand_id: data.brand_id,
      priority: data.priority || 0,
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return glossary;
}

export async function updateGlossary(
  glossaryId: string,
  data: Partial<{
    name: string;
    description: string;
    source_language: string;
    brand_id: string | null;
    priority: number;
    is_active: boolean;
    tags: string[];
    metadata: Record<string, unknown>;
  }>
): Promise<Glossary> {
  const supabase = await createClient();

  const { data: glossary, error } = await supabase
    .from("synthex_library_glossaries")
    .update(data)
    .eq("id", glossaryId)
    .select()
    .single();

  if (error) {
throw error;
}
  return glossary;
}

export async function deleteGlossary(glossaryId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_glossaries")
    .delete()
    .eq("id", glossaryId);

  if (error) {
throw error;
}
}

// =====================================================
// Glossary Terms
// =====================================================

export async function listGlossaryTerms(
  glossaryId: string,
  filters?: {
    search?: string;
    approvedOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<GlossaryTerm[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_glossary_terms")
    .select(`
      *,
      translations:synthex_library_term_translations(*)
    `)
    .eq("glossary_id", glossaryId)
    .order("source_term");

  if (filters?.search) {
    query = query.ilike("source_term", `%${filters.search}%`);
  }

  if (filters?.approvedOnly) {
    query = query.eq("is_approved", true);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters?.limit || 50) - 1
    );
  } else if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function createGlossaryTerm(
  tenantId: string,
  glossaryId: string,
  data: {
    source_term: string;
    source_language?: string;
    context?: string;
    part_of_speech?: string;
    notes?: string;
    case_sensitive?: boolean;
    do_not_translate?: boolean;
  },
  userId?: string
): Promise<GlossaryTerm> {
  const supabase = await createClient();

  const { data: term, error } = await supabase
    .from("synthex_library_glossary_terms")
    .insert({
      glossary_id: glossaryId,
      tenant_id: tenantId,
      source_term: data.source_term,
      source_language: data.source_language || "en",
      context: data.context,
      part_of_speech: data.part_of_speech,
      notes: data.notes,
      case_sensitive: data.case_sensitive || false,
      do_not_translate: data.do_not_translate || false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return term;
}

export async function addTermTranslation(
  tenantId: string,
  termId: string,
  data: {
    target_language: string;
    translation: string;
    formal_translation?: string;
    informal_translation?: string;
  }
): Promise<TermTranslation> {
  const supabase = await createClient();

  const { data: translation, error } = await supabase
    .from("synthex_library_term_translations")
    .insert({
      term_id: termId,
      tenant_id: tenantId,
      target_language: data.target_language,
      translation: data.translation,
      formal_translation: data.formal_translation,
      informal_translation: data.informal_translation,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return translation;
}

export async function verifyTermTranslation(
  translationId: string,
  userId: string
): Promise<TermTranslation> {
  const supabase = await createClient();

  const { data: translation, error } = await supabase
    .from("synthex_library_term_translations")
    .update({
      is_verified: true,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", translationId)
    .select()
    .single();

  if (error) {
throw error;
}
  return translation;
}

export async function deleteGlossaryTerm(termId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_glossary_terms")
    .delete()
    .eq("id", termId);

  if (error) {
throw error;
}
}

// =====================================================
// AI Translation
// =====================================================

export async function translateContent(
  tenantId: string,
  content: string,
  sourceLang: string,
  targetLang: string,
  options: TranslateOptions = {},
  userId?: string
): Promise<Translation> {
  const supabase = await createClient();
  const startTime = Date.now();

  // Get language info
  const [sourceLanguage, targetLanguage] = await Promise.all([
    getLanguage(sourceLang),
    getLanguage(targetLang),
  ]);

  if (!targetLanguage) {
    throw new Error(`Target language '${targetLang}' not supported`);
  }

  // Check translation memory first
  const memoryMatch = await findTranslationMemory(
    tenantId,
    content,
    sourceLang,
    targetLang
  );

  if (memoryMatch && memoryMatch.match_score >= 0.95) {
    // Use cached translation
    const { data: translation, error } = await supabase
      .from("synthex_library_translations")
      .insert({
        tenant_id: tenantId,
        source_content: content,
        source_language: sourceLang,
        source_content_type: options.contentType,
        source_content_id: options.contentId,
        target_language: targetLang,
        translated_content: memoryMatch.target_segment,
        formality: options.formality || "auto",
        preserve_formatting: options.preserveFormatting ?? true,
        cultural_adaptation: options.culturalAdaptation ?? true,
        quality_score: memoryMatch.match_score,
        ai_model: "translation_memory",
        ai_reasoning: "Retrieved from translation memory (exact match)",
        processing_time_ms: Date.now() - startTime,
        glossary_id: options.glossaryId,
        status: "completed",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
throw error;
}

    // Update memory usage
    await supabase
      .from("synthex_library_translation_memory")
      .update({
        usage_count: memoryMatch.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", memoryMatch.id);

    return translation;
  }

  // Load glossary terms if specified
  let glossaryTerms: GlossaryTerm[] = [];
  if (options.glossaryId) {
    glossaryTerms = await listGlossaryTerms(options.glossaryId, {
      approvedOnly: true,
    });
  }

  // Build glossary context for AI
  const glossaryContext = glossaryTerms
    .filter((t) => t.translations?.some((tr) => tr.target_language === targetLang))
    .map((t) => {
      const trans = t.translations?.find((tr) => tr.target_language === targetLang);
      let preferred = trans?.translation;
      if (options.formality === "formal" && trans?.formal_translation) {
        preferred = trans.formal_translation;
      } else if (options.formality === "informal" && trans?.informal_translation) {
        preferred = trans.informal_translation;
      }
      return `"${t.source_term}" → "${preferred}"${t.do_not_translate ? " (keep original)" : ""}`;
    })
    .join("\n");

  // Build AI prompt
  const systemPrompt = `You are a professional translator specializing in ${sourceLanguage?.name || sourceLang} to ${targetLanguage.name} translation.

Your task is to translate the provided content accurately while:
1. Preserving the original meaning and intent
2. Adapting cultural references when appropriate
3. Maintaining the original formatting (if requested)
4. Using the correct register (formal/informal)
5. Following glossary terms exactly as specified

${targetLanguage.direction === "rtl" ? "Note: Target language is right-to-left." : ""}
${targetLanguage.supports_formal_informal ? `Note: This language distinguishes formal/informal speech. Use ${options.formality || "auto"} register.` : ""}
${targetLanguage.cultural_notes ? `Cultural notes: ${targetLanguage.cultural_notes}` : ""}

${glossaryContext ? `GLOSSARY (use these translations exactly):\n${glossaryContext}\n` : ""}

Respond with a JSON object containing:
{
  "translation": "the translated content",
  "quality_assessment": {
    "fluency": 0.0-1.0,
    "accuracy": 0.0-1.0,
    "cultural_appropriateness": 0.0-1.0
  },
  "terms_applied": number of glossary terms used,
  "reasoning": "brief explanation of translation choices"
}`;

  const userPrompt = `Translate the following ${sourceLanguage?.name || sourceLang} text to ${targetLanguage.name}:

${content}

${options.preserveFormatting ? "Preserve all formatting (bullet points, line breaks, etc.)" : ""}
${options.culturalAdaptation ? "Adapt cultural references for the target audience" : "Keep cultural references literal"}
Formality: ${options.formality || "auto-detect from content"}`;

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      messages: [
        { role: "user", content: userPrompt },
      ],
      system: systemPrompt,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse AI response
    let aiResult;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      // Fallback: use the entire response as translation
      aiResult = {
        translation: textContent.text.trim(),
        quality_assessment: { fluency: 0.85, accuracy: 0.85, cultural_appropriateness: 0.85 },
        terms_applied: 0,
        reasoning: "Parsed from raw response",
      };
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Calculate overall quality score
    const qa = aiResult.quality_assessment;
    const qualityScore = (qa.fluency + qa.accuracy + qa.cultural_appropriateness) / 3;

    // Save translation
    const { data: translation, error } = await supabase
      .from("synthex_library_translations")
      .insert({
        tenant_id: tenantId,
        source_content: content,
        source_language: sourceLang,
        source_content_type: options.contentType,
        source_content_id: options.contentId,
        target_language: targetLang,
        translated_content: aiResult.translation,
        formality: options.formality || "auto",
        preserve_formatting: options.preserveFormatting ?? true,
        cultural_adaptation: options.culturalAdaptation ?? true,
        quality_score: qualityScore,
        fluency_score: qa.fluency,
        accuracy_score: qa.accuracy,
        cultural_appropriateness: qa.cultural_appropriateness,
        ai_model: "claude-sonnet-4-5-20250514",
        ai_reasoning: aiResult.reasoning,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime,
        glossary_id: options.glossaryId,
        terms_applied: aiResult.terms_applied || 0,
        status: "completed",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
throw error;
}

    // Store in translation memory
    await storeTranslationMemory(
      tenantId,
      content,
      sourceLang,
      aiResult.translation,
      targetLang,
      translation.id
    );

    // Increment language usage
    await incrementLanguageUsage(targetLang);

    return translation;
  } catch (error) {
    lastFailureTime = Date.now();
    throw error;
  }
}

// =====================================================
// Translation Memory
// =====================================================

function generateHash(text: string, lang: string): string {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("md5").update(`${normalized}|${lang}`).digest("hex");
}

export async function findTranslationMemory(
  tenantId: string,
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationMemory | null> {
  const supabase = await createClient();

  const hash = generateHash(sourceText, sourceLang);

  const { data, error } = await supabase
    .from("synthex_library_translation_memory")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("source_hash", hash)
    .eq("source_language", sourceLang)
    .eq("target_language", targetLang)
    .order("match_score", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
throw error;
}
  return data;
}

export async function storeTranslationMemory(
  tenantId: string,
  sourceSegment: string,
  sourceLang: string,
  targetSegment: string,
  targetLang: string,
  translationId?: string
): Promise<TranslationMemory> {
  const supabase = await createClient();

  const hash = generateHash(sourceSegment, sourceLang);

  const { data, error } = await supabase
    .from("synthex_library_translation_memory")
    .upsert(
      {
        tenant_id: tenantId,
        source_segment: sourceSegment,
        source_language: sourceLang,
        source_hash: hash,
        target_language: targetLang,
        target_segment: targetSegment,
        source_translation_id: translationId,
      },
      {
        onConflict: "tenant_id,source_hash,source_language,target_language",
      }
    )
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

// =====================================================
// Translation History
// =====================================================

export async function listTranslations(
  tenantId: string,
  filters?: {
    sourceLang?: string;
    targetLang?: string;
    status?: string;
    contentType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Translation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_translations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.sourceLang) {
    query = query.eq("source_language", filters.sourceLang);
  }

  if (filters?.targetLang) {
    query = query.eq("target_language", filters.targetLang);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.contentType) {
    query = query.eq("source_content_type", filters.contentType);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters?.limit || 50) - 1
    );
  } else if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function getTranslation(
  translationId: string
): Promise<Translation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_translations")
    .select("*")
    .eq("id", translationId)
    .single();

  if (error && error.code !== "PGRST116") {
throw error;
}
  return data;
}

export async function reviewTranslation(
  translationId: string,
  status: "approved" | "rejected",
  userId: string,
  notes?: string
): Promise<Translation> {
  const supabase = await createClient();

  const { data: translation, error } = await supabase
    .from("synthex_library_translations")
    .update({
      status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", translationId)
    .select()
    .single();

  if (error) {
throw error;
}
  return translation;
}

export async function editTranslation(
  translationId: string,
  editedContent: string,
  userId: string
): Promise<Translation> {
  const supabase = await createClient();

  const { data: translation, error } = await supabase
    .from("synthex_library_translations")
    .update({
      was_edited: true,
      edited_content: editedContent,
      edited_by: userId,
      edited_at: new Date().toISOString(),
    })
    .eq("id", translationId)
    .select()
    .single();

  if (error) {
throw error;
}
  return translation;
}

// =====================================================
// Localization Projects
// =====================================================

export async function listProjects(
  tenantId: string,
  filters?: {
    status?: string;
    limit?: number;
  }
): Promise<LocalizationProject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_localization_projects")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function getProject(
  projectId: string
): Promise<LocalizationProject | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_localization_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error && error.code !== "PGRST116") {
throw error;
}
  return data;
}

export async function createProject(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    source_language?: string;
    target_languages: string[];
    content_type?: string;
    content_ids?: string[];
    glossary_id?: string;
    default_formality?: string;
    cultural_adaptation?: boolean;
    due_date?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
  userId?: string
): Promise<LocalizationProject> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("synthex_library_localization_projects")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      source_language: data.source_language || "en",
      target_languages: data.target_languages,
      content_type: data.content_type,
      content_ids: data.content_ids || [],
      glossary_id: data.glossary_id,
      default_formality: data.default_formality || "auto",
      cultural_adaptation: data.cultural_adaptation ?? true,
      due_date: data.due_date,
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return project;
}

export async function updateProject(
  projectId: string,
  data: Partial<{
    name: string;
    description: string;
    target_languages: string[];
    glossary_id: string | null;
    default_formality: string;
    cultural_adaptation: boolean;
    status: string;
    total_segments: number;
    translated_segments: number;
    approved_segments: number;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
  }>
): Promise<LocalizationProject> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("synthex_library_localization_projects")
    .update(data)
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
throw error;
}
  return project;
}

export async function startProject(projectId: string): Promise<LocalizationProject> {
  return updateProject(projectId, {
    status: "in_progress",
    started_at: new Date().toISOString(),
  });
}

export async function completeProject(projectId: string): Promise<LocalizationProject> {
  return updateProject(projectId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_localization_projects")
    .delete()
    .eq("id", projectId);

  if (error) {
throw error;
}
}

// =====================================================
// Batch Translation
// =====================================================

export async function translateBatch(
  tenantId: string,
  items: Array<{
    content: string;
    contentId?: string;
    contentType?: string;
  }>,
  sourceLang: string,
  targetLang: string,
  options: TranslateOptions = {},
  userId?: string
): Promise<Translation[]> {
  const results: Translation[] = [];

  for (const item of items) {
    try {
      const translation = await translateContent(
        tenantId,
        item.content,
        sourceLang,
        targetLang,
        {
          ...options,
          contentId: item.contentId,
          contentType: item.contentType,
        },
        userId
      );
      results.push(translation);
    } catch (error) {
      console.error(`Translation failed for item ${item.contentId}:`, error);
      // Continue with other items
    }
  }

  return results;
}

// =====================================================
// Stats
// =====================================================

export async function getLocalizationStats(tenantId: string): Promise<{
  totalTranslations: number;
  languageBreakdown: Record<string, number>;
  averageQuality: number;
  glossaryCount: number;
  projectCount: number;
  memoryHits: number;
}> {
  const supabase = await createClient();

  const [translations, glossaries, projects, memory] = await Promise.all([
    supabase
      .from("synthex_library_translations")
      .select("target_language, quality_score")
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_glossaries")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
    supabase
      .from("synthex_library_localization_projects")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_translation_memory")
      .select("usage_count")
      .eq("tenant_id", tenantId),
  ]);

  // Calculate language breakdown
  const languageBreakdown: Record<string, number> = {};
  let totalQuality = 0;
  let qualityCount = 0;

  for (const t of translations.data || []) {
    languageBreakdown[t.target_language] =
      (languageBreakdown[t.target_language] || 0) + 1;
    if (t.quality_score) {
      totalQuality += Number(t.quality_score);
      qualityCount++;
    }
  }

  // Calculate memory hits
  const memoryHits = (memory.data || []).reduce(
    (sum, m) => sum + (m.usage_count || 0),
    0
  );

  return {
    totalTranslations: translations.data?.length || 0,
    languageBreakdown,
    averageQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
    glossaryCount: glossaries.count || 0,
    projectCount: projects.count || 0,
    memoryHits,
  };
}
