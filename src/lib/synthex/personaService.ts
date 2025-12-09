/**
 * Synthex Persona Service
 * Phase D07: Auto-Persona Builder
 *
 * AI-powered persona generation, management, and matching.
 */

import { supabaseAdmin } from "@/lib/supabase";

// =====================================================
// Types
// =====================================================

export interface Persona {
  id: string;
  tenant_id: string;
  name: string;
  title?: string;
  avatar_url?: string;
  age_range?: string;
  gender?: string;
  location?: string;
  income_range?: string;
  education?: string;
  job_titles: string[];
  industries: string[];
  company_size?: string;
  decision_role?: "decision_maker" | "influencer" | "user" | "gatekeeper" | "champion";
  goals: string[];
  challenges: string[];
  motivations: string[];
  fears: string[];
  values: string[];
  content_preferences: string[];
  preferred_channels: string[];
  buying_process?: string;
  research_behavior?: string;
  objections: string[];
  key_messages: string[];
  tone_preferences: string[];
  trigger_phrases: string[];
  avoid_phrases: string[];
  awareness_content: Record<string, unknown>;
  consideration_content: Record<string, unknown>;
  decision_content: Record<string, unknown>;
  bio?: string;
  typical_day?: string;
  quote?: string;
  priority: number;
  match_score_weight: number;
  generated_by_ai: boolean;
  ai_model?: string;
  generation_prompt?: string;
  confidence_score?: number;
  based_on_contacts: number;
  based_on_interactions: number;
  data_sources: string[];
  status: "draft" | "active" | "archived";
  is_primary: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PersonaSegment {
  id: string;
  tenant_id: string;
  persona_id: string;
  name: string;
  description?: string;
  criteria: Record<string, unknown>;
  estimated_size?: number;
  actual_contacts: number;
  engagement_rate?: number;
  conversion_rate?: number;
  avg_deal_size?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonaContentMap {
  id: string;
  tenant_id: string;
  persona_id: string;
  content_type: string;
  content_id?: string;
  content_url?: string;
  content_title: string;
  journey_stage?: string;
  relevance_score?: number;
  engagement_rate?: number;
  conversion_rate?: number;
  recommended_by_ai: boolean;
  recommendation_reason?: string;
  is_active: boolean;
  created_at: string;
}

export interface PersonaInsight {
  id: string;
  tenant_id: string;
  persona_id: string;
  insight_type: string;
  title: string;
  description: string;
  impact_level: "low" | "medium" | "high" | "critical";
  estimated_impact: Record<string, unknown>;
  recommended_action?: string;
  action_priority?: number;
  status: "pending" | "acknowledged" | "implemented" | "dismissed";
  ai_model?: string;
  confidence?: number;
  created_at: string;
  expires_at?: string;
}

export interface PersonaGenerationJob {
  id: string;
  tenant_id: string;
  generation_type: string;
  input_data: Record<string, unknown>;
  source_persona_id?: string;
  num_personas: number;
  detail_level: "basic" | "standard" | "comprehensive";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message?: string;
  generated_personas: Persona[];
  preview: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  ai_model?: string;
  tokens_used?: number;
  created_at: string;
  created_by?: string;
}

export interface PersonaFilters {
  status?: string;
  is_primary?: boolean;
  industries?: string[];
  decision_role?: string;
  tags?: string[];
  search?: string;
}

export interface GeneratePersonaInput {
  industry?: string;
  target_audience?: string;
  company_description?: string;
  existing_customer_traits?: string[];
  competitors?: string[];
  goals?: string[];
  num_personas?: number;
  detail_level?: "basic" | "standard" | "comprehensive";
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
      console.warn("[PersonaService] Anthropic SDK not available");
      anthropicFailed = true;
      return null;
    }
  }
  return anthropicClient;
}

// =====================================================
// Persona CRUD
// =====================================================

/**
 * List all personas for a tenant
 */
