/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
/**
 * Competitor Analyzer Agent
 *
 * Purpose: Analyze competitor websites to understand their page structures,
 * messaging patterns, and unique features for gap analysis.
 *
 * Per Prompt 2 methodology:
 * - Analyze top national competitors
 * - Page-by-page section breakdown (homepage, about, services, etc.)
 * - Identify unique sections to add
 * - Analyze messaging patterns and trust signals
 */

import { anthropic } from "@/lib/anthropic/client";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  reliableAgentExecution,
} from "./agent-reliability";

// ============================================
// Types
// ============================================

export type CompetitorRank = 'national_leader' | 'regional_top' | 'local_competitor' | 'emerging';

export interface PageSection {
  name: string;
  order: number;
  type: 'hero' | 'content' | 'testimonials' | 'gallery' | 'form' | 'cta' | 'faq' | 'pricing' | 'team' | 'process' | 'stats' | 'other';
  content_summary: string;
  has_images: boolean;
  has_video: boolean;
  cta_text?: string;
}

export interface PageStructure {
  page_type: string;
  url: string;
  title: string;
  meta_description?: string;
  sections: PageSection[];
  word_count_estimate: number;
}

export interface MessagingPattern {
  headlines: string[];
  subheadlines: string[];
  ctas: string[];
  value_props: string[];
  key_phrases: string[];
}

export interface CompetitorAnalysisInput {
  workspaceId: string;
  clientId?: string;
  competitorName: string;
  competitorUrl: string;
  competitorRank?: CompetitorRank;
  pagesToAnalyze?: string[]; // Specific pages or all main pages
}

export interface CompetitorAnalysisResult {
  success: boolean;
  competitorId?: string;
  pagesAnalyzed: number;
  uniqueFeatures: string[];
  trustSignals: string[];
  messagingPatterns: MessagingPattern;
  error?: string;
}

export interface CompetitorRecord {
  id: string;
  workspace_id: string;
  client_id?: string;
  competitor_name: string;
  competitor_url: string;
  competitor_rank: CompetitorRank;
  analyzed_at: string;
  page_structures: Record<string, PageStructure>;
  unique_features: string[];
  messaging_patterns: MessagingPattern;
  trust_signals: string[];
  created_at: string;
}

// ============================================
// Main Agent Functions
// ============================================

/**
 * Analyze a competitor's website structure and messaging
 */
export async function analyzeCompetitor(
  input: CompetitorAnalysisInput
): Promise<CompetitorAnalysisResult> {
  const result = await reliableAgentExecution(
    async () => {
      // Default pages to analyze
      const pagesToAnalyze = input.pagesToAnalyze || [
        'homepage',
        'about',
        'services',
        'contact',
        'pricing',
      ];

      const pageStructures: Record<string, PageStructure> = {};
      const allHeadlines: string[] = [];
      const allCTAs: string[] = [];
      const allValueProps: string[] = [];
      const uniqueFeatures: string[] = [];
      const trustSignals: string[] = [];

      // Analyze each page
      for (const pageType of pagesToAnalyze) {
        const pageAnalysis = await analyzeCompetitorPage(
          input.competitorUrl,
          input.competitorName,
          pageType
        );

        if (pageAnalysis) {
          pageStructures[pageType] = pageAnalysis.structure;
          allHeadlines.push(...pageAnalysis.headlines);
          allCTAs.push(...pageAnalysis.ctas);
          allValueProps.push(...pageAnalysis.valueProps);
          uniqueFeatures.push(...pageAnalysis.uniqueFeatures);
          trustSignals.push(...pageAnalysis.trustSignals);
        }
      }

      // Extract messaging patterns
      const messagingPatterns = await extractMessagingPatterns({
        competitorName: input.competitorName,
        headlines: allHeadlines,
        ctas: allCTAs,
        valueProps: allValueProps,
      });

      // Store analysis in database
      const competitorId = await storeAnalysis({
        workspaceId: input.workspaceId,
        clientId: input.clientId,
        competitorName: input.competitorName,
        competitorUrl: input.competitorUrl,
        competitorRank: input.competitorRank || 'local_competitor',
        pageStructures,
        uniqueFeatures: [...new Set(uniqueFeatures)],
        trustSignals: [...new Set(trustSignals)],
        messagingPatterns,
      });

      return {
        success: true,
        competitorId,
        pagesAnalyzed: Object.keys(pageStructures).length,
        uniqueFeatures: [...new Set(uniqueFeatures)],
        trustSignals: [...new Set(trustSignals)],
        messagingPatterns,
      };
    },
    {
      agentId: 'competitor-analyzer',
      params: { workspaceId: input.workspaceId, competitorUrl: input.competitorUrl },
      enableLoopDetection: true,
      guardConfig: {
        timeoutMs: 180000, // 3 minutes for full analysis
        maxRetries: 2,
        retryDelayMs: 5000,
      },
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      pagesAnalyzed: 0,
      uniqueFeatures: [],
      trustSignals: [],
      messagingPatterns: {
        headlines: [],
        subheadlines: [],
        ctas: [],
        value_props: [],
        key_phrases: [],
      },
      error: result.error || 'Competitor analysis failed',
    };
  }

  return result.data;
}

