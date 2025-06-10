import { getSupabaseClient } from '@/lib/supabase/client';
import type { 
  SearchOptions, 
  SearchResult, 
  SearchSuggestion, 
  SearchQuery,
  SearchAnalytics 
} from '@/types/search';

export class SearchService {
  /**
   * Search content across the site
   */
  static async searchContent(options: SearchOptions): Promise<{
    results: SearchResult[];
    totalResults: number;
    queryId: string;
  }> {
    try {
      const supabase = getSupabaseClient();
      const { 
        query, 
        type = null, 
        locale = 'en', 
        limit = 10, 
        offset = 0,
        filters = {}
      } = options;

      // Call the search function
      const { data: results, error } = await supabase
        .rpc('search_content', {
          search_query: query,
          search_type: type,
          search_locale: locale,
          limit_results: limit,
          offset_results: offset
        });

      if (error) throw error;

      // Record the search query
      const { data: queryData, error: queryError } = await supabase
        .rpc('record_search_query', {
          query_text: query,
          results: results?.length || 0,
          filters: filters
        });

      if (queryError) {
        console.error('Failed to record search query:', queryError);
      }

      return {
        results: results || [],
        totalResults: results?.length || 0,
        queryId: queryData || ''
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  static async getSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    try {
      if (partialQuery.length < 2) return [];

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .rpc('get_search_suggestions', {
          partial_query: partialQuery,
          limit_results: 5
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Record a clicked search result
   */
  static async recordClickedResult(queryId: string, resultUrl: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('search_queries')
        .update({ clicked_result: resultUrl })
        .eq('id', queryId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to record clicked result:', error);
    }
  }

  /**
   * Get popular searches
   */
  static async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('search_queries')
        .select('query')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count occurrences
      const searchCounts = (data || []).reduce<Record<string, number>>((acc, { query }) => {
        acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {});

      // Sort by count and return top results
      return Object.entries(searchCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get popular searches:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  static async getSearchAnalytics(): Promise<SearchAnalytics> {
    try {
      const supabase = getSupabaseClient();
      
      // Get popular searches
      const popularSearches = await this.getPopularSearches();

      // Get search volume over time
      const { data: volumeData, error: volumeError } = await supabase
        .from('search_queries')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (volumeError) throw volumeError;

      // Group by date
      const volumeByDate = (volumeData || []).reduce<Record<string, number>>((acc, { created_at }) => {
        const date = new Date(created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const searchVolume = Object.entries(volumeByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate click-through rate
      const { data: ctrData, error: ctrError } = await supabase
        .from('search_queries')
        .select('clicked_result')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (ctrError) throw ctrError;

      const totalQueries = ctrData?.length || 0;
      const clickedQueries = ctrData?.filter(q => q.clicked_result).length || 0;
      const clickThroughRate = totalQueries > 0 ? (clickedQueries / totalQueries) * 100 : 0;

      // Calculate average results per query
      const { data: avgData, error: avgError } = await supabase
        .from('search_queries')
        .select('results_count')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (avgError) throw avgError;

      const totalResults = avgData?.reduce((sum, { results_count }) => sum + results_count, 0) || 0;
      const avgResultsPerQuery = avgData?.length ? totalResults / avgData.length : 0;

      return {
        popularSearches,
        searchVolume,
        clickThroughRate,
        avgResultsPerQuery
      };
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      return {
        popularSearches: [],
        searchVolume: [],
        clickThroughRate: 0,
        avgResultsPerQuery: 0
      };
    }
  }

  /**
   * Index content for search
   */
  static async indexContent(content: {
    type: string;
    title: string;
    content: string;
    url: string;
    meta_description?: string;
    tags?: string[];
    category?: string;
    locale?: string;
  }): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('search_indices')
        .upsert({
          ...content,
          locale: content.locale || 'en',
          last_indexed: new Date().toISOString()
        }, {
          onConflict: 'url'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to index content:', error);
      throw error;
    }
  }

  /**
   * Remove content from search index
   */
  static async removeFromIndex(url: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('search_indices')
        .delete()
        .eq('url', url);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove from index:', error);
      throw error;
    }
  }

  /**
   * Batch index content
   */
  static async batchIndexContent(contents: Array<{
    type: string;
    title: string;
    content: string;
    url: string;
    meta_description?: string;
    tags?: string[];
    category?: string;
    locale?: string;
  }>): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const indexedContents = contents.map(content => ({
        ...content,
        locale: content.locale || 'en',
        last_indexed: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('search_indices')
        .upsert(indexedContents, {
          onConflict: 'url'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to batch index content:', error);
      throw error;
    }
  }
}
