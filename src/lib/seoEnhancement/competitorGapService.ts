/**
 * Competitor Gap Analysis Service
 * Keyword gaps, content gaps, and backlink gap analysis using DataForSEO
 */

import { getSupabaseServer } from '@/lib/supabase';
import { DataForSEOClient } from '@/server/dataforseoClient';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize DataForSEO client
function getDataForSEOClient(): DataForSEOClient | null {
  const login = process.env.DATAFORSEO_LOGIN || process.env.DATAFORSEO_API_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD || process.env.DATAFORSEO_API_PASSWORD;

  if (!login || !password) {
    return null;
  }

  return new DataForSEOClient(login, password);
}

// Types
export interface CompetitorProfile {
  id: string;
  workspace_id: string;
  client_domain: string;
  competitor_domain: string;
  competitor_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KeywordGapAnalysis {
  id: string;
  workspace_id: string;
  client_domain: string;
  total_client_keywords: number;
  total_competitor_keywords: number;
  shared_keywords: number;
  client_unique_keywords: number;
  competitor_unique_keywords: number;
  missing_keywords: KeywordGap[];
  weak_keywords: KeywordGap[];
  strong_keywords: KeywordGap[];
  opportunity_keywords: KeywordGap[];
  quick_wins: KeywordOpportunity[];
  strategic_targets: KeywordOpportunity[];
  analyzed_at: string;
  created_at: string;
}

export interface ContentGapAnalysis {
  id: string;
  workspace_id: string;
  client_domain: string;
  client_topics: string[];
  competitor_topics: string[];
  missing_topics: TopicGap[];
  missing_content_types: string[];
  competitor_page_types: Record<string, number>;
  client_page_types: Record<string, number>;
  content_recommendations: ContentRecommendation[];
  priority_topics: TopicGap[];
  analyzed_at: string;
  created_at: string;
}

export interface BacklinkGapAnalysis {
  id: string;
  workspace_id: string;
  client_domain: string;
  client_domain_authority: number;
  avg_competitor_domain_authority: number;
  client_backlinks: number;
  client_referring_domains: number;
  avg_competitor_backlinks: number;
  avg_competitor_referring_domains: number;
  link_gap_domains: LinkGapDomain[];
  common_link_sources: CommonLinkSource[];
  high_value_opportunities: LinkOpportunity[];
  easy_win_opportunities: LinkOpportunity[];
  client_toxic_links: number;
  toxic_link_details: ToxicLink[];
  analyzed_at: string;
  created_at: string;
}

export interface KeywordGap {
  keyword: string;
  search_volume: number;
  difficulty?: number;
  client_position?: number;
  competitor_position?: number;
  gap_type: 'missing' | 'weak' | 'strong';
  intent?: 'informational' | 'navigational' | 'transactional' | 'commercial';
}

export interface KeywordOpportunity {
  keyword: string;
  search_volume: number;
  difficulty: number;
  estimated_traffic: number;
  priority_score: number;
  reason: string;
}

export interface TopicGap {
  topic: string;
  relevance_score: number;
  competitor_coverage: number; // How many competitors cover it
  content_type_suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ContentRecommendation {
  topic: string;
  suggested_format: string;
  target_keywords: string[];
  estimated_traffic: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
}

export interface LinkGapDomain {
  domain: string;
  domain_authority: number;
  links_to_competitors: number;
  competitor_domains: string[];
}

export interface CommonLinkSource {
  domain: string;
  domain_authority: number;
  competitors_linked: number;
  total_competitors: number;
}

export interface LinkOpportunity {
  domain: string;
  domain_authority: number;
  opportunity_type: 'guest_post' | 'resource_link' | 'directory' | 'mention' | 'broken_link';
  estimated_difficulty: 'easy' | 'medium' | 'hard';
  contact_url?: string;
  notes: string;
}

export interface ToxicLink {
  source_domain: string;
  spam_score: number;
  reason: string;
}

/**
 * Add or update competitor profile
 */
export async function addCompetitor(
  workspaceId: string,
  clientDomain: string,
  competitorDomain: string,
  competitorName?: string
): Promise<CompetitorProfile> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('competitor_profiles')
    .upsert({
      workspace_id: workspaceId,
      client_domain: clientDomain,
      competitor_domain: competitorDomain,
      competitor_name: competitorName,
      is_active: true,
    }, {
      onConflict: 'workspace_id,client_domain,competitor_domain',
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to add competitor: ${error.message}`);
}
  return data;
}

/**
 * Get competitors for a client domain
 */
export async function getCompetitors(
  workspaceId: string,
  clientDomain: string
): Promise<CompetitorProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('competitor_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_domain', clientDomain)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
throw new Error(`Failed to fetch competitors: ${error.message}`);
}
  return data || [];
}

/**
 * Run keyword gap analysis
 */
export async function analyzeKeywordGap(
  workspaceId: string,
  clientDomain: string
): Promise<KeywordGapAnalysis> {
  const supabase = await getSupabaseServer();
  const client = getDataForSEOClient();

  // Get competitors
  const competitors = await getCompetitors(workspaceId, clientDomain);
  const competitorDomains = competitors.map(c => c.competitor_domain);

  const clientKeywords: KeywordGap[] = [];
  const competitorKeywords: KeywordGap[] = [];
  const missingKeywords: KeywordGap[] = [];
  const weakKeywords: KeywordGap[] = [];
  const strongKeywords: KeywordGap[] = [];

  if (client && competitorDomains.length > 0) {
    try {
      // Use DataForSEO to get keyword gap data
      const gapData = await client.getKeywordGap(clientDomain, competitorDomains);

      // Process gap data
      for (const item of gapData.slice(0, 100)) {
        const keyword: KeywordGap = {
          keyword: item.keyword,
          search_volume: item.searchVolume || 0,
          difficulty: item.competition ? Math.round(item.competition * 100) : undefined,
          client_position: item.target1Position,
          competitor_position: item.target2Position,
          gap_type: 'missing',
        };

        if (!item.target1Position && item.target2Position) {
          keyword.gap_type = 'missing';
          missingKeywords.push(keyword);
        } else if (item.target1Position && item.target2Position) {
          if (item.target1Position > item.target2Position + 5) {
            keyword.gap_type = 'weak';
            weakKeywords.push(keyword);
          } else if (item.target1Position < item.target2Position - 5) {
            keyword.gap_type = 'strong';
            strongKeywords.push(keyword);
          }
        }
      }
    } catch (error) {
      console.error('[CompetitorGap] DataForSEO keyword gap error:', error);
    }
  }

  // Generate opportunities using AI
  const opportunities = await generateKeywordOpportunities(
    clientDomain,
    missingKeywords.slice(0, 20),
    weakKeywords.slice(0, 20)
  );

  const { data, error } = await supabase
    .from('keyword_gap_analysis')
    .insert({
      workspace_id: workspaceId,
      client_domain: clientDomain,
      total_client_keywords: strongKeywords.length + weakKeywords.length,
      total_competitor_keywords: missingKeywords.length + weakKeywords.length,
      shared_keywords: weakKeywords.length + strongKeywords.length,
      client_unique_keywords: strongKeywords.length,
      competitor_unique_keywords: missingKeywords.length,
      missing_keywords: missingKeywords.slice(0, 50),
      weak_keywords: weakKeywords.slice(0, 50),
      strong_keywords: strongKeywords.slice(0, 50),
      opportunity_keywords: [...missingKeywords, ...weakKeywords]
        .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
        .slice(0, 20),
      quick_wins: opportunities.quickWins,
      strategic_targets: opportunities.strategicTargets,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save keyword gap analysis: ${error.message}`);
}
  return data;
}

/**
 * Generate keyword opportunities using AI
 */
async function generateKeywordOpportunities(
  domain: string,
  missingKeywords: KeywordGap[],
  weakKeywords: KeywordGap[]
): Promise<{
  quickWins: KeywordOpportunity[];
  strategicTargets: KeywordOpportunity[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Analyze these keyword gaps and categorize into quick wins vs strategic targets:

Domain: ${domain}

Missing Keywords (competitors rank, we don't):
${missingKeywords.slice(0, 10).map(k => `- "${k.keyword}" (vol: ${k.search_volume}, competitor pos: ${k.competitor_position})`).join('\n')}

Weak Keywords (we rank lower than competitors):
${weakKeywords.slice(0, 10).map(k => `- "${k.keyword}" (vol: ${k.search_volume}, our pos: ${k.client_position}, competitor pos: ${k.competitor_position})`).join('\n')}

Categorize into:
1. Quick Wins: Low difficulty, can rank quickly (existing page optimization, low competition)
2. Strategic Targets: High value but requires more effort (new content, link building)

Return JSON:
{
  "quickWins": [{"keyword": "", "search_volume": 0, "difficulty": 30, "estimated_traffic": 0, "priority_score": 80, "reason": ""}],
  "strategicTargets": [{"keyword": "", "search_volume": 0, "difficulty": 70, "estimated_traffic": 0, "priority_score": 60, "reason": ""}]
}`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[CompetitorGap] Opportunity generation failed:', error);
  }

  return { quickWins: [], strategicTargets: [] };
}

/**
 * Run content gap analysis
 */
export async function analyzeContentGap(
  workspaceId: string,
  clientDomain: string
): Promise<ContentGapAnalysis> {
  const supabase = await getSupabaseServer();

  // Get competitors
  const competitors = await getCompetitors(workspaceId, clientDomain);

  // Generate content gaps using AI analysis
  const contentGaps = await generateContentGapAnalysis(
    clientDomain,
    competitors.map(c => c.competitor_domain)
  );

  const { data, error } = await supabase
    .from('content_gap_analysis')
    .insert({
      workspace_id: workspaceId,
      client_domain: clientDomain,
      client_topics: contentGaps.clientTopics,
      competitor_topics: contentGaps.competitorTopics,
      missing_topics: contentGaps.missingTopics,
      missing_content_types: contentGaps.missingContentTypes,
      competitor_page_types: contentGaps.competitorPageTypes,
      client_page_types: contentGaps.clientPageTypes,
      content_recommendations: contentGaps.recommendations,
      priority_topics: contentGaps.priorityTopics,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save content gap analysis: ${error.message}`);
}
  return data;
}

/**
 * Generate content gap analysis using AI
 */
async function generateContentGapAnalysis(
  clientDomain: string,
  competitorDomains: string[]
): Promise<{
  clientTopics: string[];
  competitorTopics: string[];
  missingTopics: TopicGap[];
  missingContentTypes: string[];
  competitorPageTypes: Record<string, number>;
  clientPageTypes: Record<string, number>;
  recommendations: ContentRecommendation[];
  priorityTopics: TopicGap[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Analyze content gaps between a domain and its competitors:

Client Domain: ${clientDomain}
Competitor Domains: ${competitorDomains.join(', ')}

Based on typical industry patterns, generate a content gap analysis including:
1. Topics the client likely covers
2. Topics competitors likely cover
3. Missing topics (competitors have, client doesn't)
4. Content type gaps (guides, comparisons, case studies, etc.)
5. Priority recommendations

Return JSON:
{
  "clientTopics": ["topic1", "topic2"],
  "competitorTopics": ["topic1", "topic3"],
  "missingTopics": [{"topic": "", "relevance_score": 80, "competitor_coverage": 3, "content_type_suggestion": "guide", "priority": "high"}],
  "missingContentTypes": ["comparison guides", "case studies"],
  "competitorPageTypes": {"blog": 50, "guide": 20, "product": 30},
  "clientPageTypes": {"blog": 40, "product": 60},
  "recommendations": [{"topic": "", "suggested_format": "comprehensive guide", "target_keywords": [], "estimated_traffic": 1000, "difficulty": "medium", "priority": "high"}],
  "priorityTopics": [{"topic": "", "relevance_score": 90, "competitor_coverage": 4, "content_type_suggestion": "", "priority": "high"}]
}`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const match = text.text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    console.error('[CompetitorGap] Content gap analysis failed:', error);
  }

  return {
    clientTopics: [],
    competitorTopics: [],
    missingTopics: [],
    missingContentTypes: [],
    competitorPageTypes: {},
    clientPageTypes: {},
    recommendations: [],
    priorityTopics: [],
  };
}

/**
 * Run backlink gap analysis
 */
export async function analyzeBacklinkGap(
  workspaceId: string,
  clientDomain: string
): Promise<BacklinkGapAnalysis> {
  const supabase = await getSupabaseServer();
  const client = getDataForSEOClient();

  // Get competitors
  const competitors = await getCompetitors(workspaceId, clientDomain);
  const competitorDomains = competitors.map(c => c.competitor_domain);

  let clientBacklinks = { total: 0, referringDomains: 0, rank: 0 };
  const competitorBacklinks: Array<{ total: number; referringDomains: number; rank: number }> = [];
  const linkGapDomains: LinkGapDomain[] = [];

  if (client) {
    try {
      // Get client backlinks
      const clientData = await client.getBacklinks(clientDomain);
      clientBacklinks = {
        total: clientData.totalBacklinks || 0,
        referringDomains: clientData.referringDomains || 0,
        rank: clientData.rank || 0,
      };

      // Get competitor backlinks
      for (const competitor of competitorDomains.slice(0, 3)) {
        try {
          const compData = await client.getBacklinks(competitor);
          competitorBacklinks.push({
            total: compData.totalBacklinks || 0,
            referringDomains: compData.referringDomains || 0,
            rank: compData.rank || 0,
          });
        } catch {
          competitorBacklinks.push({ total: 0, referringDomains: 0, rank: 0 });
        }
      }

      // Get referring domains for gap analysis
      const clientReferrers = await client.getReferringDomains(clientDomain, { limit: 100 });
      const clientReferrerSet = new Set(clientReferrers.map(r => r.domain));

      for (const competitor of competitorDomains.slice(0, 2)) {
        try {
          const compReferrers = await client.getReferringDomains(competitor, { limit: 100 });
          for (const ref of compReferrers) {
            if (!clientReferrerSet.has(ref.domain) && ref.rank > 20) {
              const existing = linkGapDomains.find(d => d.domain === ref.domain);
              if (existing) {
                existing.links_to_competitors++;
                existing.competitor_domains.push(competitor);
              } else {
                linkGapDomains.push({
                  domain: ref.domain,
                  domain_authority: ref.rank,
                  links_to_competitors: 1,
                  competitor_domains: [competitor],
                });
              }
            }
          }
        } catch {
          // Continue on error
        }
      }
    } catch (error) {
      console.error('[CompetitorGap] DataForSEO backlink error:', error);
    }
  }

  // Calculate averages
  const avgCompBacklinks = competitorBacklinks.length > 0
    ? Math.round(competitorBacklinks.reduce((sum, c) => sum + c.total, 0) / competitorBacklinks.length)
    : 0;
  const avgCompReferringDomains = competitorBacklinks.length > 0
    ? Math.round(competitorBacklinks.reduce((sum, c) => sum + c.referringDomains, 0) / competitorBacklinks.length)
    : 0;
  const avgCompDA = competitorBacklinks.length > 0
    ? Math.round(competitorBacklinks.reduce((sum, c) => sum + c.rank, 0) / competitorBacklinks.length)
    : 0;

  // Sort link gaps by authority
  linkGapDomains.sort((a, b) => b.domain_authority - a.domain_authority);

  // Generate opportunities
  const opportunities = generateLinkOpportunities(linkGapDomains.slice(0, 20));

  const { data, error } = await supabase
    .from('backlink_gap_analysis')
    .insert({
      workspace_id: workspaceId,
      client_domain: clientDomain,
      client_domain_authority: clientBacklinks.rank,
      avg_competitor_domain_authority: avgCompDA,
      client_backlinks: clientBacklinks.total,
      client_referring_domains: clientBacklinks.referringDomains,
      avg_competitor_backlinks: avgCompBacklinks,
      avg_competitor_referring_domains: avgCompReferringDomains,
      link_gap_domains: linkGapDomains.slice(0, 50),
      common_link_sources: linkGapDomains
        .filter(d => d.links_to_competitors >= 2)
        .map(d => ({
          domain: d.domain,
          domain_authority: d.domain_authority,
          competitors_linked: d.links_to_competitors,
          total_competitors: competitorDomains.length,
        })),
      high_value_opportunities: opportunities.highValue,
      easy_win_opportunities: opportunities.easyWins,
      client_toxic_links: 0,
      toxic_link_details: [],
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save backlink gap analysis: ${error.message}`);
}
  return data;
}

/**
 * Generate link building opportunities
 */
function generateLinkOpportunities(linkGapDomains: LinkGapDomain[]): {
  highValue: LinkOpportunity[];
  easyWins: LinkOpportunity[];
} {
  const highValue: LinkOpportunity[] = [];
  const easyWins: LinkOpportunity[] = [];

  for (const gap of linkGapDomains) {
    const opportunity: LinkOpportunity = {
      domain: gap.domain,
      domain_authority: gap.domain_authority,
      opportunity_type: 'resource_link',
      estimated_difficulty: gap.domain_authority > 50 ? 'hard' : (gap.domain_authority > 30 ? 'medium' : 'easy'),
      notes: `Links to ${gap.links_to_competitors} competitor(s)`,
    };

    if (gap.domain_authority >= 40) {
      highValue.push(opportunity);
    } else if (gap.domain_authority >= 20) {
      easyWins.push(opportunity);
    }
  }

  return {
    highValue: highValue.slice(0, 10),
    easyWins: easyWins.slice(0, 10),
  };
}

/**
 * Get latest keyword gap analysis
 */
export async function getKeywordGapAnalysis(
  workspaceId: string,
  clientDomain: string
): Promise<KeywordGapAnalysis | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('keyword_gap_analysis')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_domain', clientDomain)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch analysis: ${error.message}`);
  }

  return data;
}

/**
 * Get latest content gap analysis
 */
export async function getContentGapAnalysis(
  workspaceId: string,
  clientDomain: string
): Promise<ContentGapAnalysis | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_gap_analysis')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_domain', clientDomain)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch analysis: ${error.message}`);
  }

  return data;
}

/**
 * Get latest backlink gap analysis
 */
export async function getBacklinkGapAnalysis(
  workspaceId: string,
  clientDomain: string
): Promise<BacklinkGapAnalysis | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('backlink_gap_analysis')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_domain', clientDomain)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch analysis: ${error.message}`);
  }

  return data;
}

// Singleton export
export const competitorGapService = {
  addCompetitor,
  getCompetitors,
  analyzeKeywordGap,
  analyzeContentGap,
  analyzeBacklinkGap,
  getKeywordGapAnalysis,
  getContentGapAnalysis,
  getBacklinkGapAnalysis,
};
