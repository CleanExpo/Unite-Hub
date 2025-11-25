'use client';

/**
 * Search Console Detail View
 * Detailed table and charts for Search Console data (Google + Bing)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

    // Filter by search term
    if (searchTerm) {
      queries = queries.filter((q: any) =>
        q.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
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
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <span className="text-muted-foreground">Loading Search Console data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Impressions</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {data.data.totalImpressions?.toLocaleString() || 0}
              </span>
              {data.data.google && data.data.bing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Google: {data.data.google.totalImpressions?.toLocaleString() || 0} • Bing:{' '}
                  {data.data.bing.totalImpressions?.toLocaleString() || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {data.data.totalClicks?.toLocaleString() || 0}
              </span>
              {data.data.google && data.data.bing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Google: {data.data.google.totalClicks?.toLocaleString() || 0} • Bing:{' '}
                  {data.data.bing.totalClicks?.toLocaleString() || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Queries</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{data.data.queries?.length || 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Date Range</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {data.dateStart} to {data.dateEnd}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Query Analysis</CardTitle>
          <CardDescription>Search and analyze your search queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={source} onValueChange={(value: any) => setSource(value)}>
              <SelectTrigger className="w-[200px]">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Query</TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('impressions')}
                      className="h-8 px-2"
                    >
                      Impressions
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('clicks')}
                      className="h-8 px-2"
                    >
                      Clicks
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('ctr')}
                      className="h-8 px-2"
                    >
                      CTR
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('position')}
                      className="h-8 px-2"
                    >
                      Position
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No queries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueries.slice(0, 50).map((query: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {query.query}
                        {query.source && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {query.source}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{query.impressions.toLocaleString()}</TableCell>
                      <TableCell>{query.clicks}</TableCell>
                      <TableCell>
                        <span className={query.ctr >= 0.05 ? 'text-green-600' : ''}>
                          {(query.ctr * 100).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {query.position.toFixed(1)}
                          {query.position <= 3 ? (
                            <TrendingUp className="ml-1 h-3 w-3 text-green-500" />
                          ) : query.position > 10 ? (
                            <TrendingDown className="ml-1 h-3 w-3 text-orange-500" />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredQueries.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing top 50 of {filteredQueries.length} queries
            </p>
          )}
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      {data.improvementOpportunities && data.improvementOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Improvement Opportunities</CardTitle>
            <CardDescription>
              High-impression queries ranking in positions 4-10 (page 1 bottom)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.improvementOpportunities.map((query: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{query.query}</p>
                    <p className="text-sm text-muted-foreground">
                      Position {query.position.toFixed(1)} • {query.impressions.toLocaleString()}{' '}
                      impressions
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{query.clicks} clicks</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      CTR: {(query.ctr * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
