/**
 * Keyword Tracking Service
 *
 * Service for managing keywords, tracking rankings, and analyzing keyword performance.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  SearchKeyword,
  KeywordStatus,
  SearchEngine,
  NormalizedRankData,
} from './searchProviderTypes';
import { searchSuiteConfig } from '../../../config/searchSuite.config';

export interface AddKeywordsOptions {
  tags?: string[];
  targetUrl?: string;
  priority?: number;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
}

export interface KeywordFilters {
  status?: KeywordStatus[];
  tags?: string[];
  minRank?: number;
  maxRank?: number;
  hasRank?: boolean;
  search?: string;
}

export interface RankingTrend {
  keyword: string;
  keywordId: string;
  currentRank: number | null;
  previousRank: number | null;
  bestRank: number | null;
  change: number;
  trend: 'improving' | 'declining' | 'stable' | 'new';
  history: Array<{ date: Date; rank: number | null }>;
}

export interface KeywordStats {
  total: number;
  active: number;
  ranking: number;
  top3: number;
  top10: number;
  top20: number;
  notRanking: number;
  avgPosition: number;
  improvingCount: number;
  decliningCount: number;
}

class KeywordTrackingService {
  /**
   * Add keywords to track
   */
  async addKeywords(
    projectId: string,
    workspaceId: string,
    keywords: string[],
    options: AddKeywordsOptions = {}
  ): Promise<{ added: string[]; duplicates: string[] }> {
    const supabase = await getSupabaseServer();
    const added: string[] = [];
    const duplicates: string[] = [];

    // Check for existing keywords
    const { data: existing } = await supabase
      .from('search_keywords')
      .select('keyword')
      .eq('project_id', projectId)
      .in('keyword', keywords);

    const existingSet = new Set((existing || []).map((k) => k.keyword.toLowerCase()));

    // Add new keywords
    const newKeywords = keywords.filter((k) => {
      if (existingSet.has(k.toLowerCase())) {
        duplicates.push(k);
        return false;
      }
      return true;
    });

    if (newKeywords.length > 0) {
      const { error } = await supabase.from('search_keywords').insert(
        newKeywords.map((keyword) => ({
          project_id: projectId,
          workspace_id: workspaceId,
          keyword,
          status: 'active' as KeywordStatus,
          tags: options.tags,
          target_url: options.targetUrl,
          priority: options.priority,
          search_volume: options.searchVolume,
          difficulty: options.difficulty,
          cpc: options.cpc,
        }))
      );

      if (!error) {
        added.push(...newKeywords);
      }
    }

    return { added, duplicates };
  }

  /**
   * Get keywords for a project
   */
  async getKeywords(
    projectId: string,
    filters: KeywordFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ keywords: SearchKeyword[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('search_keywords')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId);

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.minRank !== undefined) {
      query = query.gte('current_rank', filters.minRank);
    }

    if (filters.maxRank !== undefined) {
      query = query.lte('current_rank', filters.maxRank);
    }

    if (filters.hasRank === true) {
      query = query.not('current_rank', 'is', null);
    } else if (filters.hasRank === false) {
      query = query.is('current_rank', null);
    }

    if (filters.search) {
      query = query.ilike('keyword', `%${filters.search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('priority', { ascending: false, nullsFirst: false });

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      keywords: (data || []).map(this.mapKeywordFromDb),
      total: count || 0,
    };
  }

  /**
   * Update keyword properties
   */
  async updateKeyword(
    keywordId: string,
    updates: Partial<{
      status: KeywordStatus;
      tags: string[];
      targetUrl: string;
      priority: number;
      searchVolume: number;
      difficulty: number;
      cpc: number;
    }>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.status) {
dbUpdates.status = updates.status;
}
    if (updates.tags) {
dbUpdates.tags = updates.tags;
}
    if (updates.targetUrl !== undefined) {
dbUpdates.target_url = updates.targetUrl;
}
    if (updates.priority !== undefined) {
dbUpdates.priority = updates.priority;
}
    if (updates.searchVolume !== undefined) {
dbUpdates.search_volume = updates.searchVolume;
}
    if (updates.difficulty !== undefined) {
dbUpdates.difficulty = updates.difficulty;
}
    if (updates.cpc !== undefined) {
dbUpdates.cpc = updates.cpc;
}

    const { error } = await supabase
      .from('search_keywords')
      .update(dbUpdates)
      .eq('id', keywordId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete keywords
   */
  async deleteKeywords(keywordIds: string[]): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('search_keywords')
      .delete()
      .in('id', keywordIds);

    if (error) {
      throw error;
    }
  }

  /**
   * Get ranking trends for keywords
   */
  async getRankingTrends(
    projectId: string,
    days = 30
  ): Promise<RankingTrend[]> {
    const supabase = await getSupabaseServer();

    // Get keywords with their snapshots
    const { data: keywords } = await supabase
      .from('search_keywords')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active');

    if (!keywords || keywords.length === 0) {
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends: RankingTrend[] = [];

    for (const keyword of keywords) {
      // Get snapshot history
      const { data: snapshots } = await supabase
        .from('search_serp_snapshots')
        .select('snapshot_date, organic_results')
        .eq('keyword_id', keyword.id)
        .gte('snapshot_date', startDate.toISOString())
        .order('snapshot_date', { ascending: true });

      const history = (snapshots || []).map((s) => {
        const results = s.organic_results as Array<{ isOurSite: boolean; position: number }>;
        const ourResult = results?.find((r) => r.isOurSite);
        return {
          date: new Date(s.snapshot_date),
          rank: ourResult?.position || null,
        };
      });

      // Calculate change
      const currentRank = keyword.current_rank;
      const previousRank = keyword.previous_rank;
      const change = previousRank && currentRank ? previousRank - currentRank : 0;

      // Determine trend
      let trend: 'improving' | 'declining' | 'stable' | 'new' = 'stable';
      if (!previousRank && currentRank) {
        trend = 'new';
      } else if (change > 2) {
        trend = 'improving';
      } else if (change < -2) {
        trend = 'declining';
      }

      trends.push({
        keyword: keyword.keyword,
        keywordId: keyword.id,
        currentRank,
        previousRank,
        bestRank: keyword.best_rank,
        change,
        trend,
        history,
      });
    }

    return trends;
  }

  /**
   * Get keyword statistics
   */
  async getKeywordStats(projectId: string): Promise<KeywordStats> {
    const supabase = await getSupabaseServer();

    const { data: keywords, error } = await supabase
      .from('search_keywords')
      .select('status, current_rank, previous_rank')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const stats: KeywordStats = {
      total: keywords?.length || 0,
      active: 0,
      ranking: 0,
      top3: 0,
      top10: 0,
      top20: 0,
      notRanking: 0,
      avgPosition: 0,
      improvingCount: 0,
      decliningCount: 0,
    };

    let positionSum = 0;
    let positionCount = 0;

    for (const k of keywords || []) {
      if (k.status === 'active') {
        stats.active++;
      }

      if (k.current_rank) {
        stats.ranking++;
        positionSum += k.current_rank;
        positionCount++;

        if (k.current_rank <= 3) {
stats.top3++;
}
        if (k.current_rank <= 10) {
stats.top10++;
}
        if (k.current_rank <= 20) {
stats.top20++;
}

        if (k.previous_rank) {
          const change = k.previous_rank - k.current_rank;
          if (change > 2) {
stats.improvingCount++;
}
          if (change < -2) {
stats.decliningCount++;
}
        }
      } else {
        stats.notRanking++;
      }
    }

    stats.avgPosition = positionCount > 0 ? positionSum / positionCount : 0;

    return stats;
  }

  /**
   * Get top movers (biggest rank changes)
   */
  async getTopMovers(
    projectId: string,
    limit = 10
  ): Promise<{
    gainers: Array<{ keyword: string; keywordId: string; change: number; currentRank: number }>;
    losers: Array<{ keyword: string; keywordId: string; change: number; currentRank: number }>;
  }> {
    const supabase = await getSupabaseServer();

    const { data: keywords } = await supabase
      .from('search_keywords')
      .select('id, keyword, current_rank, previous_rank')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .not('current_rank', 'is', null)
      .not('previous_rank', 'is', null);

    const movers = (keywords || [])
      .map((k) => ({
        keyword: k.keyword,
        keywordId: k.id,
        currentRank: k.current_rank!,
        previousRank: k.previous_rank!,
        change: k.previous_rank! - k.current_rank!,
      }))
      .filter((m) => Math.abs(m.change) > 0);

    // Sort by change
    movers.sort((a, b) => b.change - a.change);

    return {
      gainers: movers.filter((m) => m.change > 0).slice(0, limit),
      losers: movers.filter((m) => m.change < 0).slice(0, limit),
    };
  }

  /**
   * Import keywords from file (CSV format)
   */
  async importKeywordsFromCsv(
    projectId: string,
    workspaceId: string,
    csvContent: string
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter((l) => l.trim());
    const errors: string[] = [];
    const keywords: Array<{
      keyword: string;
      searchVolume?: number;
      difficulty?: number;
      cpc?: number;
      targetUrl?: string;
      tags?: string[];
    }> = [];

    // Parse CSV (assuming first row is header)
    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};

        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (!row.keyword) {
          errors.push(`Row ${i + 1}: Missing keyword`);
          continue;
        }

        keywords.push({
          keyword: row.keyword,
          searchVolume: row.search_volume ? parseInt(row.search_volume) : undefined,
          difficulty: row.difficulty ? parseInt(row.difficulty) : undefined,
          cpc: row.cpc ? parseFloat(row.cpc) : undefined,
          targetUrl: row.target_url || row.url,
          tags: row.tags ? row.tags.split(';').map((t) => t.trim()) : undefined,
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: ${String(error)}`);
      }
    }

    // Bulk add keywords
    let imported = 0;
    let skipped = 0;

    for (const kw of keywords) {
      const result = await this.addKeywords(projectId, workspaceId, [kw.keyword], {
        searchVolume: kw.searchVolume,
        difficulty: kw.difficulty,
        cpc: kw.cpc,
        targetUrl: kw.targetUrl,
        tags: kw.tags,
      });

      imported += result.added.length;
      skipped += result.duplicates.length;
    }

    return { imported, skipped, errors };
  }

  /**
   * Export keywords to CSV
   */
  async exportKeywordsToCsv(projectId: string): Promise<string> {
    const { keywords } = await this.getKeywords(projectId, {}, 1, 10000);

    const header = ['keyword', 'current_rank', 'previous_rank', 'best_rank', 'search_volume', 'difficulty', 'cpc', 'target_url', 'tags', 'status'];
    const rows = keywords.map((k) => [
      `"${k.keyword}"`,
      k.currentRank || '',
      k.previousRank || '',
      k.bestRank || '',
      k.searchVolume || '',
      k.difficulty || '',
      k.cpc || '',
      `"${k.targetUrl || ''}"`,
      `"${(k.tags || []).join(';')}"`,
      k.status,
    ].join(','));

    return [header.join(','), ...rows].join('\n');
  }

  /**
   * Get keyword suggestions based on existing keywords
   */
  async getSuggestedKeywords(
    projectId: string,
    limit = 20
  ): Promise<Array<{ keyword: string; reason: string; estimatedDifficulty?: number }>> {
    const supabase = await getSupabaseServer();

    // Get existing keywords
    const { data: existing } = await supabase
      .from('search_keywords')
      .select('keyword')
      .eq('project_id', projectId);

    const existingKeywords = (existing || []).map((k) => k.keyword);

    // In production, this would call a keyword research API
    // For now, generate variations
    const suggestions: Array<{ keyword: string; reason: string; estimatedDifficulty?: number }> = [];

    for (const kw of existingKeywords.slice(0, 5)) {
      // Long-tail variations
      suggestions.push({
        keyword: `best ${kw}`,
        reason: `Long-tail variation of "${kw}"`,
        estimatedDifficulty: 40,
      });
      suggestions.push({
        keyword: `${kw} near me`,
        reason: `Local variation of "${kw}"`,
        estimatedDifficulty: 35,
      });
      suggestions.push({
        keyword: `how to ${kw}`,
        reason: `Question variation of "${kw}"`,
        estimatedDifficulty: 45,
      });
    }

    // Filter out already tracked keywords
    return suggestions
      .filter((s) => !existingKeywords.some((e) => e.toLowerCase() === s.keyword.toLowerCase()))
      .slice(0, limit);
  }

  // Private helper methods

  private mapKeywordFromDb(data: Record<string, unknown>): SearchKeyword {
    return {
      id: data.id as string,
      projectId: data.project_id as string,
      workspaceId: data.workspace_id as string,
      keyword: data.keyword as string,
      searchVolume: data.search_volume as number | undefined,
      difficulty: data.difficulty as number | undefined,
      cpc: data.cpc as number | undefined,
      status: data.status as KeywordStatus,
      tags: data.tags as string[] | undefined,
      targetUrl: data.target_url as string | undefined,
      priority: data.priority as number | undefined,
      currentRank: data.current_rank as number | undefined,
      previousRank: data.previous_rank as number | undefined,
      bestRank: data.best_rank as number | undefined,
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const keywordTrackingService = new KeywordTrackingService();
