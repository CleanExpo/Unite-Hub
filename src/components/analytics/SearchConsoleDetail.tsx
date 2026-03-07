'use client';

/**
 * Search Console Detail View
 * Detailed table and charts for Search Console data (Google + Bing)
 */

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface SearchConsoleDetailProps {
  workspaceId: string;
  brandSlug?: string;
}

export function SearchConsoleDetail({ workspaceId, brandSlug }: SearchConsoleDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [source, setSource] = useState<'all' | 'google_search_console' | 'bing_webmaster_tools'>('all');
  const [sortBy, setSortBy] = useState<'impressions' | 'clicks' | 'ctr' | 'position'>('impressions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ workspaceId, source });
      if (brandSlug) params.append('brandSlug', brandSlug);

      const response = await fetch(`/api/analytics/search-console?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Search Console data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, brandSlug, source]);

  const filteredQueries = React.useMemo(() => {
    if (!data?.data?.queries) return [];

    let queries = [...data.data.queries];

    if (searchTerm) {
      queries = queries.filter((q: any) =>
        q.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    queries.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return queries;
  }, [data, searchTerm, sortBy, sortOrder]);

  const toggleSort = (column: 'impressions' | 'clicks' | 'ctr' | 'position') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12">
        <div className="flex items-center justify-center">
          <span className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading Search Console data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12">
        <div className="text-center">
          <p className="text-[#FF4444] font-mono text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Total Impressions</p>
            <span className="text-2xl font-bold font-mono text-white/90">
              {data.data.totalImpressions?.toLocaleString() || 0}
            </span>
            {data.data.google && data.data.bing && (
              <p className="text-xs text-white/20 font-mono mt-1">
                Google: {data.data.google.totalImpressions?.toLocaleString() || 0} · Bing:{' '}
                {data.data.bing.totalImpressions?.toLocaleString() || 0}
              </p>
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Total Clicks</p>
            <span className="text-2xl font-bold font-mono text-white/90">
              {data.data.totalClicks?.toLocaleString() || 0}
            </span>
            {data.data.google && data.data.bing && (
              <p className="text-xs text-white/20 font-mono mt-1">
                Google: {data.data.google.totalClicks?.toLocaleString() || 0} · Bing:{' '}
                {data.data.bing.totalClicks?.toLocaleString() || 0}
              </p>
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Unique Queries</p>
            <span className="text-2xl font-bold font-mono text-white/90">{data.data.queries?.length || 0}</span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Date Range</p>
            <p className="text-sm font-mono text-white/90">
              {data.dateStart} to {data.dateEnd}
            </p>
          </div>
        </div>
      )}

      {/* Filters + Query Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-mono font-bold text-white/90 mb-1">Query Analysis</h3>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Search and analyse your search queries</p>
        </div>
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-sm pl-10 pr-3 py-2 text-sm font-mono text-white/90 placeholder-white/20 focus:outline-none focus:border-[#00F5FF]/40"
              />
            </div>
            <Select value={source} onValueChange={(value: any) => setSource(value)}>
              <SelectTrigger className="w-[200px] bg-white/[0.03] border-white/[0.06] rounded-sm font-mono text-sm text-white/90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="google_search_console">Google Only</SelectItem>
                <SelectItem value="bing_webmaster_tools">Bing Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queries Table */}
          <div className="border border-white/[0.06] rounded-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="w-[40%] text-left p-3 text-[10px] font-mono uppercase tracking-widest text-white/20">Query</th>
                  <th className="w-[15%] text-left p-3">
                    <button
                      onClick={() => toggleSort('impressions')}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/60"
                    >
                      Impressions
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[15%] text-left p-3">
                    <button
                      onClick={() => toggleSort('clicks')}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/60"
                    >
                      Clicks
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[15%] text-left p-3">
                    <button
                      onClick={() => toggleSort('ctr')}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/60"
                    >
                      CTR
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="w-[15%] text-left p-3">
                    <button
                      onClick={() => toggleSort('position')}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/60"
                    >
                      Position
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/20 font-mono text-xs">
                      No queries found
                    </td>
                  </tr>
                ) : (
                  filteredQueries.slice(0, 50).map((query: any, index: number) => (
                    <tr key={index} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-sm text-white/90">
                        {query.query}
                        {query.source && (
                          <span className="ml-2 px-1.5 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/30">
                            {query.source}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-sm text-white/70">{query.impressions.toLocaleString()}</td>
                      <td className="p-3 font-mono text-sm text-white/70">{query.clicks}</td>
                      <td className="p-3">
                        <span className={`font-mono text-sm ${query.ctr >= 0.05 ? 'text-[#00FF88]' : 'text-white/70'}`}>
                          {(query.ctr * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center font-mono text-sm text-white/70">
                          {query.position.toFixed(1)}
                          {query.position <= 3 ? (
                            <TrendingUp className="ml-1 h-3 w-3 text-[#00FF88]" />
                          ) : query.position > 10 ? (
                            <TrendingDown className="ml-1 h-3 w-3 text-[#FFB800]" />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredQueries.length > 50 && (
            <p className="text-xs font-mono text-white/20 mt-4 text-center">
              Showing top 50 of {filteredQueries.length} queries
            </p>
          )}
        </div>
      </div>

      {/* Improvement Opportunities */}
      {data.improvementOpportunities && data.improvementOpportunities.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90 mb-1">Improvement Opportunities</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              High-impression queries ranking in positions 4–10 (page 1 bottom)
            </p>
          </div>
          <div className="p-4 space-y-3">
            {data.improvementOpportunities.map((query: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-white/[0.06] rounded-sm"
              >
                <div>
                  <p className="font-mono text-sm text-white/90">{query.query}</p>
                  <p className="text-xs font-mono text-white/30 mt-1">
                    Position {query.position.toFixed(1)} · {query.impressions.toLocaleString()} impressions
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60">
                    {query.clicks} clicks
                  </span>
                  <p className="text-[10px] font-mono text-white/20 mt-1">
                    CTR: {(query.ctr * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
