/**
 * Search Suite Agent
 *
 * Agent for tracking keyword rankings across Google, Bing, and Brave search engines.
 * Monitors SERP features, detects ranking changes, and identifies optimization opportunities.
 *
 * @module agents/searchSuiteAgent
 */

import { anthropic } from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { db } from '@/lib/db';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import {
  keywordTrackingService,
  type KeywordFilters,
  type RankingTrend,
  type KeywordStats,
} from '@/lib/searchSuite/keywordTrackingService';
import type { SearchKeyword } from '@/lib/searchSuite/searchProviderTypes';

// ============================================================================
// Types & Interfaces
// ============================================================================

// Using centralized Anthropic client from @/lib/anthropic/client

export interface RankingAlert {
  keywordId: string;
  keyword: string;
  alertType: 'major_drop' | 'major_gain' | 'entering_top10' | 'leaving_top10' | 'new_ranking';
  previousRank: number | null;
  currentRank: number | null;
  change: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface OpportunityDetection {
  opportunities: Array<{
    keyword: string;
    keywordId: string;
    opportunityType: 'quick_win' | 'high_impact' | 'long_term';
    currentRank: number;
    targetRank: number;
    estimatedEffort: 'low' | 'medium' | 'high';
    reasoning: string;
  }>;
  totalOpportunities: number;
  estimatedImpact: string;
}

export interface CompetitorGap {
  keyword: string;
  ourRank: number | null;
  competitorRank: number;
  gap: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  recommendation: string;
}

// ============================================================================
// Agent Functions
// ============================================================================

/**
 * Track keywords for a project
 */
export async function trackKeywords(
  projectId: string,
  workspaceId: string,
  keywords: string[],
  options?: {
    tags?: string[];
    targetUrl?: string;
    priority?: number;
  }
): Promise<{ added: string[]; duplicates: string[]; total: number }> {
  const result = await keywordTrackingService.addKeywords(
    projectId,
    workspaceId,
    keywords,
    options
  );

  // Log tracking initiation
  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'keywords_tracked',
    details: {
      projectId,
      added: result.added.length,
      duplicates: result.duplicates.length,
      tags: options?.tags,
    },
  });

  return {
    added: result.added,
    duplicates: result.duplicates,
    total: result.added.length,
  };
}

/**
 * Get keyword rankings with filters
 */
export async function getKeywordRankings(
  projectId: string,
  filters?: KeywordFilters,
  page = 1,
  limit = 50
): Promise<{ keywords: SearchKeyword[]; total: number }> {
  return await keywordTrackingService.getKeywords(projectId, filters, page, limit);
}

/**
 * Analyze ranking trends and detect patterns
 */
export async function analyzeRankings(
  projectId: string,
  workspaceId: string,
  days = 30
): Promise<{
  trends: RankingTrend[];
  alerts: RankingAlert[];
  summary: string;
}> {
  const trends = await keywordTrackingService.getRankingTrends(projectId, days);

  // Detect significant changes
  const alerts: RankingAlert[] = [];

  for (const trend of trends) {
    if (!trend.currentRank) continue;

    // Major drop (>5 positions)
    if (trend.change < -5) {
      alerts.push({
        keywordId: trend.keywordId,
        keyword: trend.keyword,
        alertType: 'major_drop',
        previousRank: trend.previousRank,
        currentRank: trend.currentRank,
        change: trend.change,
        severity: trend.change < -10 ? 'critical' : 'high',
        recommendation: 'Immediate review required - check content quality and technical issues',
      });
    }

    // Major gain (>5 positions)
    if (trend.change > 5) {
      alerts.push({
        keywordId: trend.keywordId,
        keyword: trend.keyword,
        alertType: 'major_gain',
        previousRank: trend.previousRank,
        currentRank: trend.currentRank,
        change: trend.change,
        severity: 'low',
        recommendation: 'Positive momentum - analyze success factors and replicate',
      });
    }

    // Entering top 10
    if (trend.currentRank <= 10 && trend.previousRank && trend.previousRank > 10) {
      alerts.push({
        keywordId: trend.keywordId,
        keyword: trend.keyword,
        alertType: 'entering_top10',
        previousRank: trend.previousRank,
        currentRank: trend.currentRank,
        change: trend.change,
        severity: 'low',
        recommendation: 'Push for top 3 - optimize featured snippets and CTR',
      });
    }

    // Leaving top 10
    if (trend.currentRank > 10 && trend.previousRank && trend.previousRank <= 10) {
      alerts.push({
        keywordId: trend.keywordId,
        keyword: trend.keyword,
        alertType: 'leaving_top10',
        previousRank: trend.previousRank,
        currentRank: trend.currentRank,
        change: trend.change,
        severity: 'high',
        recommendation: 'Critical - regain top 10 position through content refresh',
      });
    }

    // New ranking
    if (!trend.previousRank && trend.currentRank) {
      alerts.push({
        keywordId: trend.keywordId,
        keyword: trend.keyword,
        alertType: 'new_ranking',
        previousRank: trend.previousRank,
        currentRank: trend.currentRank,
        change: 0,
        severity: 'medium',
        recommendation: 'Monitor closely and optimize for improvement',
      });
    }
  }

  // Generate AI summary
  const systemPrompt = `You are an SEO analyst. Summarize keyword ranking trends in 2-3 sentences.
Focus on overall performance, major changes, and key insights.`;

  const userPrompt = `Ranking Analysis (${days} days):
- Total Keywords: ${trends.length}
- Improving: ${trends.filter((t) => t.trend === 'improving').length}
- Declining: ${trends.filter((t) => t.trend === 'declining').length}
- Stable: ${trends.filter((t) => t.trend === 'stable').length}
- New: ${trends.filter((t) => t.trend === 'new').length}
- Alerts: ${alerts.length} (${alerts.filter((a) => a.severity === 'critical').length} critical)

Provide a brief summary.`;

  let summary = 'Ranking analysis in progress.';

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: ANTHROPIC_MODELS.HAIKU_4_5,
        max_tokens: 500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-haiku-4-5-20251001');
    logCacheStats('SearchSuite:generateRankingSummary', cacheStats);

    summary =
      result.data.content[0].type === 'text' ? result.data.content[0].text : summary;
  } catch (error) {
    console.error('[SearchSuiteAgent] Summary generation error:', error);
  }

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'ranking_analysis',
    details: {
      projectId,
      days,
      trendsCount: trends.length,
      alertsCount: alerts.length,
      criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    },
  });

  return { trends, alerts, summary };
}