export async function listPersonas(
  tenantId: string,
  filters?: PersonaFilters
): Promise<Persona[]> {
  let query = supabaseAdmin
    .from("synthex_library_personas")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.is_primary !== undefined) {
    query = query.eq("is_primary", filters.is_primary);
  }
  if (filters?.decision_role) {
    query = query.eq("decision_role", filters.decision_role);
  }
  if (filters?.industries && filters.industries.length > 0) {
    query = query.overlaps("industries", filters.industries);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[PersonaService] Error listing personas:", error);
    throw new Error(`Failed to list personas: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single persona by ID
 */
export async function getPersona(personaId: string): Promise<Persona | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_personas")
    .select("*")
    .eq("id", personaId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get persona: ${error.message}`);
  }

  return data;
}

/**
 * Create a new persona
 */
export async function createPersona(
  tenantId: string,
  data: Partial<Persona>,
  userId?: string
): Promise<Persona> {
  const { data: persona, error } = await supabaseAdmin
    .from("synthex_library_personas")
    .insert({
      tenant_id: tenantId,
      name: data.name,
      title: data.title,
      avatar_url: data.avatar_url,
      age_range: data.age_range,
      gender: data.gender,
      location: data.location,
      income_range: data.income_range,
      education: data.education,
      job_titles: data.job_titles || [],
      industries: data.industries || [],
      company_size: data.company_size,
      decision_role: data.decision_role,
      goals: data.goals || [],
      challenges: data.challenges || [],
      motivations: data.motivations || [],
      fears: data.fears || [],
      values: data.values || [],
      content_preferences: data.content_preferences || [],
      preferred_channels: data.preferred_channels || [],
      buying_process: data.buying_process,
      research_behavior: data.research_behavior,
      objections: data.objections || [],
      key_messages: data.key_messages || [],
      tone_preferences: data.tone_preferences || [],
      trigger_phrases: data.trigger_phrases || [],
      avoid_phrases: data.avoid_phrases || [],
      awareness_content: data.awareness_content || {},
      consideration_content: data.consideration_content || {},
      decision_content: data.decision_content || {},
      bio: data.bio,
      typical_day: data.typical_day,
      quote: data.quote,
      priority: data.priority || 50,
      match_score_weight: data.match_score_weight || 1.0,
      generated_by_ai: data.generated_by_ai || false,
      ai_model: data.ai_model,
      generation_prompt: data.generation_prompt,
      confidence_score: data.confidence_score,
      status: data.status || "draft",
      is_primary: data.is_primary || false,
      tags: data.tags || [],
      metadata: data.metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create persona: ${error.message}`);
  }

  return persona;
}

/**
 * Update a persona
 */
export async function updatePersona(
  personaId: string,
  data: Partial<Persona>
): Promise<Persona> {
  // Remove fields that shouldn't be updated
  const { id, tenant_id, created_at, created_by, ...updateData } = data as Persona;

  const { data: persona, error } = await supabaseAdmin
    .from("synthex_library_personas")
    .update(updateData)
    .eq("id", personaId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update persona: ${error.message}`);
  }

  return persona;
}

/**
 * Delete a persona
 */
export async function deletePersona(personaId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_personas")
    .delete()
    .eq("id", personaId);

  if (error) {
    throw new Error(`Failed to delete persona: ${error.message}`);
  }
}

/**
 * Duplicate a persona
 */
export async function duplicatePersona(
  personaId: string,
  newName: string,
  userId?: string
): Promise<Persona> {
  const original = await getPersona(personaId);
  if (!original) {
    throw new Error("Persona not found");
  }

  const { id, created_at, updated_at, ...copyData } = original;

  return createPersona(
    original.tenant_id,
    {
      ...copyData,
      name: newName,
      is_primary: false,
      status: "draft",
    },
    userId
  );
}

/**
 * Set a persona as primary (only one can be primary)
 */
export async function setPrimaryPersona(
  tenantId: string,
  personaId: string
): Promise<void> {
  // Clear existing primary
  await supabaseAdmin
    .from("synthex_library_personas")
    .update({ is_primary: false })
    .eq("tenant_id", tenantId)
    .eq("is_primary", true);

  // Set new primary
  const { error } = await supabaseAdmin
    .from("synthex_library_personas")
    .update({ is_primary: true })
    .eq("id", personaId);

  if (error) {
    throw new Error(`Failed to set primary persona: ${error.message}`);
  }
}

