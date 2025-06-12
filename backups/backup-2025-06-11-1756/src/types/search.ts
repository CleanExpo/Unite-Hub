export interface SearchIndex {
  id: string;
  type: 'page' | 'service' | 'blog' | 'resource' | 'case_study';
  title: string;
  content: string;
  url: string;
  meta_description?: string;
  tags: string[];
  category?: string;
  locale: string;
  priority: number;
  last_indexed: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends SearchIndex {
  rank: number;
  highlight: string;
}

export interface SearchQuery {
  id: string;
  query: string;
  results_count: number;
  user_id?: string;
  session_id?: string;
  clicked_result?: string;
  search_filters: SearchFilters;
  created_at: string;
}

export interface SearchSuggestion {
  term: string;
  type?: 'query' | 'product' | 'service' | 'topic';
  frequency: number;
}

export interface SearchFilters {
  type?: string[];
  category?: string[];
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
}

export interface SearchOptions {
  query: string;
  type?: string;
  locale?: string;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchAnalytics {
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
  searchVolume: Array<{
    date: string;
    count: number;
  }>;
  clickThroughRate: number;
  avgResultsPerQuery: number;
}