/**
 * Detect optimization opportunities based on current rankings
 */
export async function detectOpportunities(
  projectId: string,
  workspaceId: string
): Promise<OpportunityDetection> {
  const stats = await keywordTrackingService.getKeywordStats(projectId);
  const { keywords } = await keywordTrackingService.getKeywords(
    projectId,
    { hasRank: true },
    1,
    100
  );

  const systemPrompt = `You are an SEO strategist. Identify keyword optimization opportunities.

Return ONLY valid JSON with this structure:
{
  "opportunities": [
    {
      "keyword": "<keyword>",
      "keywordId": "<id>",
      "opportunityType": "quick_win" | "high_impact" | "long_term",
      "currentRank": <number>,
      "targetRank": <number>,
      "estimatedEffort": "low" | "medium" | "high",
      "reasoning": "<why this is an opportunity>"
    }
  ],
  "estimatedImpact": "<overall impact assessment>"
}

Opportunity types:
- quick_win: Keywords ranking 11-20 (easy push to page 1)
- high_impact: Keywords ranking 4-10 (potential for top 3)
- long_term: Keywords ranking 21+ (strategic investment)`;

  const userPrompt = `Keyword Portfolio:
- Total Tracked: ${stats.total}
- Currently Ranking: ${stats.ranking}
- Top 3: ${stats.top3}
- Top 10: ${stats.top10}
- Top 20: ${stats.top20}
- Not Ranking: ${stats.notRanking}

Current Rankings:
${keywords
  .slice(0, 20)
  .map((k) => `- "${k.keyword}": Rank ${k.currentRank || 'N/A'}`)
  .join('\n')}

Identify top 5-10 optimization opportunities.`;

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: ANTHROPIC_MODELS.SONNET_4_5,
        max_tokens: 2000,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-sonnet-4-5-20250929');
    logCacheStats('SearchSuite:identifyOpportunities', cacheStats);

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    const detection = JSON.parse(cleanJson);

    await db.auditLogs.create({
      workspace_id: workspaceId,
      action: 'opportunities_detected',
      details: {
        projectId,
        opportunitiesCount: detection.opportunities?.length || 0,
      },
    });

    return {
      opportunities: detection.opportunities || [],
      totalOpportunities: detection.opportunities?.length || 0,
      estimatedImpact: detection.estimatedImpact || 'Analysis complete',
    };
  } catch (error) {
    console.error('[SearchSuiteAgent] Opportunity detection error:', error);
    return {
      opportunities: [],
      totalOpportunities: 0,
      estimatedImpact: 'Analysis failed',
    };
  }
}

/**
 * Get keyword statistics
 */
export async function getKeywordStatistics(
  projectId: string
): Promise<KeywordStats> {
  return await keywordTrackingService.getKeywordStats(projectId);
}

/**
 * Get top movers (biggest ranking changes)
 */
export async function getTopMovers(
  projectId: string,
  limit = 10
): Promise<{
  gainers: Array<{ keyword: string; keywordId: string; change: number; currentRank: number }>;
  losers: Array<{ keyword: string; keywordId: string; change: number; currentRank: number }>;
}> {
  return await keywordTrackingService.getTopMovers(projectId, limit);
}

/**
 * Import keywords from CSV
 */
export async function importKeywordsFromCsv(
  projectId: string,
  workspaceId: string,
  csvContent: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = await keywordTrackingService.importKeywordsFromCsv(
    projectId,
    workspaceId,
    csvContent
  );

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'keywords_imported',
    details: {
      projectId,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length,
    },
  });

  return result;
}

/**
 * Export keywords to CSV
 */
export async function exportKeywordsToCsv(projectId: string): Promise<string> {
  return await keywordTrackingService.exportKeywordsToCsv(projectId);
}

/**
 * Update keyword properties
 */
export async function updateKeyword(
  keywordId: string,
  workspaceId: string,
  updates: {
    status?: 'active' | 'paused' | 'archived';
    tags?: string[];
    targetUrl?: string;
    priority?: number;
  }
): Promise<void> {
  await keywordTrackingService.updateKeyword(keywordId, updates);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'keyword_updated',
    details: {
      keywordId,
      updates,
    },
  });
}

/**
 * Delete keywords
 */
export async function deleteKeywords(
  keywordIds: string[],
  workspaceId: string
): Promise<void> {
  await keywordTrackingService.deleteKeywords(keywordIds);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'keywords_deleted',
    details: {
      count: keywordIds.length,
      keywordIds,
    },
  });
}

// Export singleton instance
export const searchSuiteAgent = {
  trackKeywords,
  getKeywordRankings,
  analyzeRankings,
  detectOpportunities,
  getKeywordStatistics,
  getTopMovers,
  importKeywordsFromCsv,
  exportKeywordsToCsv,
  updateKeyword,
  deleteKeywords,
};