// =====================================================
// AI Generation
// =====================================================

/**
 * Generate personas using AI
 */
export async function generatePersonas(
  tenantId: string,
  input: GeneratePersonaInput,
  userId?: string
): Promise<PersonaGenerationJob> {
  // Create job record
  const { data: job, error: jobError } = await supabaseAdmin
    .from("synthex_library_persona_generation")
    .insert({
      tenant_id: tenantId,
      generation_type: "from_description",
      input_data: input,
      num_personas: input.num_personas || 1,
      detail_level: input.detail_level || "standard",
      status: "processing",
      started_at: new Date().toISOString(),
      created_by: userId,
    })
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create generation job: ${jobError.message}`);
  }

  const anthropic = await getAnthropicClient();
  if (!anthropic) {
    await supabaseAdmin
      .from("synthex_library_persona_generation")
      .update({
        status: "failed",
        error_message: "AI service unavailable",
      })
      .eq("id", job.id);

    return { ...job, status: "failed", error_message: "AI service unavailable" };
  }

  try {
    const prompt = buildPersonaPrompt(input);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const generatedData = JSON.parse(content.text);
    const personas = Array.isArray(generatedData.personas)
      ? generatedData.personas
      : [generatedData];

    // Update job with results
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from("synthex_library_persona_generation")
      .update({
        status: "completed",
        progress: 100,
        generated_personas: personas,
        completed_at: new Date().toISOString(),
        ai_model: "claude-sonnet-4-5-20250514",
        tokens_used: response.usage.input_tokens + response.usage.output_tokens,
      })
      .eq("id", job.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedJob;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabaseAdmin
      .from("synthex_library_persona_generation")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", job.id);

    throw new Error(`Failed to generate personas: ${errorMessage}`);
  }
}

function buildPersonaPrompt(input: GeneratePersonaInput): string {
  const numPersonas = input.num_personas || 1;
  const detailLevel = input.detail_level || "standard";

  let detailInstructions = "";
  if (detailLevel === "basic") {
    detailInstructions = "Provide essential information only: name, title, key demographics, top 3 goals, top 3 challenges.";
  } else if (detailLevel === "comprehensive") {
    detailInstructions = "Provide exhaustive detail including full psychographic profile, detailed buyer journey, content preferences, messaging guidelines, and a complete narrative bio.";
  } else {
    detailInstructions = "Provide balanced detail covering demographics, psychographics, goals, challenges, and key messaging.";
  }

  return `Generate ${numPersonas} detailed buyer persona(s) for a business with the following characteristics:

Industry: ${input.industry || "Not specified"}
Target Audience: ${input.target_audience || "Not specified"}
Company Description: ${input.company_description || "Not specified"}
Existing Customer Traits: ${input.existing_customer_traits?.join(", ") || "Not specified"}
Competitors: ${input.competitors?.join(", ") || "Not specified"}
Business Goals: ${input.goals?.join(", ") || "Not specified"}

${detailInstructions}

Return a JSON object with this structure:
{
  "personas": [
    {
      "name": "Creative persona name (e.g., 'Tech-Savvy Tim')",
      "title": "Job title",
      "age_range": "e.g., 35-45",
      "gender": "any/male/female/non-binary",
      "location": "Geographic location",
      "income_range": "Income bracket",
      "education": "Education level",
      "job_titles": ["List of possible job titles"],
      "industries": ["Relevant industries"],
      "company_size": "e.g., 50-200 employees",
      "decision_role": "decision_maker|influencer|user|gatekeeper|champion",
      "goals": ["What they want to achieve"],
      "challenges": ["Pain points and obstacles"],
      "motivations": ["What drives them"],
      "fears": ["What they want to avoid"],
      "values": ["What they care about"],
      "content_preferences": ["Preferred content formats"],
      "preferred_channels": ["Communication channels"],
      "buying_process": "How they make purchase decisions",
      "research_behavior": "How they research solutions",
      "objections": ["Common objections to your solution"],
      "key_messages": ["Messages that resonate"],
      "tone_preferences": ["Preferred communication tone"],
      "trigger_phrases": ["Phrases that trigger engagement"],
      "avoid_phrases": ["Phrases to avoid"],
      "bio": "Full narrative bio (2-3 paragraphs)",
      "typical_day": "Day in the life description",
      "quote": "A characteristic quote from this persona"
    }
  ]
}

Return ONLY valid JSON, no additional text.`;
}

/**
 * Get generation job status
 */
export async function getGenerationJob(
  jobId: string
): Promise<PersonaGenerationJob | null> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_persona_generation")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get generation job: ${error.message}`);
  }

  return data;
}

