/**
 * CONVEX Strategy Advanced Search and Filtering
 *
 * Implements comprehensive search capabilities:
 * - Full-text search across strategies
 * - Multi-criteria filtering
 * - Saved search filters
 * - Advanced query builder
 * - Search analytics
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
}

export interface SearchQuery {
  workspaceId: string;
  searchText?: string;
  filters?: SearchFilter[];
  sortBy?: 'score' | 'date' | 'name' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  strategy_id: string;
  businessName: string;
  framework: string;
  convex_score: number;
  compliance_status: string;
  created_at: string;
  relevance?: number; // 0-100 for full-text search
}

export interface SavedSearch {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  filters: SearchFilter[];
  created_by: string;
  created_at: string;
  last_used_at?: string;
  usageCount: number;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Execute advanced search
 */
export async function searchStrategies(
  query: SearchQuery
): Promise<SearchResult[]> {
  try {
    const supabase = await getSupabaseServer();

    // Start with base query
    let q = supabase
      .from('convex_strategy_scores')
      .select('id, strategy_id, convex_score, compliance_status, created_at, metadata->>businessName as businessName, metadata->>framework as framework')
      .eq('workspace_id', query.workspaceId);

    // Apply filters
    if (query.filters && query.filters.length > 0) {
      query.filters.forEach((filter) => {
        switch (filter.operator) {
          case 'eq':
            q = q.eq(filter.field, filter.value);
            break;
          case 'gt':
            q = q.gt(filter.field, filter.value);
            break;
          case 'lt':
            q = q.lt(filter.field, filter.value);
            break;
          case 'gte':
            q = q.gte(filter.field, filter.value);
            break;
          case 'lte':
            q = q.lte(filter.field, filter.value);
            break;
          case 'contains':
            q = q.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'in':
            q = q.in(filter.field, filter.value);
            break;
          case 'between':
            q = q.gte(filter.field, filter.value[0]).lte(filter.field, filter.value[1]);
            break;
        }
      });
    }

    // Apply sorting
    const sortField = query.sortBy === 'score' ? 'convex_score' : query.sortBy === 'date' ? 'created_at' : 'metadata->>businessName';
    q = q.order(sortField, { ascending: query.sortOrder === 'asc' });

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;

    if (error) {
      logger.warn('[CONVEX-SEARCH] Search failed:', error);
      return [];
    }

    let results = (data || []) as SearchResult[];

    // Apply full-text search if provided
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      results = results
        .map((r) => ({
          ...r,
          relevance: calculateRelevance(r, searchLower),
        }))
        .filter((r) => r.relevance! > 0)
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    }

    logger.info(`[CONVEX-SEARCH] Search returned ${results.length} results`);
    return results;
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Search error:', error);
    return [];
  }
}

/**
 * Calculate relevance score for full-text search (0-100)
 */
function calculateRelevance(result: SearchResult, searchText: string): number {
  let score = 0;

  const searchLower = searchText.toLowerCase();
  const businessNameLower = result.businessName?.toLowerCase() || '';
  const frameworkLower = result.framework?.toLowerCase() || '';

  // Exact match
  if (businessNameLower === searchLower) score += 100;
  // Starts with
  else if (businessNameLower.startsWith(searchLower)) score += 80;
  // Contains
  else if (businessNameLower.includes(searchLower)) score += 60;

  // Framework match
  if (frameworkLower === searchLower) score += 20;
  else if (frameworkLower.includes(searchLower)) score += 10;

  return Math.min(100, score);
}

/**
 * Get filter options for UI
 */
export interface FilterOption {
  field: string;
  label: string;
  type: 'enum' | 'numeric' | 'date' | 'text';
  values?: any[];
}

export function getFilterOptions(): FilterOption[] {
  return [
    {
      field: 'compliance_status',
      label: 'Compliance Status',
      type: 'enum',
      values: ['pass', 'needs_revision', 'fail'],
    },
    {
      field: 'metadata->>framework',
      label: 'Framework',
      type: 'enum',
      values: [
        'brand_positioning',
        'funnel_design',
        'seo_patterns',
        'competitor_model',
        'offer_architecture',
      ],
    },
    {
      field: 'convex_score',
      label: 'CONVEX Score',
      type: 'numeric',
    },
    {
      field: 'created_at',
      label: 'Created Date',
      type: 'date',
    },
    {
      field: 'metadata->>businessName',
      label: 'Business Name',
      type: 'text',
    },
  ];
}

// ============================================================================
// SAVED SEARCHES
// ============================================================================

/**
 * Save a search filter
 */
