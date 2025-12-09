/**
 * Synthex Competitor Intelligence Service
 * Phase B30: AI-Powered Competitive Analysis and SERP Monitoring
 *
 * Provides automated competitor tracking, keyword gap analysis,
 * SERP movement detection, and AI-powered competitive forecasting.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Lazy Anthropic client initialization
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }
  return anthropicClient;
}

// Types
export type CompetitorType = 'direct' | 'indirect' | 'aspirational' | 'emerging';
export type ThreatLevel = 'critical' | 'high' | 'moderate' | 'low' | 'minimal';
export type AlertType =
  | 'new_keyword'
  | 'lost_keyword'
  | 'ranking_spike'
  | 'ranking_drop'
  | 'new_content'
  | 'backlink_change'
  | 'threat_increase'
  | 'opportunity';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface CompetitorProfile {
  id: string;
  tenant_id: string;
  domain: string;
  company_name?: string;
  logo_url?: string;
  competitor_type: CompetitorType;
  priority: 'high' | 'medium' | 'low';
  domain_authority?: number;
  monthly_traffic_estimate?: number;
  keyword_count: number;
  backlink_count: number;
  threat_level: ThreatLevel;
  threat_score: number;
  is_active: boolean;
  last_analyzed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorKeyword {
  id: string;
  tenant_id: string;
  competitor_id: string;
  keyword: string;
  search_volume: number;
  keyword_difficulty?: number;
  cpc_estimate?: number;
  current_position?: number;
  previous_position?: number;
  position_change?: number;
  ranking_url?: string;
  is_shared_keyword: boolean;
  tenant_position?: number;
  gap_score?: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface CompetitorAlert {
  id: string;
  tenant_id: string;
  competitor_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  keyword?: string;
  old_value?: string;
  new_value?: string;
  change_magnitude?: number;
  ai_recommendation?: string;
  action_items: Array<{ item: string; priority: string }>;
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface CompetitorReport {
  id: string;
  tenant_id: string;
  competitor_id?: string;
  report_type: 'single' | 'comparison' | 'market' | 'gap_analysis' | 'forecast';
  title: string;
  executive_summary?: string;
  key_findings: Array<{ finding: string; impact: string }>;
  recommendations: Array<{ recommendation: string; priority: string }>;
  metrics_snapshot: Record<string, unknown>;
  generated_at: string;
}

export interface CreateCompetitorInput {
  tenant_id: string;
  domain: string;
  company_name?: string;
  competitor_type?: CompetitorType;
  priority?: 'high' | 'medium' | 'low';
}

export interface KeywordGapResult {
  keyword: string;
  competitor_position: number;
  tenant_position?: number;
  gap_score: number;
  opportunity_type: 'new' | 'improve' | 'defend';
  search_volume: number;
  difficulty?: number;
}

// Get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/**
 * Add a competitor to monitor
 */