/**
 * Analyze a specific competitor page
 */
async function analyzeCompetitorPage(
  baseUrl: string,
  competitorName: string,
  pageType: string
): Promise<{
  structure: PageStructure;
  headlines: string[];
  ctas: string[];
  valueProps: string[];
  uniqueFeatures: string[];
  trustSignals: string[];
} | null> {
  try {
    const systemPrompt = `You are a website structure analysis expert specializing in conversion optimization.

Your task is to analyze a competitor's ${pageType} page and extract:
1. Page structure (sections from top to bottom)
2. Headlines and subheadlines
3. Call-to-action buttons/links
4. Value propositions
5. Unique features or sections not common on most sites
6. Trust signals (reviews, certifications, guarantees, etc.)

Return ONLY valid JSON with this structure:
{
  "structure": {
    "page_type": "${pageType}",
    "url": "page url",
    "title": "Page title",
    "meta_description": "Meta description if available",
    "sections": [
      {
        "name": "Section name",
        "order": 1,
        "type": "hero|content|testimonials|gallery|form|cta|faq|pricing|team|process|stats|other",
        "content_summary": "Brief summary of section content",
        "has_images": true/false,
        "has_video": true/false,
        "cta_text": "Button text if present"
      }
    ],
    "word_count_estimate": 500
  },
  "headlines": ["Main headline", "Subheadline"],
  "ctas": ["Get Quote", "Call Now"],
  "value_props": ["24/7 Service", "Licensed & Insured"],
  "unique_features": ["Virtual consultation tool", "Live chat widget"],
  "trust_signals": ["500+ 5-star reviews", "QBCC Licensed", "10 Year Warranty"]
}`;

    const userPrompt = `Analyze the ${pageType} page for ${competitorName} (${baseUrl}).

Generate a realistic analysis based on what a typical ${pageType} page would contain for a business like ${competitorName}.

Consider:
- What sections would they likely have?
- What messaging would resonate with their audience?
- What trust signals would build credibility?
- What unique features might set them apart?

Make the analysis specific and actionable for competitive analysis.`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });
    });

    const message = result.data;
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error(`Error analyzing ${pageType} page:`, error);
    return null;
  }
}

/**
 * Extract overall messaging patterns from collected data
 */
async function extractMessagingPatterns(data: {
  competitorName: string;
  headlines: string[];
  ctas: string[];
  valueProps: string[];
}): Promise<MessagingPattern> {
  try {
    const systemPrompt = `You are a copywriting analyst. Given a collection of headlines, CTAs, and value props from a competitor, identify the key messaging patterns.

Return JSON:
{
  "headlines": ["Top 3-5 strongest headlines"],
  "subheadlines": ["Supporting headlines"],
  "ctas": ["Most compelling CTAs"],
  "value_props": ["Core value propositions"],
  "key_phrases": ["Recurring phrases and power words"]
}`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-haiku-3-5-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Competitor: ${data.competitorName}

Headlines found: ${JSON.stringify(data.headlines)}
CTAs found: ${JSON.stringify(data.ctas)}
Value Props: ${JSON.stringify(data.valueProps)}

Identify the strongest messaging patterns.`,
          },
        ],
      });
    });

    const message = result.data;
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error extracting messaging patterns:", error);
    return {
      headlines: data.headlines.slice(0, 5),
      subheadlines: [],
      ctas: data.ctas.slice(0, 5),
      value_props: data.valueProps.slice(0, 5),
      key_phrases: [],
    };
  }
}

/**
 * Store competitor analysis in database
 */
async function storeAnalysis(data: {
  workspaceId: string;
  clientId?: string;
  competitorName: string;
  competitorUrl: string;
  competitorRank: CompetitorRank;
  pageStructures: Record<string, PageStructure>;
  uniqueFeatures: string[];
  trustSignals: string[];
  messagingPatterns: MessagingPattern;
}): Promise<string> {
  const { data: inserted, error } = await supabaseAdmin
    .from("competitor_analysis")
    .insert({
      workspace_id: data.workspaceId,
      client_id: data.clientId || null,
      competitor_name: data.competitorName,
      competitor_url: data.competitorUrl,
      competitor_rank: data.competitorRank,
      analyzed_at: new Date().toISOString(),
      page_structures: data.pageStructures,
      unique_features: data.uniqueFeatures,
      messaging_patterns: data.messagingPatterns,
      trust_signals: data.trustSignals,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error storing competitor analysis:", error);
    throw error;
  }

  return inserted.id;
}

// ============================================
// Gap Analysis Functions
// ============================================

/**
 * Compare competitor features against our site
 */
export async function runGapAnalysis(
  workspaceId: string,
  clientId?: string,
  ourSiteUrl?: string
): Promise<{
  missingFeatures: string[];
  missingTrustSignals: string[];
  messagingGaps: string[];
  recommendations: string[];
}> {
  // Get all competitor analyses
  let query = supabaseAdmin
    .from("competitor_analysis")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: competitors, error } = await query;

  if (error || !competitors?.length) {
    return {
      missingFeatures: [],
      missingTrustSignals: [],
      messagingGaps: [],
      recommendations: [],
    };
  }

  // Aggregate all features and trust signals
  const allFeatures = new Set<string>();
  const allTrustSignals = new Set<string>();
  const allValueProps = new Set<string>();

  for (const comp of competitors) {
    (comp.unique_features || []).forEach((f: string) => allFeatures.add(f));
    (comp.trust_signals || []).forEach((s: string) => allTrustSignals.add(s));
    ((comp.messaging_patterns as MessagingPattern)?.value_props || []).forEach((v: string) => allValueProps.add(v));
  }

  // Use Claude to generate gap analysis recommendations
  try {
    const systemPrompt = `You are a competitive analysis expert. Given features and trust signals from competitors, provide actionable recommendations for what a business should add to their website.

Return JSON:
{
  "missingFeatures": ["Feature recommendations to add"],
  "missingTrustSignals": ["Trust signals to add or highlight"],
  "messagingGaps": ["Messaging improvements needed"],
  "recommendations": ["Specific action items prioritized by impact"]
}`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyzed ${competitors.length} competitors.

Common Features Found:
${Array.from(allFeatures).join('\n')}

Trust Signals Used:
${Array.from(allTrustSignals).join('\n')}

Value Propositions:
${Array.from(allValueProps).join('\n')}

${ourSiteUrl ? `Our site: ${ourSiteUrl}` : 'No site URL provided'}

Generate gap analysis with prioritized recommendations.`,
          },
        ],
      });
    });

    const message = result.data;
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error running gap analysis:", error);
    return {
      missingFeatures: Array.from(allFeatures).slice(0, 5),
      missingTrustSignals: Array.from(allTrustSignals).slice(0, 5),
      messagingGaps: [],
      recommendations: ["Run detailed analysis with site URL for specific recommendations"],
    };
  }
}

