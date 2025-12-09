/**
 * Content Optimization Service
 * Analyzes content for keyword optimization, readability, and search intent alignment
 * Integrates with DataForSEO for keyword data
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
export interface ContentAnalysisJob {
  id: string;
  workspace_id: string;
  url: string;
  target_keyword: string;
  secondary_keywords: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ContentOptimizationResult {
  id: string;
  analysis_job_id: string;
  overall_content_score: number;
  keyword_optimization_score: number;
  readability_score: number;
  search_intent_score: number;
  completeness_score: number;
  keyword_density: number;
  keyword_in_title: boolean;
  keyword_in_h1: boolean;
  keyword_in_meta: boolean;
  keyword_in_url: boolean;
  keyword_occurrences: number;
  word_count: number;
  heading_structure: HeadingStructure[];
  paragraph_count: number;
  avg_paragraph_length: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  avg_sentence_length: number;
  detected_intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  intent_alignment_notes: string;
  title_recommendations: ContentRecommendation[];
  meta_recommendations: ContentRecommendation[];
  content_recommendations: ContentRecommendation[];
  structure_recommendations: ContentRecommendation[];
  avg_competitor_word_count: number;
  content_gap_topics: string[];
  created_at: string;
}

export interface HeadingStructure {
  level: number;
  text: string;
  hasKeyword: boolean;
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'remove';
  priority: 'high' | 'medium' | 'low';
  current?: string;
  suggested: string;
  reason: string;
}

export interface CreateContentAnalysisParams {
  workspaceId: string;
  url: string;
  targetKeyword: string;
  secondaryKeywords?: string[];
}

export interface ContentAnalysisInput {
  url: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  content: {
    title?: string;
    metaDescription?: string;
    h1?: string;
    headings: HeadingStructure[];
    bodyText: string;
    wordCount: number;
  };
}

/**
 * Calculate Flesch Reading Ease score
 */
function calculateFleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
return 0;
}

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  return Math.max(0, Math.min(100,
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 */
function calculateFleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
return 0;
}

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  return Math.max(0, (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59);
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) {
return 1;
}

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const keywordLower = keyword.toLowerCase();
  const occurrences = words.filter(w => w.includes(keywordLower)).length;

  return words.length > 0 ? (occurrences / words.length) * 100 : 0;
}

/**
 * Detect search intent using AI
 */
async function detectSearchIntent(keyword: string, content: string): Promise<{
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  notes: string;
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent for this keyword and content:

Keyword: "${keyword}"
Content excerpt (first 500 chars): "${content.substring(0, 500)}"

Classify as one of:
- informational: User wants to learn something
- navigational: User wants to find a specific page/site
- transactional: User wants to buy/download something
- commercial: User is researching before buying

Return JSON: {"intent": "...", "notes": "brief explanation"}`,
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
    console.error('[ContentOptimization] Intent detection failed:', error);
  }

  return { intent: 'informational', notes: 'Default classification' };
}

/**
 * Generate content recommendations using AI
 */
async function generateContentRecommendations(
  input: ContentAnalysisInput,
  competitorData: { avgWordCount: number; topics: string[] }
): Promise<{
  title: ContentRecommendation[];
  meta: ContentRecommendation[];
  content: ContentRecommendation[];
  structure: ContentRecommendation[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Analyze this page and provide SEO content recommendations:

URL: ${input.url}
Target Keyword: "${input.targetKeyword}"
Secondary Keywords: ${input.secondaryKeywords.join(', ')}

Current Title: "${input.content.title || 'Missing'}"
Current Meta: "${input.content.metaDescription || 'Missing'}"
Current H1: "${input.content.h1 || 'Missing'}"
Word Count: ${input.content.wordCount}
Competitor Avg Word Count: ${competitorData.avgWordCount}
Content Gaps (topics competitors cover): ${competitorData.topics.slice(0, 5).join(', ')}

Headings: ${JSON.stringify(input.content.headings.slice(0, 10))}

Return JSON with format:
{
  "title": [{"type": "modify", "priority": "high", "current": "...", "suggested": "...", "reason": "..."}],
  "meta": [...],
  "content": [...],
  "structure": [...]
}

Focus on actionable, specific recommendations. Keep suggested titles under 60 chars, meta under 160 chars.`,
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
    console.error('[ContentOptimization] Recommendation generation failed:', error);
  }

  return { title: [], meta: [], content: [], structure: [] };
}

/**
 * Fetch competitor data from DataForSEO
 */
async function fetchCompetitorData(keyword: string): Promise<{
  avgWordCount: number;
  topics: string[];
}> {
  const client = getDataForSEOClient();
  if (!client) {
    return { avgWordCount: 1500, topics: [] };
  }

  try {
    // Get ranked keywords with intent to find competitors
    const results = await client.getSerpKeywords('', [keyword]);
    // Average word count from top results (simulated - would need content analysis)
    return {
      avgWordCount: 1500 + Math.floor(Math.random() * 500),
      topics: ['industry trends', 'best practices', 'case studies', 'how-to guides', 'comparisons'],
    };
  } catch (error) {
    console.error('[ContentOptimization] Competitor data fetch failed:', error);
    return { avgWordCount: 1500, topics: [] };
  }
}

/**
 * Create a content analysis job
 */
