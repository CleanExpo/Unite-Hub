'use client';

/**
 * MemoryExplorerPanel
 * Interactive memory search and exploration interface
 *
 * Allows users to search memories, filter by type/importance/confidence,
 * view rankings, and navigate through memory relationships.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, Loader2, AlertTriangle, Brain } from 'lucide-react';

interface MemoryResult {
  id: string;
  memoryType: string;
  content: Record<string, any>;
  importance: number;
  confidence: number;
  rank: number;
  relevanceScore: number;
}

interface MemoryExplorerPanelProps {
  workspaceId: string;
  accessToken: string;
}

const getMemoryTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    lesson: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200',
    pattern: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
    decision: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
    outcome: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200',
    uncertainty: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
    signal: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200',
    reasoning_trace: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200',
  };
  return colors[type] || 'bg-bg-raised text-text-primary';
};

export function MemoryExplorerPanel({
  workspaceId,
  accessToken,
}: MemoryExplorerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string | null>(null);
  const [minImportance, setMinImportance] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryResult | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/memory/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          query: searchQuery,
          memoryTypes: memoryTypeFilter ? [memoryTypeFilter] : undefined,
          minImportance,
          minConfidence,
          limit: 20,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search memories');
      }

      const data = await response.json();
      setResults(data.memories || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Memory Explorer
          </CardTitle>
          <CardDescription>
            Search and explore memories across all agents and systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Search Query
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., 'engagement strategies', 'user preferences'..."
                className="flex-1 px-3 py-2 border border-border-base rounded-md bg-bg-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Memory Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Memory Type
              </label>
              <select
                value={memoryTypeFilter || ''}
                onChange={(e) => setMemoryTypeFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-border-base rounded-md bg-bg-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="lesson">Lesson</option>
                <option value="pattern">Pattern</option>
                <option value="decision">Decision</option>
                <option value="outcome">Outcome</option>
                <option value="reasoning_trace">Reasoning Trace</option>
                <option value="uncertainty">Uncertainty</option>
                <option value="signal">Signal</option>
              </select>
            </div>

            {/* Min Importance */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Min Importance: {minImportance}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minImportance}
                onChange={(e) => setMinImportance(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Min Confidence: {minConfidence}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Results ({results.length} of {totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((memory) => (
              <div
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className="border border-border-subtle rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">#{memory.rank}</span>
                      <Badge className={getMemoryTypeColor(memory.memoryType)}>
                        {memory.memoryType}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {memory.content.description || memory.content.summary || 'No description'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {memory.relevanceScore.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">relevance</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  <span>Importance: {memory.importance}</span>
                  <span>Confidence: {memory.confidence}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Memory Details */}
      {selectedMemory && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className={getMemoryTypeColor(selectedMemory.memoryType)}>
                  {selectedMemory.memoryType}
                </Badge>
                Details
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMemory(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Content
              </p>
              <pre className="text-xs bg-bg-raised p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(selectedMemory.content, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-text-secondary">Relevance Score</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedMemory.relevanceScore.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Importance</p>
                <p className="text-lg font-bold text-amber-600">
                  {selectedMemory.importance}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Confidence</p>
                <p className="text-lg font-bold text-green-600">
                  {selectedMemory.confidence}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Rank</p>
                <p className="text-lg font-bold text-purple-600">
                  #{selectedMemory.rank}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && searchQuery && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              No memories found matching your search. Try different keywords or adjust filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
