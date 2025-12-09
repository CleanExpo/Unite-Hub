/**
 * Synthex Market Radar Service
 *
 * Phase: D45 - Market Radar (Signals, Competitors, and Pivot Engine)
 * Tables: synthex_mkt_*
 *
 * Features:
 * - Market signal monitoring
 * - Competitor tracking and analysis
 * - AI-generated recommendations
 * - Business pivot tracking
 * - Industry news monitoring
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type MKTSignalType = 'trend' | 'opportunity' | 'threat' | 'regulation' | 'technology' | 'competitor' | 'market_shift' | 'consumer_behavior' | 'economic' | 'news';
export type MKTSourceType = 'web_scrape' | 'api' | 'social_media' | 'news_feed' | 'industry_report' | 'customer_feedback' | 'internal_data' | 'ai_generated' | 'manual';
export type MKTDirection = 'bullish' | 'bearish' | 'neutral' | 'volatile';
export type MKTPriority = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type MKTRecStatus = 'open' | 'in_progress' | 'completed' | 'dismissed' | 'deferred';

export interface MKTSignal {
  id: string;
  tenant_id: string;
  business_id?: string;
  source_type: MKTSourceType;
  source_ref?: string;
  signal_type: MKTSignalType;
  title: string;
  summary?: string;
  full_content?: string;
  strength: number;
  confidence: number;
  direction: MKTDirection;
  impact_score?: number;
  urgency_score?: number;
  related_industries: string[];
  related_keywords: string[];
  tags: string[];
  expires_at?: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  raw_payload: Record<string, unknown>;
  ai_analysis: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MKTCompetitor {
  id: string;
  tenant_id: string;
  business_id?: string;
  name: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
  region?: string;
  headquarters?: string;
  employee_count?: string;
  founded_year?: number;
  positioning?: string;
  value_proposition?: string;
  target_market?: string;
  strengths: unknown[];
  weaknesses: unknown[];
  opportunities: unknown[];
  threats: unknown[];
  pricing_model?: string;
  pricing_tier?: string;
  products: unknown[];
  features: unknown[];
  differentiators: unknown[];
  social_presence: Record<string, unknown>;
  traffic_estimate?: number;
  domain_authority?: number;
  threat_level: number;
  watch_priority: MKTPriority;
  last_analyzed_at?: string;
  ai_summary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MKTRecommendation {
  id: string;
  tenant_id: string;
  business_id?: string;
  category: string;
  subcategory?: string;
  priority: MKTPriority;
  status: MKTRecStatus;
  title: string;
  recommendation: string;
  detailed_analysis?: string;
  expected_impact?: string;
  estimated_effort?: string;
  time_horizon?: string;
  supporting_signals: string[];
  related_competitors: string[];
  ai_rationale: Record<string, unknown>;
  implementation_steps: unknown[];
  success_metrics: unknown[];
  assigned_to?: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  dismissed_at?: string;
  dismissal_reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MKTPivot {
  id: string;
  tenant_id: string;
  business_id?: string;
  pivot_name: string;
  pivot_type: string;
  from_state: string;
  to_state: string;
  rationale?: string;
  expected_outcomes: unknown[];
  risks: unknown[];
  success_criteria: unknown[];
  status: string;
  proposed_at: string;
  approved_at?: string;
  approved_by?: string;
  started_at?: string;
  completed_at?: string;
  outcome_summary?: string;
  lessons_learned: unknown[];
  ai_analysis: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSignalInput {
  source_type?: MKTSourceType;
  source_ref?: string;
  signal_type: MKTSignalType;
  title: string;
  summary?: string;
  full_content?: string;
  strength?: number;
  confidence?: number;
  direction?: MKTDirection;
  impact_score?: number;
  urgency_score?: number;
  related_industries?: string[];
  related_keywords?: string[];
  tags?: string[];
  expires_at?: string;
  raw_payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateCompetitorInput {
  name: string;
  website_url?: string;
  description?: string;
  region?: string;
  positioning?: string;
  value_proposition?: string;
  target_market?: string;
  pricing_model?: string;
  pricing_tier?: string;
  threat_level?: number;
  watch_priority?: MKTPriority;
  metadata?: Record<string, unknown>;
}

export interface CreateRecommendationInput {
  category: string;
  subcategory?: string;
  priority?: MKTPriority;
  title: string;
  recommendation: string;
  detailed_analysis?: string;
  expected_impact?: string;
  estimated_effort?: string;
  time_horizon?: string;
  supporting_signals?: string[];
  related_competitors?: string[];
  implementation_steps?: unknown[];
  success_metrics?: unknown[];
  assigned_to?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Signal Operations
// =============================================================================

export async function createSignal(
  tenantId: string,
  businessId: string | undefined,
  input: CreateSignalInput
): Promise<MKTSignal> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_signals')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      source_type: input.source_type || 'manual',
      source_ref: input.source_ref,
      signal_type: input.signal_type,
      title: input.title,
      summary: input.summary,
      full_content: input.full_content,
      strength: input.strength || 50,
      confidence: input.confidence || 50,
      direction: input.direction || 'neutral',
      impact_score: input.impact_score,
      urgency_score: input.urgency_score,
      related_industries: input.related_industries || [],
      related_keywords: input.related_keywords || [],
      tags: input.tags || [],
      expires_at: input.expires_at,
      raw_payload: input.raw_payload || {},
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create signal: ${error.message}`);
  return data;
}

export async function listSignals(
  tenantId: string,
  options?: {
    businessId?: string;
    signalType?: MKTSignalType;
    direction?: MKTDirection;
    acknowledged?: boolean;
    minStrength?: number;
    limit?: number;
  }
): Promise<MKTSignal[]> {
  let query = supabaseAdmin
    .from('synthex_mkt_signals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.signalType) {
    query = query.eq('signal_type', options.signalType);
  }
  if (options?.direction) {
    query = query.eq('direction', options.direction);
  }
  if (options?.acknowledged !== undefined) {
    query = query.eq('acknowledged', options.acknowledged);
  }
  if (options?.minStrength) {
    query = query.gte('strength', options.minStrength);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list signals: ${error.message}`);
  return data || [];
}

export async function acknowledgeSignal(
  signalId: string,
  userId?: string
): Promise<MKTSignal> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_signals')
    .update({
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', signalId)
    .select()
    .single();

  if (error) throw new Error(`Failed to acknowledge signal: ${error.message}`);
  return data;
}

// =============================================================================
// Competitor Operations
// =============================================================================

export async function createCompetitor(
  tenantId: string,
  businessId: string | undefined,
  input: CreateCompetitorInput
): Promise<MKTCompetitor> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_competitors')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      name: input.name,
      website_url: input.website_url,
      description: input.description,
      region: input.region,
      positioning: input.positioning,
      value_proposition: input.value_proposition,
      target_market: input.target_market,
      pricing_model: input.pricing_model,
      pricing_tier: input.pricing_tier,
      threat_level: input.threat_level || 50,
      watch_priority: input.watch_priority || 'medium',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create competitor: ${error.message}`);
  return data;
}

export async function listCompetitors(
  tenantId: string,
  options?: {
    businessId?: string;
    watchPriority?: MKTPriority;
    minThreatLevel?: number;
    limit?: number;
  }
): Promise<MKTCompetitor[]> {
  let query = supabaseAdmin
    .from('synthex_mkt_competitors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('threat_level', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.watchPriority) {
    query = query.eq('watch_priority', options.watchPriority);
  }
  if (options?.minThreatLevel) {
    query = query.gte('threat_level', options.minThreatLevel);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list competitors: ${error.message}`);
  return data || [];
}

export async function getCompetitor(competitorId: string): Promise<MKTCompetitor | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_competitors')
    .select('*')
    .eq('id', competitorId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get competitor: ${error.message}`);
  }
  return data;
}

export async function updateCompetitor(
  competitorId: string,
  updates: Partial<CreateCompetitorInput> & {
    strengths?: unknown[];
    weaknesses?: unknown[];
    products?: unknown[];
    features?: unknown[];
  }
): Promise<MKTCompetitor> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_competitors')
    .update(updates)
    .eq('id', competitorId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update competitor: ${error.message}`);
  return data;
}

export async function deleteCompetitor(competitorId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_mkt_competitors')
    .delete()
    .eq('id', competitorId);

  if (error) throw new Error(`Failed to delete competitor: ${error.message}`);
}

// =============================================================================
// Recommendation Operations
// =============================================================================

export async function createRecommendation(
  tenantId: string,
  businessId: string | undefined,
  input: CreateRecommendationInput
): Promise<MKTRecommendation> {
  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_recommendations')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      category: input.category,
      subcategory: input.subcategory,
      priority: input.priority || 'medium',
      title: input.title,
      recommendation: input.recommendation,
      detailed_analysis: input.detailed_analysis,
      expected_impact: input.expected_impact,
      estimated_effort: input.estimated_effort,
      time_horizon: input.time_horizon,
      supporting_signals: input.supporting_signals || [],
      related_competitors: input.related_competitors || [],
      implementation_steps: input.implementation_steps || [],
      success_metrics: input.success_metrics || [],
      assigned_to: input.assigned_to,
      due_date: input.due_date,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create recommendation: ${error.message}`);
  return data;
}

export async function listRecommendations(
  tenantId: string,
  options?: {
    businessId?: string;
    category?: string;
    status?: MKTRecStatus;
    priority?: MKTPriority;
    limit?: number;
  }
): Promise<MKTRecommendation[]> {
  let query = supabaseAdmin
    .from('synthex_mkt_recommendations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority')
    .order('created_at', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.priority) {
    query = query.eq('priority', options.priority);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list recommendations: ${error.message}`);
  return data || [];
}

export async function updateRecommendationStatus(
  recommendationId: string,
  status: MKTRecStatus,
  reason?: string
): Promise<MKTRecommendation> {
  const updates: Record<string, unknown> = { status };

  if (status === 'in_progress' && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  if (status === 'dismissed') {
    updates.dismissed_at = new Date().toISOString();
    updates.dismissal_reason = reason;
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_mkt_recommendations')
    .update(updates)
    .eq('id', recommendationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update recommendation: ${error.message}`);
  return data;
}

// =============================================================================
// Market Radar Summary
// =============================================================================

export async function getMarketRadarSummary(
  tenantId: string,
  businessId?: string
): Promise<{
  total_signals: number;
  unacknowledged_signals: number;
  high_impact_signals: number;
  total_competitors: number;
  high_threat_competitors: number;
  open_recommendations: number;
  critical_recommendations: number;
  recent_signals: MKTSignal[];
  top_competitors: MKTCompetitor[];
  priority_recommendations: MKTRecommendation[];
}> {
  const [
    signals,
    competitors,
    recommendations,
  ] = await Promise.all([
    listSignals(tenantId, { businessId, limit: 50 }),
    listCompetitors(tenantId, { businessId, limit: 20 }),
    listRecommendations(tenantId, { businessId, status: 'open', limit: 20 }),
  ]);

  const unacknowledgedSignals = signals.filter(s => !s.acknowledged);
  const highImpactSignals = signals.filter(s => (s.impact_score || 0) >= 70);
  const highThreatCompetitors = competitors.filter(c => c.threat_level >= 70);
  const criticalRecs = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');

  return {
    total_signals: signals.length,
    unacknowledged_signals: unacknowledgedSignals.length,
    high_impact_signals: highImpactSignals.length,
    total_competitors: competitors.length,
    high_threat_competitors: highThreatCompetitors.length,
    open_recommendations: recommendations.length,
    critical_recommendations: criticalRecs.length,
    recent_signals: signals.slice(0, 5),
    top_competitors: competitors.slice(0, 5),
    priority_recommendations: recommendations.slice(0, 5),
  };
}

// =============================================================================
// AI Analysis
// =============================================================================

export async function aiAnalyzeCompetitor(
  competitor: MKTCompetitor,
  businessContext?: {
    name?: string;
    positioning?: string;
    strengths?: string[];
  }
): Promise<{
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  competitive_advantages: string[];
  attack_vectors: string[];
  defense_strategies: string[];
  threat_assessment: string;
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze this competitor and provide strategic insights:

COMPETITOR:
- Name: ${competitor.name}
- Website: ${competitor.website_url || 'Unknown'}
- Positioning: ${competitor.positioning || 'Unknown'}
- Value Proposition: ${competitor.value_proposition || 'Unknown'}
- Target Market: ${competitor.target_market || 'Unknown'}
- Pricing: ${competitor.pricing_tier || 'Unknown'} (${competitor.pricing_model || 'Unknown model'})

${businessContext ? `
OUR BUSINESS:
- Name: ${businessContext.name}
- Positioning: ${businessContext.positioning}
- Key Strengths: ${businessContext.strengths?.join(', ') || 'Unknown'}
` : ''}

Provide analysis in JSON format:
{
  "swot": {
    "strengths": ["competitor's strengths"],
    "weaknesses": ["competitor's weaknesses"],
    "opportunities": ["opportunities we can exploit"],
    "threats": ["threats they pose to us"]
  },
  "competitive_advantages": ["where they beat us"],
  "attack_vectors": ["how we can compete against them"],
  "defense_strategies": ["how to defend against their moves"],
  "threat_assessment": "overall threat assessment narrative"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      competitive_advantages: [],
      attack_vectors: [],
      defense_strategies: [],
      threat_assessment: content.text.slice(0, 500),
    };
  }
}

export async function aiGenerateRecommendations(
  tenantId: string,
  businessId: string | undefined,
  context: {
    signals: MKTSignal[];
    competitors: MKTCompetitor[];
    business_context?: Record<string, unknown>;
  }
): Promise<MKTRecommendation[]> {
  const client = getAnthropicClient();

  const prompt = `Based on market signals and competitive landscape, generate strategic recommendations:

RECENT MARKET SIGNALS:
${context.signals.slice(0, 10).map(s => `- ${s.title} (${s.signal_type}, strength: ${s.strength})`).join('\n')}

TOP COMPETITORS:
${context.competitors.slice(0, 5).map(c => `- ${c.name} (threat: ${c.threat_level}, priority: ${c.watch_priority})`).join('\n')}

${context.business_context ? `BUSINESS CONTEXT: ${JSON.stringify(context.business_context)}` : ''}

Generate 3-5 strategic recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "positioning|pricing|product|marketing|operations|pivot",
      "priority": "critical|high|medium|low",
      "title": "Short title",
      "recommendation": "Detailed recommendation",
      "expected_impact": "Expected outcome",
      "estimated_effort": "low|medium|high",
      "time_horizon": "immediate|short_term|medium_term|long_term"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return [];
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);

    // Save recommendations to database
    const savedRecs: MKTRecommendation[] = [];
    for (const rec of parsed.recommendations || []) {
      const saved = await createRecommendation(tenantId, businessId, {
        category: rec.category,
        priority: rec.priority,
        title: rec.title,
        recommendation: rec.recommendation,
        expected_impact: rec.expected_impact,
        estimated_effort: rec.estimated_effort,
        time_horizon: rec.time_horizon,
      });
      savedRecs.push(saved);
    }

    return savedRecs;
  } catch {
    return [];
  }
}

export async function aiScanMarketTrends(
  tenantId: string,
  businessId: string | undefined,
  industry: string,
  keywords: string[]
): Promise<MKTSignal[]> {
  const client = getAnthropicClient();

  const prompt = `Identify current market trends and signals for:

INDUSTRY: ${industry}
FOCUS KEYWORDS: ${keywords.join(', ')}

Generate 3-5 relevant market signals in JSON format:
{
  "signals": [
    {
      "signal_type": "trend|opportunity|threat|technology|market_shift|consumer_behavior",
      "title": "Signal title",
      "summary": "Brief summary",
      "strength": 0-100,
      "confidence": 0-100,
      "direction": "bullish|bearish|neutral|volatile",
      "impact_score": 0-100,
      "urgency_score": 0-100,
      "related_keywords": ["relevant", "keywords"]
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return [];
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);

    // Save signals to database
    const savedSignals: MKTSignal[] = [];
    for (const sig of parsed.signals || []) {
      const saved = await createSignal(tenantId, businessId, {
        source_type: 'ai_generated',
        signal_type: sig.signal_type,
        title: sig.title,
        summary: sig.summary,
        strength: sig.strength,
        confidence: sig.confidence,
        direction: sig.direction,
        impact_score: sig.impact_score,
        urgency_score: sig.urgency_score,
        related_keywords: sig.related_keywords,
        related_industries: [industry],
      });
      savedSignals.push(saved);
    }

    return savedSignals;
  } catch {
    return [];
  }
}