/**
 * Apply generated personas to create actual persona records
 */
export async function applyGeneratedPersonas(
  jobId: string,
  userId?: string
): Promise<Persona[]> {
  const job = await getGenerationJob(jobId);
  if (!job) {
    throw new Error("Generation job not found");
  }

  if (job.status !== "completed") {
    throw new Error("Generation job is not completed");
  }

  const createdPersonas: Persona[] = [];

  for (const personaData of job.generated_personas) {
    const persona = await createPersona(
      job.tenant_id,
      {
        ...personaData,
        generated_by_ai: true,
        ai_model: job.ai_model,
        status: "draft",
      },
      userId
    );
    createdPersonas.push(persona);
  }

  return createdPersonas;
}

// =====================================================
// Segments
// =====================================================

/**
 * List segments for a persona
 */
export async function listSegments(
  personaId: string
): Promise<PersonaSegment[]> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_persona_segments")
    .select("*")
    .eq("persona_id", personaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list segments: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a segment for a persona
 */
export async function createSegment(
  tenantId: string,
  personaId: string,
  data: Partial<PersonaSegment>
): Promise<PersonaSegment> {
  const { data: segment, error } = await supabaseAdmin
    .from("synthex_library_persona_segments")
    .insert({
      tenant_id: tenantId,
      persona_id: personaId,
      name: data.name,
      description: data.description,
      criteria: data.criteria || {},
      estimated_size: data.estimated_size,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create segment: ${error.message}`);
  }

  return segment;
}

/**
 * Update segment stats
 */
export async function updateSegmentStats(
  segmentId: string,
  stats: {
    actual_contacts?: number;
    engagement_rate?: number;
    conversion_rate?: number;
    avg_deal_size?: number;
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("synthex_library_persona_segments")
    .update(stats)
    .eq("id", segmentId);

  if (error) {
    throw new Error(`Failed to update segment stats: ${error.message}`);
  }
}

// =====================================================
// Content Mapping
// =====================================================

/**
 * List content mapped to a persona
 */
export async function listPersonaContent(
  personaId: string,
  journeyStage?: string
): Promise<PersonaContentMap[]> {
  let query = supabaseAdmin
    .from("synthex_library_persona_content_map")
    .select("*")
    .eq("persona_id", personaId)
    .eq("is_active", true)
    .order("relevance_score", { ascending: false });

  if (journeyStage) {
    query = query.eq("journey_stage", journeyStage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list persona content: ${error.message}`);
  }

  return data || [];
}

/**
 * Map content to a persona
 */
export async function mapContentToPersona(
  tenantId: string,
  personaId: string,
  content: Partial<PersonaContentMap>
): Promise<PersonaContentMap> {
  const { data, error } = await supabaseAdmin
    .from("synthex_library_persona_content_map")
    .insert({
      tenant_id: tenantId,
      persona_id: personaId,
      content_type: content.content_type,
      content_id: content.content_id,
      content_url: content.content_url,
      content_title: content.content_title,
      journey_stage: content.journey_stage,
      relevance_score: content.relevance_score,
      recommended_by_ai: content.recommended_by_ai || false,
      recommendation_reason: content.recommendation_reason,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to map content to persona: ${error.message}`);
  }

  return data;
}

/**
 * Generate content recommendations for a persona
 */
export async function generateContentRecommendations(
  tenantId: string,
  personaId: string
): Promise<PersonaContentMap[]> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error("Persona not found");
  }

  const anthropic = await getAnthropicClient();
  if (!anthropic) {
    return [];
  }

  const prompt = `Based on this buyer persona, recommend content types and topics for each journey stage:

Persona: ${persona.name}
Title: ${persona.title}
Goals: ${persona.goals.join(", ")}
Challenges: ${persona.challenges.join(", ")}
Content Preferences: ${persona.content_preferences.join(", ")}
Preferred Channels: ${persona.preferred_channels.join(", ")}

Return a JSON object:
{
  "recommendations": [
    {
      "content_type": "email|landing_page|blog|video|whitepaper|case_study|webinar|social_post",
      "content_title": "Suggested content title",
      "journey_stage": "awareness|consideration|decision|retention|advocacy",
      "relevance_score": 0.0-1.0,
      "recommendation_reason": "Why this content would resonate"
    }
  ]
}

Provide 5-10 recommendations across all journey stages. Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
return [];
}

    const data = JSON.parse(content.text);
    const recommendations: PersonaContentMap[] = [];

    for (const rec of data.recommendations || []) {
      const mapped = await mapContentToPersona(tenantId, personaId, {
        ...rec,
        recommended_by_ai: true,
      });
      recommendations.push(mapped);
    }

    return recommendations;
  } catch {
    console.error("[PersonaService] Failed to generate content recommendations");
    return [];
  }
}

// =====================================================
// Insights
// =====================================================

/**
 * Get insights for a persona
 */
export async function getPersonaInsights(
  personaId: string,
  status?: string
): Promise<PersonaInsight[]> {
  let query = supabaseAdmin
    .from("synthex_library_persona_insights")
    .select("*")
    .eq("persona_id", personaId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get persona insights: ${error.message}`);
  }

  return data || [];
}

/**
 * Generate AI insights for a persona
 */
export async function generatePersonaInsights(
  tenantId: string,
  personaId: string
): Promise<PersonaInsight[]> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error("Persona not found");
  }

  const anthropic = await getAnthropicClient();
  if (!anthropic) {
    return [];
  }

  const prompt = `Analyze this buyer persona and provide actionable insights:

${JSON.stringify(persona, null, 2)}

Return a JSON object:
{
  "insights": [
    {
      "insight_type": "behavior_pattern|content_gap|channel_opportunity|messaging_improvement|segment_shift|competitive_insight|timing_optimization|personalization_opportunity",
      "title": "Brief insight title",
      "description": "Detailed insight description",
      "impact_level": "low|medium|high|critical",
      "estimated_impact": {"metric": "value"},
      "recommended_action": "What to do about it",
      "action_priority": 1-10,
      "confidence": 0.0-1.0
    }
  ]
}

Provide 3-5 actionable insights. Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
return [];
}

    const data = JSON.parse(content.text);
    const createdInsights: PersonaInsight[] = [];

    for (const insight of data.insights || []) {
      const { data: created, error } = await supabaseAdmin
        .from("synthex_library_persona_insights")
        .insert({
          tenant_id: tenantId,
          persona_id: personaId,
          ...insight,
          ai_model: "claude-sonnet-4-5-20250514",
          status: "pending",
        })
        .select()
        .single();

      if (!error && created) {
        createdInsights.push(created);
      }
    }

    return createdInsights;
  } catch {
    console.error("[PersonaService] Failed to generate persona insights");
    return [];
  }
}