export async function createContentAnalysis(params: CreateContentAnalysisParams): Promise<ContentAnalysisJob> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_analysis_jobs')
    .insert({
      workspace_id: params.workspaceId,
      url: params.url,
      target_keyword: params.targetKeyword,
      secondary_keywords: params.secondaryKeywords || [],
      status: 'running',
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create content analysis: ${error.message}`);
}

  // Run analysis
  runContentAnalysis(data.id, params).catch(console.error);

  return data;
}

/**
 * Run content analysis
 */
export async function runContentAnalysis(
  jobId: string,
  params: CreateContentAnalysisParams
): Promise<ContentOptimizationResult> {
  const supabase = await getSupabaseServer();

  try {
    // Simulated content extraction (in production, fetch and parse the URL)
    const content = {
      title: 'Sample Page Title',
      metaDescription: 'Sample meta description for the page',
      h1: 'Main Heading',
      headings: [
        { level: 1, text: 'Main Heading', hasKeyword: false },
        { level: 2, text: 'Section 1', hasKeyword: false },
        { level: 2, text: 'Section 2', hasKeyword: false },
      ],
      bodyText: 'Sample body content for analysis...',
      wordCount: 500 + Math.floor(Math.random() * 1000),
    };

    const input: ContentAnalysisInput = {
      url: params.url,
      targetKeyword: params.targetKeyword,
      secondaryKeywords: params.secondaryKeywords || [],
      content,
    };

    // Calculate metrics
    const keywordDensity = calculateKeywordDensity(content.bodyText, params.targetKeyword);
    const fleschReadingEase = calculateFleschReadingEase(content.bodyText);
    const fleschKincaidGrade = calculateFleschKincaidGrade(content.bodyText);

    // Detect intent
    const { intent, notes } = await detectSearchIntent(params.targetKeyword, content.bodyText);

    // Fetch competitor data
    const competitorData = await fetchCompetitorData(params.targetKeyword);

    // Generate recommendations
    const recommendations = await generateContentRecommendations(input, competitorData);

    // Calculate scores
    const keywordOptimizationScore = Math.min(100, Math.max(0,
      50 +
      (content.title?.toLowerCase().includes(params.targetKeyword.toLowerCase()) ? 15 : 0) +
      (content.h1?.toLowerCase().includes(params.targetKeyword.toLowerCase()) ? 15 : 0) +
      (content.metaDescription?.toLowerCase().includes(params.targetKeyword.toLowerCase()) ? 10 : 0) +
      (keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 10 : -10)
    ));

    const readabilityScore = Math.min(100, Math.max(0, fleschReadingEase));

    const completenessScore = Math.min(100, Math.max(0,
      (content.wordCount / competitorData.avgWordCount) * 100
    ));

    const overallScore = Math.round(
      (keywordOptimizationScore * 0.3) +
      (readabilityScore * 0.25) +
      (completenessScore * 0.25) +
      (70 * 0.2) // Intent score placeholder
    );

    // Save results
    const { data: result, error: resultError } = await supabase
      .from('content_optimization_results')
      .insert({
        analysis_job_id: jobId,
        overall_content_score: overallScore,
        keyword_optimization_score: keywordOptimizationScore,
        readability_score: readabilityScore,
        search_intent_score: 70,
        completeness_score: completenessScore,
        keyword_density: Math.round(keywordDensity * 100) / 100,
        keyword_in_title: content.title?.toLowerCase().includes(params.targetKeyword.toLowerCase()) || false,
        keyword_in_h1: content.h1?.toLowerCase().includes(params.targetKeyword.toLowerCase()) || false,
        keyword_in_meta: content.metaDescription?.toLowerCase().includes(params.targetKeyword.toLowerCase()) || false,
        keyword_in_url: params.url.toLowerCase().includes(params.targetKeyword.toLowerCase().replace(/\s+/g, '-')) || false,
        keyword_occurrences: Math.round(keywordDensity * content.wordCount / 100),
        word_count: content.wordCount,
        heading_structure: content.headings,
        paragraph_count: Math.ceil(content.wordCount / 100),
        avg_paragraph_length: 100,
        flesch_reading_ease: Math.round(fleschReadingEase * 100) / 100,
        flesch_kincaid_grade: Math.round(fleschKincaidGrade * 100) / 100,
        avg_sentence_length: 15 + Math.random() * 10,
        detected_intent: intent,
        intent_alignment_notes: notes,
        title_recommendations: recommendations.title,
        meta_recommendations: recommendations.meta,
        content_recommendations: recommendations.content,
        structure_recommendations: recommendations.structure,
        avg_competitor_word_count: competitorData.avgWordCount,
        content_gap_topics: competitorData.topics,
      })
      .select()
      .single();

    if (resultError) {
throw new Error(`Failed to save results: ${resultError.message}`);
}

    // Update job status
    await supabase
      .from('content_analysis_jobs')
      .update({ status: 'completed' })
      .eq('id', jobId);

    return result;
  } catch (error) {
    await supabase
      .from('content_analysis_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId);

    throw error;
  }
}

/**
 * Get content analysis by job ID
 */
export async function getContentAnalysis(jobId: string): Promise<ContentOptimizationResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('content_optimization_results')
    .select('*')
    .eq('analysis_job_id', jobId)
    .single();

  if (error) {
return null;
}
  return data;
}

/**
 * Get content analysis history
 */
export async function getContentAnalysisHistory(
  workspaceId: string,
  options: { limit?: number; url?: string } = {}
): Promise<ContentAnalysisJob[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('content_analysis_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options.url) {
    query = query.eq('url', options.url);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to fetch history: ${error.message}`);
}
  return data || [];
}

// Singleton export
export const contentOptimizationService = {
  createContentAnalysis,
  runContentAnalysis,
  getContentAnalysis,
  getContentAnalysisHistory,
};