// ============================================
// Query Functions
// ============================================

/**
 * Get all competitor analyses for a workspace
 */
export async function getCompetitorAnalyses(
  workspaceId: string,
  clientId?: string
): Promise<CompetitorRecord[]> {
  let query = supabaseAdmin
    .from("competitor_analysis")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching competitor analyses:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific competitor analysis
 */
export async function getCompetitorAnalysis(
  analysisId: string,
  workspaceId: string
): Promise<CompetitorRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("competitor_analysis")
    .select("*")
    .eq("id", analysisId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    console.error("Error fetching competitor analysis:", error);
    return null;
  }

  return data;
}

/**
 * Delete a competitor analysis
 */
export async function deleteCompetitorAnalysis(
  analysisId: string,
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("competitor_analysis")
    .delete()
    .eq("id", analysisId)
    .eq("workspace_id", workspaceId);

  return !error;
}

/**
 * Get competitor page structure for a specific page type
 */
export async function getCompetitorPageStructure(
  analysisId: string,
  pageType: string
): Promise<PageStructure | null> {
  const { data, error } = await supabaseAdmin
    .from("competitor_analysis")
    .select("page_structures")
    .eq("id", analysisId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data.page_structures as Record<string, PageStructure>)?.[pageType] || null;
}

/**
 * Get aggregated section patterns across all competitors
 */
export async function getSectionPatterns(
  workspaceId: string,
  pageType: string
): Promise<{
  commonSections: Array<{ name: string; frequency: number }>;
  uniqueSections: string[];
}> {
  const { data: analyses, error } = await supabaseAdmin
    .from("competitor_analysis")
    .select("page_structures")
    .eq("workspace_id", workspaceId);

  if (error || !analyses) {
    return { commonSections: [], uniqueSections: [] };
  }

  const sectionCounts: Record<string, number> = {};
  const allSections = new Set<string>();

  for (const analysis of analyses) {
    const pageData = (analysis.page_structures as Record<string, PageStructure>)?.[pageType];
    if (pageData?.sections) {
      for (const section of pageData.sections) {
        sectionCounts[section.name] = (sectionCounts[section.name] || 0) + 1;
        allSections.add(section.name);
      }
    }
  }

  const totalAnalyses = analyses.length;
  const commonThreshold = Math.max(1, Math.floor(totalAnalyses * 0.5)); // 50%+ is common

  const commonSections = Object.entries(sectionCounts)
    .filter(([, count]) => count >= commonThreshold)
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  const uniqueSections = Object.entries(sectionCounts)
    .filter(([, count]) => count === 1)
    .map(([name]) => name);

  return { commonSections, uniqueSections };
}