/**
 * Update insight status
 */
export async function updateInsightStatus(
  insightId: string,
  status: "acknowledged" | "implemented" | "dismissed",
  userId?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (status === "implemented") {
    updateData.implemented_at = new Date().toISOString();
    updateData.implemented_by = userId;
  }

  const { error } = await supabaseAdmin
    .from("synthex_library_persona_insights")
    .update(updateData)
    .eq("id", insightId);

  if (error) {
    throw new Error(`Failed to update insight status: ${error.message}`);
  }
}

// =====================================================
// Matching
// =====================================================

/**
 * Match a contact to personas
 */
export async function matchContactToPersonas(
  tenantId: string,
  contactData: Record<string, unknown>
): Promise<Array<{ persona: Persona; score: number }>> {
  const personas = await listPersonas(tenantId, { status: "active" });

  const matches = personas.map((persona) => {
    let score = 0.1; // Base score

    // Industry match (30%)
    const contactIndustry = contactData.industry as string;
    if (contactIndustry && persona.industries.some((i) => i.toLowerCase() === contactIndustry.toLowerCase())) {
      score += 0.3;
    }

    // Job title match (25%)
    const contactTitle = contactData.job_title as string;
    if (contactTitle && persona.job_titles.some((t) => contactTitle.toLowerCase().includes(t.toLowerCase()))) {
      score += 0.25;
    }

    // Company size match (20%)
    if (persona.company_size && contactData.company_size === persona.company_size) {
      score += 0.2;
    }

    // Location match (15%)
    const contactLocation = contactData.location as string;
    if (contactLocation && persona.location?.toLowerCase().includes(contactLocation.toLowerCase())) {
      score += 0.15;
    }

    return {
      persona,
      score: Math.min(score * persona.match_score_weight, 1.0),
    };
  });

  return matches
    .filter((m) => m.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Get persona context for AI prompts
 */
export async function getPersonaContextForAI(
  tenantId: string,
  personaId?: string
): Promise<string> {
  let persona: Persona | null = null;

  if (personaId) {
    persona = await getPersona(personaId);
  } else {
    // Get primary persona
    const personas = await listPersonas(tenantId, { is_primary: true, status: "active" });
    persona = personas[0] || null;
  }

  if (!persona) {
    return "";
  }

  return `
TARGET PERSONA: ${persona.name}
Title: ${persona.title || "Not specified"}
Demographics: ${persona.age_range || "Any age"}, ${persona.location || "Any location"}
Decision Role: ${persona.decision_role || "Not specified"}

PSYCHOGRAPHICS:
- Goals: ${persona.goals.join(", ") || "Not specified"}
- Challenges: ${persona.challenges.join(", ") || "Not specified"}
- Motivations: ${persona.motivations.join(", ") || "Not specified"}
- Values: ${persona.values.join(", ") || "Not specified"}

COMMUNICATION PREFERENCES:
- Preferred Channels: ${persona.preferred_channels.join(", ") || "Not specified"}
- Content Preferences: ${persona.content_preferences.join(", ") || "Not specified"}
- Tone: ${persona.tone_preferences.join(", ") || "Not specified"}

MESSAGING:
- Key Messages: ${persona.key_messages.join("; ") || "Not specified"}
- Trigger Phrases: ${persona.trigger_phrases.join(", ") || "Not specified"}
- Avoid: ${persona.avoid_phrases.join(", ") || "Not specified"}
- Common Objections: ${persona.objections.join("; ") || "Not specified"}
`.trim();
}

// =====================================================
// Stats
// =====================================================

/**
 * Get persona usage statistics
 */
export async function getPersonaStats(tenantId: string): Promise<{
  total: number;
  active: number;
  draft: number;
  archived: number;
  ai_generated: number;
  with_segments: number;
  with_content: number;
}> {
  const { data: personas, error } = await supabaseAdmin
    .from("synthex_library_personas")
    .select("id, status, generated_by_ai")
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(`Failed to get persona stats: ${error.message}`);
  }

  const total = personas?.length || 0;
  const active = personas?.filter((p) => p.status === "active").length || 0;
  const draft = personas?.filter((p) => p.status === "draft").length || 0;
  const archived = personas?.filter((p) => p.status === "archived").length || 0;
  const ai_generated = personas?.filter((p) => p.generated_by_ai).length || 0;

  // Get personas with segments
  const { count: segmentCount } = await supabaseAdmin
    .from("synthex_library_persona_segments")
    .select("persona_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // Get personas with content
  const { count: contentCount } = await supabaseAdmin
    .from("synthex_library_persona_content_map")
    .select("persona_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  return {
    total,
    active,
    draft,
    archived,
    ai_generated,
    with_segments: segmentCount || 0,
    with_content: contentCount || 0,
  };
}