export async function monitorCompetitor(input: CreateCompetitorInput): Promise<CompetitorProfile> {
  const supabase = getSupabaseAdmin();

  // Clean domain
  const cleanDomain = input.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  const { data, error } = await supabase
    .from('synthex_competitor_profiles')
    .insert({
      tenant_id: input.tenant_id,
      domain: cleanDomain,
      company_name: input.company_name,
      competitor_type: input.competitor_type || 'direct',
      priority: input.priority || 'medium',
      threat_level: 'moderate',
      threat_score: 50,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating competitor:', error);
    throw new Error(`Failed to add competitor: ${error.message}`);
  }

  return data;
}

/**
 * Get all competitors for a tenant
 */
export async function getCompetitors(tenantId: string): Promise<CompetitorProfile[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_competitor_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('threat_score', { ascending: false });

  if (error) {
    console.error('Error fetching competitors:', error);
    throw new Error(`Failed to get competitors: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single competitor by ID
 */
export async function getCompetitor(tenantId: string, competitorId: string): Promise<CompetitorProfile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_competitor_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', competitorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    console.error('Error fetching competitor:', error);
    throw new Error(`Failed to get competitor: ${error.message}`);
  }

  return data;
}

/**
 * Get keywords for a competitor
 */
export async function getCompetitorKeywords(
  tenantId: string,
  competitorId: string,
  limit = 100
): Promise<CompetitorKeyword[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_competitor_keywords')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('competitor_id', competitorId)
    .order('search_volume', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching competitor keywords:', error);
    throw new Error(`Failed to get keywords: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch and store SERP data for a competitor keyword
 * Note: In production, this would integrate with a SERP API like DataForSEO
 */
export async function fetchCompetitorSERP(
  tenantId: string,
  competitorId: string,
  keyword: string
): Promise<{ position: number; url: string; features: string[] }> {
  const supabase = getSupabaseAdmin();

  // Placeholder: In production, call actual SERP API
  // For now, simulate with random data
  const position = Math.floor(Math.random() * 20) + 1;
  const features: string[] = [];
  if (Math.random() > 0.7) {
features.push('featured_snippet');
}
  if (Math.random() > 0.8) {
features.push('local_pack');
}

  // Store SERP snapshot
  await supabase.from('synthex_competitor_serp').insert({
    tenant_id: tenantId,
    competitor_id: competitorId,
    keyword,
    search_engine: 'google',
    location: 'us',
    device: 'desktop',
    position,
    url: `https://example.com/${keyword.replace(/\s+/g, '-')}`,
    title: `${keyword} - Example Page`,
    description: `Learn about ${keyword} from our comprehensive guide.`,
    has_featured_snippet: features.includes('featured_snippet'),
    has_local_pack: features.includes('local_pack'),
    serp_features: features,
  });

  return { position, url: `https://example.com/${keyword.replace(/\s+/g, '-')}`, features };
}

/**
 * Generate AI-powered competitor analysis report
 */
export async function generateCompetitorReport(
  tenantId: string,
  competitorId: string
): Promise<CompetitorReport> {
  const supabase = getSupabaseAdmin();
  const anthropic = getAnthropicClient();

  // Get competitor data
  const competitor = await getCompetitor(tenantId, competitorId);
  if (!competitor) {
    throw new Error('Competitor not found');
  }

  const keywords = await getCompetitorKeywords(tenantId, competitorId, 50);

  // Prepare data for AI analysis
  const competitorData = {
    domain: competitor.domain,
    company: competitor.company_name,
    type: competitor.competitor_type,
    metrics: {
      domain_authority: competitor.domain_authority,
      traffic: competitor.monthly_traffic_estimate,
      keywords: competitor.keyword_count,
      backlinks: competitor.backlink_count,
    },
    top_keywords: keywords.slice(0, 20).map((k) => ({
      keyword: k.keyword,
      position: k.current_position,
      volume: k.search_volume,
    })),
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyze this competitor data and generate a strategic competitive analysis report.

Competitor Data:
${JSON.stringify(competitorData, null, 2)}

Return a JSON object with:
- "executive_summary": 2-3 sentence summary
- "key_findings": array of {finding, impact} objects (3-5 items)
- "recommendations": array of {recommendation, priority: "high"|"medium"|"low"} objects (3-5 items)
- "threat_assessment": {level: "critical"|"high"|"moderate"|"low"|"minimal", score: 0-100, reasoning}

Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected AI response format');
  }

  let analysis;
  try {
    analysis = JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse AI analysis');
  }

  // Update competitor threat assessment
  if (analysis.threat_assessment) {
    await supabase
      .from('synthex_competitor_profiles')
      .update({
        threat_level: analysis.threat_assessment.level,
        threat_score: analysis.threat_assessment.score,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq('id', competitorId);
  }

  // Store report
  const { data: report, error } = await supabase
    .from('synthex_competitor_reports')
    .insert({
      tenant_id: tenantId,
      competitor_id: competitorId,
      report_type: 'single',
      title: `Competitive Analysis: ${competitor.domain}`,
      executive_summary: analysis.executive_summary,
      key_findings: analysis.key_findings,
      recommendations: analysis.recommendations,
      metrics_snapshot: competitorData.metrics,
      model_version: 'claude-sonnet-4-5-20250514',
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing report:', error);
    throw new Error(`Failed to store report: ${error.message}`);
  }

  return report;
}

/**
 * AI-powered competitive forecast
 */
export async function competitorForecast(
  tenantId: string,
  competitorId: string
): Promise<{
  trend: 'growing' | 'stable' | 'declining';
  risk_in_30_days: 'high' | 'medium' | 'low';
  opportunities: string[];
  threats: string[];
}> {
  const anthropic = getAnthropicClient();

  const competitor = await getCompetitor(tenantId, competitorId);
  const keywords = await getCompetitorKeywords(tenantId, competitorId, 30);

  if (!competitor) {
    throw new Error('Competitor not found');
  }

  // Analyze position changes
  const improving = keywords.filter((k) => (k.position_change || 0) > 0).length;
  const declining = keywords.filter((k) => (k.position_change || 0) < 0).length;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Based on this competitor data, provide a 30-day forecast.

Competitor: ${competitor.domain}
Current threat score: ${competitor.threat_score}
Keywords improving: ${improving}
Keywords declining: ${declining}
Total keywords tracked: ${keywords.length}

Return JSON with:
- "trend": "growing" | "stable" | "declining"
- "risk_in_30_days": "high" | "medium" | "low"
- "opportunities": array of 2-3 opportunity strings
- "threats": array of 2-3 threat strings

Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return {
      trend: 'stable',
      risk_in_30_days: 'medium',
      opportunities: [],
      threats: [],
    };
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      trend: 'stable',
      risk_in_30_days: 'medium',
      opportunities: [],
      threats: [],
    };
  }
}

/**
 * Generate alerts for significant competitor movements
 */
export async function generateAlerts(
  tenantId: string,
  competitorId: string
): Promise<CompetitorAlert[]> {
  const supabase = getSupabaseAdmin();

  const competitor = await getCompetitor(tenantId, competitorId);
  const keywords = await getCompetitorKeywords(tenantId, competitorId, 100);

  if (!competitor) {
    throw new Error('Competitor not found');
  }

  const alerts: Partial<CompetitorAlert>[] = [];

  // Check for ranking spikes (position improved by 5+ in one check)
  for (const kw of keywords) {
    if ((kw.position_change || 0) >= 5) {
      alerts.push({
        tenant_id: tenantId,
        competitor_id: competitorId,
        alert_type: 'ranking_spike',
        severity: kw.position_change! >= 10 ? 'critical' : 'warning',
        title: `${competitor.domain} jumped ${kw.position_change} positions for "${kw.keyword}"`,
        keyword: kw.keyword,
        old_value: String(kw.previous_position || 'N/A'),
        new_value: String(kw.current_position),
        change_magnitude: kw.position_change,
      });
    }

    // Check for gap opportunities (competitor ranks top 10, we don't)
    if (
      kw.current_position &&
      kw.current_position <= 10 &&
      (!kw.tenant_position || kw.tenant_position > 20) &&
      kw.search_volume >= 100
    ) {
      alerts.push({
        tenant_id: tenantId,
        competitor_id: competitorId,
        alert_type: 'opportunity',
        severity: 'info',
        title: `Keyword gap opportunity: "${kw.keyword}"`,
        description: `${competitor.domain} ranks #${kw.current_position} with ${kw.search_volume} monthly searches`,
        keyword: kw.keyword,
      });
    }
  }

  // Store alerts
  if (alerts.length > 0) {
    const { data, error } = await supabase
      .from('synthex_competitor_alerts')
      .insert(alerts.map((a) => ({ ...a, status: 'new', action_items: [] })))
      .select();

    if (error) {
      console.error('Error storing alerts:', error);
    }

    return (data || []) as CompetitorAlert[];
  }

  return [];
}

/**
 * Get alerts for a tenant
 */
export async function getAlerts(
  tenantId: string,
  options: { status?: string; limit?: number } = {}
): Promise<CompetitorAlert[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('synthex_competitor_alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching alerts:', error);
    throw new Error(`Failed to get alerts: ${error.message}`);
  }

  return data || [];
}

/**
 * Acknowledge or dismiss an alert
 */
export async function updateAlertStatus(
  tenantId: string,
  alertId: string,
  status: 'acknowledged' | 'resolved' | 'dismissed',
  userId?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = { status };
  if (status === 'acknowledged' && userId) {
    updateData.acknowledged_by = userId;
    updateData.acknowledged_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('synthex_competitor_alerts')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', alertId);

  if (error) {
    console.error('Error updating alert:', error);
    throw new Error(`Failed to update alert: ${error.message}`);
  }
}

/**
 * Get keyword gap analysis
 */
export async function getKeywordGaps(tenantId: string): Promise<KeywordGapResult[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_competitor_keywords')
    .select('*')
    .eq('tenant_id', tenantId)
    .not('gap_score', 'is', null)
    .order('gap_score', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching keyword gaps:', error);
    throw new Error(`Failed to get keyword gaps: ${error.message}`);
  }

  return (data || []).map((kw) => ({
    keyword: kw.keyword,
    competitor_position: kw.current_position || 0,
    tenant_position: kw.tenant_position,
    gap_score: kw.gap_score || 0,
    opportunity_type: !kw.tenant_position ? 'new' : kw.tenant_position > 10 ? 'improve' : 'defend',
    search_volume: kw.search_volume || 0,
    difficulty: kw.keyword_difficulty,
  }));
}

/**
 * Update competitor profile
 */
export async function updateCompetitor(
  tenantId: string,
  competitorId: string,
  updates: Partial<Pick<CompetitorProfile, 'company_name' | 'competitor_type' | 'priority' | 'is_active'>>
): Promise<CompetitorProfile> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_competitor_profiles')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', competitorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating competitor:', error);
    throw new Error(`Failed to update competitor: ${error.message}`);
  }

  return data;
}

/**
 * Delete competitor
 */
export async function deleteCompetitor(tenantId: string, competitorId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('synthex_competitor_profiles')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', competitorId);

  if (error) {
    console.error('Error deleting competitor:', error);
    throw new Error(`Failed to delete competitor: ${error.message}`);
  }
}

/**
 * Get competitor dashboard summary
 */
export async function getCompetitorSummary(tenantId: string): Promise<{
  total_competitors: number;
  high_threat_count: number;
  new_alerts_count: number;
  top_opportunities: KeywordGapResult[];
  threat_distribution: Record<ThreatLevel, number>;
}> {
  const supabase = getSupabaseAdmin();

  const [competitorsResult, alertsResult] = await Promise.all([
    supabase
      .from('synthex_competitor_profiles')
      .select('threat_level')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('synthex_competitor_alerts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'new'),
  ]);

  const competitors = competitorsResult.data || [];
  const alerts = alertsResult.data || [];

  const threatDistribution: Record<ThreatLevel, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    minimal: 0,
  };

  for (const c of competitors) {
    threatDistribution[c.threat_level as ThreatLevel]++;
  }

  const opportunities = await getKeywordGaps(tenantId);

  return {
    total_competitors: competitors.length,
    high_threat_count: threatDistribution.critical + threatDistribution.high,
    new_alerts_count: alerts.length,
    top_opportunities: opportunities.slice(0, 5),
    threat_distribution: threatDistribution,
  };
}