export async function saveSearch(
  workspaceId: string,
  userId: string,
  name: string,
  filters: SearchFilter[],
  description?: string
): Promise<SavedSearch | null> {
  try {
    const supabase = await getSupabaseServer();

    const searchRecord = {
      workspace_id: workspaceId,
      name,
      description,
      filters,
      created_by: userId,
      usageCount: 0,
    };

    const { data, error } = await supabase
      .from('convex_saved_searches')
      .insert([searchRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-SEARCH] Failed to save search:', error);
      return null;
    }

    logger.info(`[CONVEX-SEARCH] Search saved: ${name}`);
    return data as SavedSearch;
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Save search error:', error);
    return null;
  }
}

/**
 * Get saved searches for workspace
 */
export async function getSavedSearches(
  workspaceId: string
): Promise<SavedSearch[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_saved_searches')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('usageCount', { ascending: false });

    if (error) {
      logger.warn('[CONVEX-SEARCH] Failed to get saved searches:', error);
      return [];
    }

    return (data || []) as SavedSearch[];
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Get saved searches error:', error);
    return [];
  }
}

/**
 * Get a saved search
 */
export async function getSavedSearch(
  searchId: string,
  workspaceId: string
): Promise<SavedSearch | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_saved_searches')
      .select('*')
      .eq('id', searchId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      logger.warn('[CONVEX-SEARCH] Saved search not found:', error);
      return null;
    }

    return data as SavedSearch;
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Get saved search error:', error);
    return null;
  }
}

/**
 * Execute a saved search
 */
export async function executeSavedSearch(
  searchId: string,
  workspaceId: string
): Promise<SearchResult[]> {
  try {
    const savedSearch = await getSavedSearch(searchId, workspaceId);

    if (!savedSearch) {
      logger.warn(`[CONVEX-SEARCH] Saved search not found: ${searchId}`);
      return [];
    }

    // Update last used time
    const supabase = await getSupabaseServer();
    await supabase
      .from('convex_saved_searches')
      .update({
        last_used_at: new Date().toISOString(),
        usageCount: savedSearch.usageCount + 1,
      })
      .eq('id', searchId);

    // Execute search with saved filters
    const results = await searchStrategies({
      workspaceId,
      filters: savedSearch.filters,
    });

    logger.info(
      `[CONVEX-SEARCH] Executed saved search "${savedSearch.name}" - ${results.length} results`
    );

    return results;
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Execute saved search error:', error);
    return [];
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(
  searchId: string,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('workspace_id', workspaceId)
      .eq('created_by', userId);

    if (error) {
      logger.error('[CONVEX-SEARCH] Failed to delete saved search:', error);
      return false;
    }

    logger.info(`[CONVEX-SEARCH] Saved search deleted: ${searchId}`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Delete saved search error:', error);
    return false;
  }
}

// ============================================================================
// SEARCH ANALYTICS
// ============================================================================

export interface SearchAnalytics {
  totalSearches: number;
  averageResults: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  topFilters: Array<{ field: string; count: number }>;
  successRate: number; // % of searches with results
}

/**
 * Get search analytics for workspace
 */
export async function getSearchAnalytics(
  workspaceId: string,
  days: number = 30
): Promise<SearchAnalytics> {
  try {
    const supabase = await getSupabaseServer();

    // Get search history from activity logs
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('convex_strategy_activity')
      .select('metadata')
      .eq('activity_type', 'searched')
      .gte('created_at', since);

    if (error) {
      logger.warn('[CONVEX-SEARCH] Failed to get search analytics:', error);
      return {
        totalSearches: 0,
        averageResults: 0,
        topSearchTerms: [],
        topFilters: [],
        successRate: 0,
      };
    }

    const searches = data || [];
    const topTerms: Record<string, number> = {};
    const topFilters: Record<string, number> = {};
    let totalResults = 0;
    let successCount = 0;

    searches.forEach((s: any) => {
      if (s.metadata?.searchText) {
        topTerms[s.metadata.searchText] = (topTerms[s.metadata.searchText] || 0) + 1;
      }

      if (s.metadata?.filters) {
        s.metadata.filters.forEach((f: SearchFilter) => {
          topFilters[f.field] = (topFilters[f.field] || 0) + 1;
        });
      }

      if (s.metadata?.resultCount) {
        totalResults += s.metadata.resultCount;
        if (s.metadata.resultCount > 0) successCount++;
      }
    });

    const topSearchTerms = Object.entries(topTerms)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topFiltersArray = Object.entries(topFilters)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches: searches.length,
      averageResults: searches.length > 0 ? totalResults / searches.length : 0,
      topSearchTerms,
      topFilters: topFiltersArray,
      successRate: searches.length > 0 ? (successCount / searches.length) * 100 : 0,
    };
  } catch (error) {
    logger.error('[CONVEX-SEARCH] Analytics error:', error);
    return {
      totalSearches: 0,
      averageResults: 0,
      topSearchTerms: [],
      topFilters: [],
      successRate: 0,
    };
  }
}
