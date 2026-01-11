'use client';

/**
 * Global Search & Knowledge Graph Console
 *
 * Phase: D58 - Global Search & Knowledge Graph
 * Tables: unite_search_index, unite_knowledge_edges, unite_search_queries
 *
 * Features:
 * - Global search across all entities
 * - Search analytics and query insights
 * - Knowledge graph visualization
 * - AI-powered query expansion
 * - Entity relationship browsing
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Search,
  TrendingUp,
  Network,
  Wand2,
  BarChart3,
  Filter,
  ExternalLink,
  Tag,
  Clock,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface SearchResult {
  entity_type: string;
  entity_id: string;
  title?: string;
  summary?: string;
  rank: number;
}

interface SearchAnalytics {
  total_searches: number;
  avg_latency_ms: number;
  top_queries: Array<{ query: string; count: number }>;
  searches_by_day: Array<{ date: string; count: number }>;
}

interface KnowledgeEdge {
  id: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  relation: string;
  weight: number;
}

interface GraphStats {
  total_edges: number;
  edges_by_relation: Array<{ relation: string; count: number }>;
  top_connected_entities: Array<{
    entity_type: string;
    entity_id: string;
    connection_count: number;
  }>;
}

// =============================================================================
// Component
// =============================================================================

export default function SearchPage() {
  const { currentOrganization } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'search' | 'analytics' | 'graph'>('search');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [showAIExpand, setShowAIExpand] = useState(false);
  const [aiExpanded, setAiExpanded] = useState<{
    expanded_query: string;
    suggested_filters: Array<{ field: string; value: string }>;
    search_tips: string[];
  } | null>(null);

  // =============================================================================
  // Data Fetching
  // =============================================================================

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/unite/search?action=analytics&limit=1000');
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchGraphStats = async () => {
    try {
      const response = await fetch('/api/unite/knowledge/relations?action=stats');
      const data = await response.json();

      if (response.ok) {
        setGraphStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch graph stats:', err);
    }
  };

  const fetchEdges = async () => {
    try {
      const response = await fetch('/api/unite/knowledge/relations?limit=100');
      const data = await response.json();

      if (response.ok) {
        setEdges(data.edges || []);
      }
    } catch (err) {
      console.error('Failed to fetch edges:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'graph') {
      fetchGraphStats();
      fetchEdges();
    }
  }, [activeTab]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ q: searchQuery });
      if (entityTypeFilter) {
        params.append('entity_types', entityTypeFilter);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/unite/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.results || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAIExpand = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/unite/search?action=expand&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setAiExpanded(data.expanded);
        setShowAIExpand(false);
      }
    } catch (err) {
      console.error('Failed to expand query:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contact: 'bg-blue-500',
      campaign: 'bg-purple-500',
      template: 'bg-green-500',
      experiment: 'bg-orange-500',
      policy: 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Global Search & Knowledge Graph
          </h1>
          <p className="text-text-secondary">
            Search across all entities and explore relationships
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border-primary">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'search'
                ? 'text-accent-500 border-b-2 border-accent-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'analytics'
                ? 'text-accent-500 border-b-2 border-accent-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'graph'
                ? 'text-accent-500 border-b-2 border-accent-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Knowledge Graph
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search across all entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-4 py-3 bg-bg-primary border border-border-primary rounded-lg text-text-primary text-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <select
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  className="px-4 py-3 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">All Types</option>
                  <option value="contact">Contacts</option>
                  <option value="campaign">Campaigns</option>
                  <option value="template">Templates</option>
                  <option value="experiment">Experiments</option>
                  <option value="policy">Policies</option>
                </select>
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="bg-accent-500 text-white px-8"
                >
                  Search
                </Button>
                <Button
                  onClick={() => setShowAIExpand(true)}
                  className="bg-purple-500 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  AI Expand
                </Button>
              </div>

              {aiExpanded && (
                <div className="p-4 bg-purple-500/10 border border-purple-500 rounded-lg">
                  <h3 className="text-purple-400 font-semibold mb-2">AI Expanded Query</h3>
                  <p className="text-text-primary mb-3">{aiExpanded.expanded_query}</p>
                  {aiExpanded.suggested_filters.length > 0 && (
                    <div className="mb-3">
                      <p className="text-text-secondary text-sm mb-2">Suggested Filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiExpanded.suggested_filters.map((filter, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-bg-primary text-text-secondary text-sm rounded"
                          >
                            {filter.field}: {filter.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiExpanded.search_tips.length > 0 && (
                    <div>
                      <p className="text-text-secondary text-sm mb-2">Tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiExpanded.search_tips.map((tip, idx) => (
                          <li key={idx} className="text-text-tertiary text-sm">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Search className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No results found</p>
                <p className="text-text-tertiary text-sm mt-2">
                  Try different keywords or use AI to expand your query
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-text-secondary">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </p>
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-bg-card rounded-lg border border-border-primary hover:border-accent-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${getEntityTypeColor(
                            result.entity_type
                          )}`}
                        />
                        <h3 className="text-lg font-semibold text-text-primary">
                          {result.title || 'Untitled'}
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-1 bg-bg-primary text-text-tertiary rounded">
                        {result.entity_type}
                      </span>
                    </div>
                    {result.summary && (
                      <p className="text-text-secondary text-sm mb-2 line-clamp-2">
                        {result.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>Relevance: {(result.rank * 100).toFixed(1)}%</span>
                      <span className="font-mono">{result.entity_id.substring(0, 8)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analytics ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text-primary">Total Searches</h3>
                      <Search className="w-6 h-6 text-accent-500" />
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                      {analytics.total_searches.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text-primary">Avg Latency</h3>
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                      {analytics.avg_latency_ms}
                      <span className="text-xl text-text-secondary ml-2">ms</span>
                    </p>
                  </div>
                </div>

                {/* Top Queries */}
                <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Top Queries</h3>
                  <div className="space-y-2">
                    {analytics.top_queries.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-primary rounded"
                      >
                        <span className="text-text-primary">{item.query}</span>
                        <span className="text-text-secondary font-mono">
                          {item.count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Searches by Day */}
                <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Searches by Day
                  </h3>
                  <div className="space-y-2">
                    {analytics.searches_by_day.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-primary rounded"
                      >
                        <span className="text-text-primary">{item.date}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-border-primary rounded-full h-2">
                            <div
                              className="bg-accent-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  (item.count / Math.max(...analytics.searches_by_day.map((d) => d.count))) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-text-secondary font-mono w-16 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-text-secondary">Loading analytics...</div>
            )}
          </div>
        )}

        {/* Knowledge Graph Tab */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            {graphStats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text-primary">Total Edges</h3>
                      <Network className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-4xl font-bold text-text-primary">
                      {graphStats.total_edges.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Edges by Relation */}
                <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Relationships by Type
                  </h3>
                  <div className="space-y-2">
                    {graphStats.edges_by_relation.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-primary rounded"
                      >
                        <span className="text-text-primary capitalize">
                          {item.relation.replace(/_/g, ' ')}
                        </span>
                        <span className="text-text-secondary font-mono">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Connected Entities */}
                <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Top Connected Entities
                  </h3>
                  <div className="space-y-2">
                    {graphStats.top_connected_entities.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-bg-primary rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${getEntityTypeColor(
                              item.entity_type
                            )}`}
                          />
                          <span className="text-text-primary">
                            {item.entity_type}{' '}
                            <span className="text-text-tertiary font-mono text-sm">
                              {item.entity_id.substring(0, 8)}...
                            </span>
                          </span>
                        </div>
                        <span className="text-text-secondary">
                          {item.connection_count} connections
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Edges */}
                <div className="bg-bg-card p-6 rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Edges</h3>
                  <div className="space-y-2">
                    {edges.slice(0, 10).map((edge) => (
                      <div
                        key={edge.id}
                        className="p-3 bg-bg-primary rounded flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-text-primary">
                            {edge.from_type}{' '}
                            <span className="text-text-tertiary text-sm">
                              {edge.from_id.substring(0, 8)}
                            </span>
                          </span>
                          <span className="text-accent-500">→</span>
                          <span className="text-text-secondary italic">{edge.relation}</span>
                          <span className="text-accent-500">→</span>
                          <span className="text-text-primary">
                            {edge.to_type}{' '}
                            <span className="text-text-tertiary text-sm">
                              {edge.to_id.substring(0, 8)}
                            </span>
                          </span>
                        </div>
                        <span className="text-text-tertiary text-sm">
                          Weight: {edge.weight.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-text-secondary">
                Loading knowledge graph...
              </div>
            )}
          </div>
        )}

        {/* AI Expand Modal */}
        {showAIExpand && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg border border-border-primary p-6 max-w-xl w-full">
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-500" />
                AI Query Expansion
              </h2>
              <p className="text-text-secondary mb-6">
                Let AI analyze your query and suggest improvements to find better results.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAIExpand(false)}
                  className="flex-1 bg-bg-primary text-text-primary border border-border-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAIExpand}
                  className="flex-1 bg-purple-500 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Expand Query
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
