/**
 * Synthex Cross-Brand Intelligence Service
 *
 * Phase D28: AI-powered cross-brand analytics, insights sharing,
 * and strategic recommendations across brand portfolios.
 *
 * Uses 'crossbrand' prefix to avoid conflict with D11 brand tables.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
return null;
}
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export type MarketSegment =
  | "b2b"
  | "b2c"
  | "b2b2c"
  | "enterprise"
  | "smb"
  | "consumer";

export type BrandTone =
  | "professional"
  | "casual"
  | "friendly"
  | "authoritative"
  | "playful";

export type MarketPosition =
  | "leader"
  | "challenger"
  | "niche"
  | "follower";

export type InsightType =
  | "audience_overlap"
  | "competitive_gap"
  | "synergy_opportunity"
  | "cannibalization_risk"
  | "cross_sell"
  | "market_trend"
  | "brand_health";

export type InsightCategory =
  | "growth"
  | "risk"
  | "optimization"
  | "competitive"
  | "market";

export type InsightStatus =
  | "active"
  | "acted_upon"
  | "dismissed"
  | "expired"
  | "validated";

export type RelationshipStatus =
  | "potential"
  | "exploring"
  | "active"
  | "paused"
  | "discontinued";

export type CampaignType =
  | "cross_brand"
  | "brand_specific"
  | "portfolio_wide";

export type CampaignStatus =
  | "draft"
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type PeriodType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly";

// =====================================================
// Interfaces
// =====================================================

export interface CrossBrandProfile {
  id: string;
  tenant_id: string;
  brand_profile_id: string | null; // Link to D11 brand_profiles
  brand_name: string;
  brand_slug: string | null;
  brand_description: string | null;
  industry: string | null;
  sub_industry: string | null;
  market_segment: MarketSegment | null;
  tone: BrandTone | null;
  voice_guidelines: Record<string, unknown>;
  target_demographics: Record<string, unknown>;
  competitors: unknown[];
  market_position: MarketPosition | null;
  baseline_metrics: Record<string, unknown>;
  allow_insight_sharing: boolean;
  insight_sharing_scope: string;
  is_active: boolean;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrossBrandDomain {
  id: string;
  tenant_id: string;
  crossbrand_id: string;
  domain_name: string;
  domain_type: string;
  is_verified: boolean;
  verification_method: string | null;
  verified_at: string | null;
  analytics_connected: boolean;
  analytics_provider: string | null;
  analytics_config: Record<string, unknown>;
  monthly_traffic: number | null;
  bounce_rate: number | null;
  avg_session_duration: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrossBrandInsight {
  id: string;
  tenant_id: string;
  source_crossbrand_id: string;
  target_crossbrand_id: string | null;
  insight_type: InsightType;
  insight_category: InsightCategory | null;
  score: number;
  confidence: number;
  impact_score: number;
  urgency_score: number;
  reasoning: Record<string, unknown>;
  recommendation: string | null;
  recommended_actions: RecommendedAction[];
  supporting_data: Record<string, unknown>;
  status: InsightStatus;
  acted_upon_at: string | null;
  outcome: string | null;
  valid_from: string;
  valid_until: string | null;
  model_version: string;
  created_at: string;
}

export interface RecommendedAction {
  action: string;
  priority?: number;
  estimated_impact?: number;
  details?: string;
  [key: string]: unknown;
}

export interface CrossBrandSynergy {
  id: string;
  tenant_id: string;
  crossbrand_a_id: string;
  crossbrand_b_id: string;
  synergy_score: number;
  audience_overlap: number;
  messaging_alignment: number;
  channel_overlap: number;
  timing_alignment: number;
  cross_sell_potential: number;
  bundle_opportunity_score: number;
  shared_campaign_fit: number;
  cannibalization_risk: number;
  brand_dilution_risk: number;
  audience_fatigue_risk: number;
  ai_recommendation: string | null;
  ai_reasoning: Record<string, unknown>;
  ai_confidence: number;
  total_shared_campaigns: number;
  successful_collaborations: number;
  last_collaboration_at: string | null;
  relationship_status: RelationshipStatus;
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CrossBrandCampaign {
  id: string;
  tenant_id: string;
  campaign_name: string;
  campaign_description: string | null;
  campaign_type: CampaignType;
  participating_crossbrands: string[];
  lead_crossbrand_id: string | null;
  primary_goal: string | null;
  target_metrics: Record<string, unknown>;
  total_budget: number | null;
  budget_allocation: Record<string, number>;
  channels: string[];
  channel_strategy: Record<string, unknown>;
  actual_reach: number;
  actual_conversions: number;
  actual_revenue: number;
  actual_roi: number | null;
  brand_performance: Record<string, BrandPerformance>;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandPerformance {
  conversions: number;
  revenue: number;
  [key: string]: unknown;
}

export interface CrossBrandMetrics {
  id: string;
  tenant_id: string;
  crossbrand_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_visits: number;
  unique_visitors: number;
  page_views: number;
  avg_session_duration: number | null;
  bounce_rate: number | null;
  total_conversions: number;
  conversion_rate: number;
  total_revenue: number;
  avg_order_value: number | null;
  email_subscribers: number;
  social_followers: number;
  engagement_rate: number;
  brand_awareness_score: number | null;
  brand_sentiment_score: number | null;
  nps_score: number | null;
  cross_brand_conversions: number;
  cross_brand_revenue: number;
  audience_shared_percent: number | null;
  ai_health_score: number | null;
  ai_growth_potential: number | null;
  ai_insights: unknown[];
  created_at: string;
}

export interface PortfolioHealth {
  total_brands: number;
  active_brands: number;
  avg_synergy_score: number;
  total_insights: number;
  actionable_insights: number;
  portfolio_health_score: number;
}

// =====================================================
// Cross-Brand Profile Functions
// =====================================================

export async function createCrossBrandProfile(
  tenantId: string,
  data: {
    brand_name: string;
    brand_profile_id?: string;
    brand_slug?: string;
    brand_description?: string;
    industry?: string;
    sub_industry?: string;
    market_segment?: MarketSegment;
    tone?: BrandTone;
    voice_guidelines?: Record<string, unknown>;
    target_demographics?: Record<string, unknown>;
    competitors?: unknown[];
    market_position?: MarketPosition;
    baseline_metrics?: Record<string, unknown>;
    allow_insight_sharing?: boolean;
    insight_sharing_scope?: string;
    is_primary?: boolean;
  },
  userId?: string
): Promise<CrossBrandProfile> {
  const supabase = await createClient();

  const slug = data.brand_slug || data.brand_name.toLowerCase().replace(/\s+/g, "-");

  const { data: profile, error } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .insert({
      tenant_id: tenantId,
      brand_profile_id: data.brand_profile_id,
      brand_name: data.brand_name,
      brand_slug: slug,
      brand_description: data.brand_description,
      industry: data.industry,
      sub_industry: data.sub_industry,
      market_segment: data.market_segment,
      tone: data.tone,
      voice_guidelines: data.voice_guidelines || {},
      target_demographics: data.target_demographics || {},
      competitors: data.competitors || [],
      market_position: data.market_position,
      baseline_metrics: data.baseline_metrics || {},
      allow_insight_sharing: data.allow_insight_sharing ?? true,
      insight_sharing_scope: data.insight_sharing_scope || "portfolio",
      is_primary: data.is_primary ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create cross-brand profile: ${error.message}`);
}
  return profile;
}

export async function listCrossBrandProfiles(
  tenantId: string,
  filters?: {
    industry?: string;
    market_segment?: MarketSegment;
    is_active?: boolean;
    is_primary?: boolean;
    limit?: number;
  }
): Promise<CrossBrandProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_crossbrand_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.industry) {
query = query.eq("industry", filters.industry);
}
  if (filters?.market_segment) {
query = query.eq("market_segment", filters.market_segment);
}
  if (filters?.is_active !== undefined) {
query = query.eq("is_active", filters.is_active);
}
  if (filters?.is_primary !== undefined) {
query = query.eq("is_primary", filters.is_primary);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list cross-brand profiles: ${error.message}`);
}
  return data || [];
}

export async function getCrossBrandProfile(
  tenantId: string,
  profileId: string
): Promise<CrossBrandProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", profileId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get cross-brand profile: ${error.message}`);
  }
  return data;
}

export async function updateCrossBrandProfile(
  profileId: string,
  updates: Partial<CrossBrandProfile>
): Promise<CrossBrandProfile> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update cross-brand profile: ${error.message}`);
}
  return data;
}

// =====================================================
// Cross-Brand Domain Functions
// =====================================================

export async function addCrossBrandDomain(
  tenantId: string,
  crossbrandId: string,
  data: {
    domain_name: string;
    domain_type?: string;
    analytics_provider?: string;
    analytics_config?: Record<string, unknown>;
  }
): Promise<CrossBrandDomain> {
  const supabase = await createClient();

  const { data: domain, error } = await supabase
    .from("synthex_library_crossbrand_domains")
    .insert({
      tenant_id: tenantId,
      crossbrand_id: crossbrandId,
      domain_name: data.domain_name,
      domain_type: data.domain_type || "primary",
      analytics_provider: data.analytics_provider,
      analytics_config: data.analytics_config || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to add cross-brand domain: ${error.message}`);
}
  return domain;
}

export async function listCrossBrandDomains(
  tenantId: string,
  crossbrandId?: string
): Promise<CrossBrandDomain[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_crossbrand_domains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (crossbrandId) {
query = query.eq("crossbrand_id", crossbrandId);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list cross-brand domains: ${error.message}`);
}
  return data || [];
}

export async function verifyDomain(
  domainId: string,
  verificationMethod: string
): Promise<CrossBrandDomain> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_domains")
    .update({
      is_verified: true,
      verification_method: verificationMethod,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", domainId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to verify domain: ${error.message}`);
}
  return data;
}

// =====================================================
// AI Insight Generation Functions
// =====================================================

export async function generateCrossBrandInsight(
  tenantId: string,
  data: {
    source_crossbrand_id: string;
    target_crossbrand_id?: string;
    insight_type: InsightType;
    context?: Record<string, unknown>;
  }
): Promise<CrossBrandInsight> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  // Fetch source brand profile
  const { data: sourceBrand } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("*")
    .eq("id", data.source_crossbrand_id)
    .single();

  if (!sourceBrand) {
throw new Error("Source brand not found");
}

  // Fetch target brand profile if specified
  let targetBrand = null;
  if (data.target_crossbrand_id) {
    const { data: tb } = await supabase
      .from("synthex_library_crossbrand_profiles")
      .select("*")
      .eq("id", data.target_crossbrand_id)
      .single();
    targetBrand = tb;
  }

  // Generate AI insight
  let aiAnalysis: {
    score: number;
    confidence: number;
    impact_score: number;
    urgency_score: number;
    reasoning: Record<string, unknown>;
    recommendation: string;
    recommended_actions: RecommendedAction[];
    supporting_data: Record<string, unknown>;
    category: InsightCategory;
  } = {
    score: 0.7,
    confidence: 0.75,
    impact_score: 0.6,
    urgency_score: 0.5,
    reasoning: {
      factors: [{ name: "default_analysis", weight: 1.0, value: 0.7 }],
      data_sources: ["brand_profiles"],
      model_version: "v1",
    },
    recommendation: `Analyze ${data.insight_type} for ${sourceBrand.brand_name}`,
    recommended_actions: [
      { action: "review_data", priority: 1, estimated_impact: 0.1 },
    ],
    supporting_data: {},
    category: "optimization",
  };

  if (client) {
    try {
      const prompt = buildInsightPrompt(sourceBrand, targetBrand, data.insight_type, data.context);

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const parsed = parseAIInsightResponse(content.text);
        if (parsed) {
aiAnalysis = parsed;
}
      }
    } catch (err) {
      console.error("[crossBrandIntelService] AI insight generation failed:", err);
    }
  }

  // Save insight to database
  const { data: insight, error } = await supabase
    .from("synthex_library_crossbrand_insights")
    .insert({
      tenant_id: tenantId,
      source_crossbrand_id: data.source_crossbrand_id,
      target_crossbrand_id: data.target_crossbrand_id,
      insight_type: data.insight_type,
      insight_category: aiAnalysis.category,
      score: aiAnalysis.score,
      confidence: aiAnalysis.confidence,
      impact_score: aiAnalysis.impact_score,
      urgency_score: aiAnalysis.urgency_score,
      reasoning: aiAnalysis.reasoning,
      recommendation: aiAnalysis.recommendation,
      recommended_actions: aiAnalysis.recommended_actions,
      supporting_data: aiAnalysis.supporting_data,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save insight: ${error.message}`);
}
  return insight;
}

function buildInsightPrompt(
  sourceBrand: CrossBrandProfile,
  targetBrand: CrossBrandProfile | null,
  insightType: InsightType,
  context?: Record<string, unknown>
): string {
  const targetContext = targetBrand
    ? `Target Brand: ${targetBrand.brand_name} (${targetBrand.industry}, ${targetBrand.market_segment})`
    : "No target brand - brand-specific analysis";

  return `Analyze the following brands for ${insightType} insights.

Source Brand: ${sourceBrand.brand_name}
- Industry: ${sourceBrand.industry || "Not specified"}
- Market Segment: ${sourceBrand.market_segment || "Not specified"}
- Tone: ${sourceBrand.tone || "Not specified"}
- Market Position: ${sourceBrand.market_position || "Not specified"}
- Competitors: ${JSON.stringify(sourceBrand.competitors || [])}

${targetContext}

Additional Context: ${JSON.stringify(context || {})}

Provide analysis in JSON format:
{
  "score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "impact_score": 0.0-1.0,
  "urgency_score": 0.0-1.0,
  "category": "growth|risk|optimization|competitive|market",
  "reasoning": {
    "factors": [{"name": "string", "weight": 0.0-1.0, "value": 0.0-1.0}],
    "data_sources": ["string"],
    "model_version": "v1"
  },
  "recommendation": "string",
  "recommended_actions": [{"action": "string", "priority": 1-3, "estimated_impact": 0.0-1.0}],
  "supporting_data": {}
}`;
}

function parseAIInsightResponse(text: string): {
  score: number;
  confidence: number;
  impact_score: number;
  urgency_score: number;
  reasoning: Record<string, unknown>;
  recommendation: string;
  recommended_actions: RecommendedAction[];
  supporting_data: Record<string, unknown>;
  category: InsightCategory;
} | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(1, Math.max(0, parsed.score || 0.7)),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.75)),
        impact_score: Math.min(1, Math.max(0, parsed.impact_score || 0.6)),
        urgency_score: Math.min(1, Math.max(0, parsed.urgency_score || 0.5)),
        reasoning: parsed.reasoning || {},
        recommendation: parsed.recommendation || "",
        recommended_actions: parsed.recommended_actions || [],
        supporting_data: parsed.supporting_data || {},
        category: parsed.category || "optimization",
      };
    }
  } catch (err) {
    console.error("[crossBrandIntelService] Failed to parse AI response:", err);
  }
  return null;
}

export async function listCrossBrandInsights(
  tenantId: string,
  filters?: {
    source_crossbrand_id?: string;
    target_crossbrand_id?: string;
    insight_type?: InsightType;
    insight_category?: InsightCategory;
    status?: InsightStatus;
    min_score?: number;
    limit?: number;
  }
): Promise<CrossBrandInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_crossbrand_insights")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.source_crossbrand_id) {
    query = query.eq("source_crossbrand_id", filters.source_crossbrand_id);
  }
  if (filters?.target_crossbrand_id) {
    query = query.eq("target_crossbrand_id", filters.target_crossbrand_id);
  }
  if (filters?.insight_type) {
query = query.eq("insight_type", filters.insight_type);
}
  if (filters?.insight_category) {
query = query.eq("insight_category", filters.insight_category);
}
  if (filters?.status) {
query = query.eq("status", filters.status);
}
  if (filters?.min_score) {
query = query.gte("score", filters.min_score);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list cross-brand insights: ${error.message}`);
}
  return data || [];
}

export async function updateInsightStatus(
  insightId: string,
  status: InsightStatus,
  outcome?: string
): Promise<CrossBrandInsight> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status };
  if (status === "acted_upon") {
    updates.acted_upon_at = new Date().toISOString();
    if (outcome) {
updates.outcome = outcome;
}
  }

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_insights")
    .update(updates)
    .eq("id", insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update insight status: ${error.message}`);
}
  return data;
}

// =====================================================
// Synergy Analysis Functions
// =====================================================

export async function calculateSynergy(
  tenantId: string,
  crossbrandAId: string,
  crossbrandBId: string
): Promise<CrossBrandSynergy> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  // Fetch both brand profiles
  const { data: brandA } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("*")
    .eq("id", crossbrandAId)
    .single();

  const { data: brandB } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("*")
    .eq("id", crossbrandBId)
    .single();

  if (!brandA || !brandB) {
throw new Error("One or both brands not found");
}

  // Calculate base synergy metrics
  let synergyAnalysis = calculateBaseSynergy(brandA, brandB);

  // Enhance with AI analysis
  if (client) {
    try {
      const prompt = buildSynergyPrompt(brandA, brandB);

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const parsed = parseAISynergyResponse(content.text);
        if (parsed) {
          synergyAnalysis = { ...synergyAnalysis, ...parsed };
        }
      }
    } catch (err) {
      console.error("[crossBrandIntelService] AI synergy analysis failed:", err);
    }
  }

  // Upsert synergy record
  const { data: synergy, error } = await supabase
    .from("synthex_library_crossbrand_synergies")
    .upsert(
      {
        tenant_id: tenantId,
        crossbrand_a_id: crossbrandAId,
        crossbrand_b_id: crossbrandBId,
        ...synergyAnalysis,
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "crossbrand_a_id,crossbrand_b_id" }
    )
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save synergy: ${error.message}`);
}
  return synergy;
}

function calculateBaseSynergy(
  brandA: CrossBrandProfile,
  brandB: CrossBrandProfile
): Partial<CrossBrandSynergy> {
  // Industry match
  let industryScore = 0.2;
  if (brandA.industry === brandB.industry) {
    industryScore = brandA.sub_industry === brandB.sub_industry ? 0.9 : 0.7;
  }

  // Tone match
  const toneScore = brandA.tone === brandB.tone ? 0.9 : 0.4;

  // Market segment compatibility
  const segmentScore = brandA.market_segment === brandB.market_segment ? 0.8 : 0.5;

  // Calculate overall synergy score
  const synergyScore = (industryScore * 0.3) + (toneScore * 0.3) + (segmentScore * 0.4);

  return {
    synergy_score: Math.min(1, Math.max(0, synergyScore)),
    audience_overlap: segmentScore * 0.5,
    messaging_alignment: toneScore,
    channel_overlap: 0.5, // Default - requires more data
    timing_alignment: 0.5, // Default - requires more data
    cross_sell_potential: synergyScore * 0.8,
    bundle_opportunity_score: synergyScore * 0.7,
    shared_campaign_fit: synergyScore * 0.9,
    cannibalization_risk: industryScore > 0.7 ? 0.4 : 0.1,
    brand_dilution_risk: toneScore < 0.5 ? 0.3 : 0.1,
    audience_fatigue_risk: segmentScore > 0.8 ? 0.3 : 0.1,
    ai_confidence: 0.6,
  };
}

function buildSynergyPrompt(
  brandA: CrossBrandProfile,
  brandB: CrossBrandProfile
): string {
  return `Analyze the synergy potential between these two brands:

Brand A: ${brandA.brand_name}
- Industry: ${brandA.industry || "Not specified"}
- Sub-industry: ${brandA.sub_industry || "Not specified"}
- Market Segment: ${brandA.market_segment || "Not specified"}
- Tone: ${brandA.tone || "Not specified"}
- Market Position: ${brandA.market_position || "Not specified"}
- Target Demographics: ${JSON.stringify(brandA.target_demographics || {})}

Brand B: ${brandB.brand_name}
- Industry: ${brandB.industry || "Not specified"}
- Sub-industry: ${brandB.sub_industry || "Not specified"}
- Market Segment: ${brandB.market_segment || "Not specified"}
- Tone: ${brandB.tone || "Not specified"}
- Market Position: ${brandB.market_position || "Not specified"}
- Target Demographics: ${JSON.stringify(brandB.target_demographics || {})}

Provide synergy analysis in JSON format:
{
  "synergy_score": 0.0-1.0,
  "audience_overlap": 0.0-1.0,
  "messaging_alignment": 0.0-1.0,
  "cross_sell_potential": 0.0-1.0,
  "bundle_opportunity_score": 0.0-1.0,
  "shared_campaign_fit": 0.0-1.0,
  "cannibalization_risk": 0.0-1.0,
  "brand_dilution_risk": 0.0-1.0,
  "audience_fatigue_risk": 0.0-1.0,
  "ai_recommendation": "string",
  "ai_reasoning": {},
  "ai_confidence": 0.0-1.0
}`;
}

function parseAISynergyResponse(text: string): Partial<CrossBrandSynergy> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        synergy_score: Math.min(1, Math.max(0, parsed.synergy_score || 0)),
        audience_overlap: Math.min(1, Math.max(0, parsed.audience_overlap || 0)),
        messaging_alignment: Math.min(1, Math.max(0, parsed.messaging_alignment || 0)),
        cross_sell_potential: Math.min(1, Math.max(0, parsed.cross_sell_potential || 0)),
        bundle_opportunity_score: Math.min(1, Math.max(0, parsed.bundle_opportunity_score || 0)),
        shared_campaign_fit: Math.min(1, Math.max(0, parsed.shared_campaign_fit || 0)),
        cannibalization_risk: Math.min(1, Math.max(0, parsed.cannibalization_risk || 0)),
        brand_dilution_risk: Math.min(1, Math.max(0, parsed.brand_dilution_risk || 0)),
        audience_fatigue_risk: Math.min(1, Math.max(0, parsed.audience_fatigue_risk || 0)),
        ai_recommendation: parsed.ai_recommendation || null,
        ai_reasoning: parsed.ai_reasoning || {},
        ai_confidence: Math.min(1, Math.max(0, parsed.ai_confidence || 0.7)),
      };
    }
  } catch (err) {
    console.error("[crossBrandIntelService] Failed to parse synergy response:", err);
  }
  return null;
}

export async function listSynergies(
  tenantId: string,
  filters?: {
    crossbrand_id?: string;
    min_synergy_score?: number;
    relationship_status?: RelationshipStatus;
    limit?: number;
  }
): Promise<CrossBrandSynergy[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_crossbrand_synergies")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("synergy_score", { ascending: false });

  if (filters?.crossbrand_id) {
    query = query.or(
      `crossbrand_a_id.eq.${filters.crossbrand_id},crossbrand_b_id.eq.${filters.crossbrand_id}`
    );
  }
  if (filters?.min_synergy_score) {
    query = query.gte("synergy_score", filters.min_synergy_score);
  }
  if (filters?.relationship_status) {
    query = query.eq("relationship_status", filters.relationship_status);
  }
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list synergies: ${error.message}`);
}
  return data || [];
}

export async function updateSynergyStatus(
  synergyId: string,
  status: RelationshipStatus
): Promise<CrossBrandSynergy> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_synergies")
    .update({
      relationship_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", synergyId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update synergy status: ${error.message}`);
}
  return data;
}

// =====================================================
// Cross-Brand Campaign Functions
// =====================================================

export async function createCrossBrandCampaign(
  tenantId: string,
  data: {
    campaign_name: string;
    campaign_description?: string;
    campaign_type?: CampaignType;
    participating_crossbrands: string[];
    lead_crossbrand_id?: string;
    primary_goal?: string;
    target_metrics?: Record<string, unknown>;
    total_budget?: number;
    budget_allocation?: Record<string, number>;
    channels?: string[];
    channel_strategy?: Record<string, unknown>;
    scheduled_start?: string;
    scheduled_end?: string;
  },
  userId?: string
): Promise<CrossBrandCampaign> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("synthex_library_crossbrand_campaigns")
    .insert({
      tenant_id: tenantId,
      campaign_name: data.campaign_name,
      campaign_description: data.campaign_description,
      campaign_type: data.campaign_type || "cross_brand",
      participating_crossbrands: data.participating_crossbrands,
      lead_crossbrand_id: data.lead_crossbrand_id,
      primary_goal: data.primary_goal,
      target_metrics: data.target_metrics || {},
      total_budget: data.total_budget,
      budget_allocation: data.budget_allocation || {},
      channels: data.channels || [],
      channel_strategy: data.channel_strategy || {},
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create cross-brand campaign: ${error.message}`);
}
  return campaign;
}

export async function listCrossBrandCampaigns(
  tenantId: string,
  filters?: {
    crossbrand_id?: string;
    status?: CampaignStatus;
    campaign_type?: CampaignType;
    limit?: number;
  }
): Promise<CrossBrandCampaign[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_crossbrand_campaigns")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.crossbrand_id) {
    query = query.contains("participating_crossbrands", [filters.crossbrand_id]);
  }
  if (filters?.status) {
query = query.eq("status", filters.status);
}
  if (filters?.campaign_type) {
query = query.eq("campaign_type", filters.campaign_type);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list cross-brand campaigns: ${error.message}`);
}
  return data || [];
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<CrossBrandCampaign> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "active" && !updates.actual_start) {
    updates.actual_start = new Date().toISOString();
  } else if (status === "completed" || status === "cancelled") {
    updates.actual_end = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_campaigns")
    .update(updates)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update campaign status: ${error.message}`);
}
  return data;
}

export async function recordCampaignPerformance(
  campaignId: string,
  performance: {
    actual_reach?: number;
    actual_conversions?: number;
    actual_revenue?: number;
    brand_performance?: Record<string, BrandPerformance>;
  }
): Promise<CrossBrandCampaign> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    ...performance,
    updated_at: new Date().toISOString(),
  };

  // Calculate ROI if we have revenue and budget
  if (performance.actual_revenue !== undefined) {
    const { data: campaign } = await supabase
      .from("synthex_library_crossbrand_campaigns")
      .select("total_budget")
      .eq("id", campaignId)
      .single();

    if (campaign?.total_budget && campaign.total_budget > 0) {
      updates.actual_roi = performance.actual_revenue / campaign.total_budget;
    }
  }

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_campaigns")
    .update(updates)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record campaign performance: ${error.message}`);
}
  return data;
}

// =====================================================
// Metrics Functions
// =====================================================

export async function recordMetrics(
  tenantId: string,
  crossbrandId: string,
  data: {
    period_type: PeriodType;
    period_start: string;
    period_end: string;
    total_visits?: number;
    unique_visitors?: number;
    page_views?: number;
    avg_session_duration?: number;
    bounce_rate?: number;
    total_conversions?: number;
    conversion_rate?: number;
    total_revenue?: number;
    avg_order_value?: number;
    email_subscribers?: number;
    social_followers?: number;
    engagement_rate?: number;
    brand_awareness_score?: number;
    brand_sentiment_score?: number;
    nps_score?: number;
    cross_brand_conversions?: number;
    cross_brand_revenue?: number;
    audience_shared_percent?: number;
  }
): Promise<CrossBrandMetrics> {
  const supabase = await createClient();

  const { data: metrics, error } = await supabase
    .from("synthex_library_crossbrand_metrics")
    .insert({
      tenant_id: tenantId,
      crossbrand_id: crossbrandId,
      ...data,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record metrics: ${error.message}`);
}
  return metrics;
}

export async function getMetricsHistory(
  tenantId: string,
  crossbrandId: string,
  periodType: PeriodType,
  limit: number = 12
): Promise<CrossBrandMetrics[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_crossbrand_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("crossbrand_id", crossbrandId)
    .eq("period_type", periodType)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) {
throw new Error(`Failed to get metrics history: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Portfolio Health Functions
// =====================================================

export async function getPortfolioHealth(tenantId: string): Promise<PortfolioHealth> {
  const supabase = await createClient();

  // Use RPC function if available, otherwise calculate manually
  const { data: healthData, error: rpcError } = await supabase.rpc(
    "get_crossbrand_portfolio_health",
    { p_tenant_id: tenantId }
  );

  if (!rpcError && healthData) {
    return healthData as PortfolioHealth;
  }

  // Fallback: calculate manually
  const { data: profiles } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("is_active")
    .eq("tenant_id", tenantId);

  const { data: synergies } = await supabase
    .from("synthex_library_crossbrand_synergies")
    .select("synergy_score")
    .eq("tenant_id", tenantId);

  const { data: insights } = await supabase
    .from("synthex_library_crossbrand_insights")
    .select("status, score")
    .eq("tenant_id", tenantId);

  const totalBrands = profiles?.length || 0;
  const activeBrands = profiles?.filter((p) => p.is_active).length || 0;
  const avgSynergy =
    synergies && synergies.length > 0
      ? synergies.reduce((sum, s) => sum + (s.synergy_score || 0), 0) / synergies.length
      : 0;
  const totalInsights = insights?.length || 0;
  const actionableInsights =
    insights?.filter((i) => i.status === "active" && (i.score || 0) >= 0.7).length || 0;

  const portfolioHealthScore =
    totalBrands === 0
      ? 0
      : (activeBrands / totalBrands) * 0.3 +
        avgSynergy * 0.4 +
        (totalInsights > 0 ? (actionableInsights / totalInsights) * 0.3 : 0.15);

  return {
    total_brands: totalBrands,
    active_brands: activeBrands,
    avg_synergy_score: Math.round(avgSynergy * 1000) / 1000,
    total_insights: totalInsights,
    actionable_insights: actionableInsights,
    portfolio_health_score: Math.round(portfolioHealthScore * 1000) / 1000,
  };
}

// =====================================================
// Stats Functions
// =====================================================

export async function getCrossBrandStats(tenantId: string): Promise<{
  total_profiles: number;
  active_profiles: number;
  total_domains: number;
  verified_domains: number;
  total_insights: number;
  active_insights: number;
  high_score_insights: number;
  total_synergies: number;
  avg_synergy_score: number;
  high_synergy_pairs: number;
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_campaign_revenue: number;
  portfolio_health: PortfolioHealth;
}> {
  const supabase = await createClient();

  // Profiles stats
  const { data: profiles } = await supabase
    .from("synthex_library_crossbrand_profiles")
    .select("is_active")
    .eq("tenant_id", tenantId);

  // Domains stats
  const { data: domains } = await supabase
    .from("synthex_library_crossbrand_domains")
    .select("is_verified")
    .eq("tenant_id", tenantId);

  // Insights stats
  const { data: insights } = await supabase
    .from("synthex_library_crossbrand_insights")
    .select("status, score")
    .eq("tenant_id", tenantId);

  // Synergies stats
  const { data: synergies } = await supabase
    .from("synthex_library_crossbrand_synergies")
    .select("synergy_score")
    .eq("tenant_id", tenantId);

  // Campaigns stats
  const { data: campaigns } = await supabase
    .from("synthex_library_crossbrand_campaigns")
    .select("status, actual_revenue")
    .eq("tenant_id", tenantId);

  // Portfolio health
  const portfolioHealth = await getPortfolioHealth(tenantId);

  const avgSynergyScore =
    synergies && synergies.length > 0
      ? synergies.reduce((sum, s) => sum + (s.synergy_score || 0), 0) / synergies.length
      : 0;

  const totalCampaignRevenue =
    campaigns?.reduce((sum, c) => sum + (c.actual_revenue || 0), 0) || 0;

  return {
    total_profiles: profiles?.length || 0,
    active_profiles: profiles?.filter((p) => p.is_active).length || 0,
    total_domains: domains?.length || 0,
    verified_domains: domains?.filter((d) => d.is_verified).length || 0,
    total_insights: insights?.length || 0,
    active_insights: insights?.filter((i) => i.status === "active").length || 0,
    high_score_insights: insights?.filter((i) => (i.score || 0) >= 0.8).length || 0,
    total_synergies: synergies?.length || 0,
    avg_synergy_score: Math.round(avgSynergyScore * 1000) / 1000,
    high_synergy_pairs: synergies?.filter((s) => (s.synergy_score || 0) >= 0.7).length || 0,
    total_campaigns: campaigns?.length || 0,
    active_campaigns: campaigns?.filter((c) => c.status === "active").length || 0,
    completed_campaigns: campaigns?.filter((c) => c.status === "completed").length || 0,
    total_campaign_revenue: totalCampaignRevenue,
    portfolio_health: portfolioHealth,
  };
}
