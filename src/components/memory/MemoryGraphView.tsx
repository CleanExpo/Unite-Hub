'use client';

/**
 * MemoryGraphView
 * Interactive relationship graph visualization component
 *
 * Displays memory relationships as a graph with depth-based layout,
 * allows navigation through relationships, and shows connection metadata.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, Loader2, AlertTriangle } from 'lucide-react';

interface RelatedMemory {
  id: string;
  memoryType: string;
  content: Record<string, any>;
  relationshipType: string;
  relationshipStrength: number;
  relevanceScore: number;
}

interface MemoryGraphViewProps {
  workspaceId: string;
  memoryId: string;
  accessToken: string;
}

const getRelationshipColor = (type: string) => {
  const colors: { [key: string]: string } = {
    caused_by: 'text-red-600 dark:text-red-400',
    led_to: 'text-green-600 dark:text-green-400',
    validates: 'text-blue-600 dark:text-blue-400',
    invalidates: 'text-red-600 dark:text-red-400',
    extends: 'text-amber-600 dark:text-amber-400',
    refines: 'text-purple-600 dark:text-purple-400',
    depends_on: 'text-indigo-600 dark:text-indigo-400',
    supports: 'text-green-600 dark:text-green-400',
    similar_to: 'text-cyan-600 dark:text-cyan-400',
    part_of: 'text-violet-600 dark:text-violet-400',
    contradicts: 'text-orange-600 dark:text-orange-400',
  };
  return colors[type] || 'text-text-secondary';
};

export function MemoryGraphView({
  workspaceId,
  memoryId,
  accessToken,
}: MemoryGraphViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ [depth: number]: RelatedMemory[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<RelatedMemory | null>(null);
  const [maxDepth, setMaxDepth] = useState(2);

  const handleLoadGraph = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/memory/related?workspaceId=${workspaceId}&memoryId=${memoryId}&maxDepth=${maxDepth}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load relationship graph');
      }

      const data = await response.json();
      setGraphData(data.relatedMemories || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="w-5 h-5 mr-2" />
            Memory Relationship Graph
          </CardTitle>
          <CardDescription>
            Explore how memories connect and influence each other
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Traversal Depth: {maxDepth}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-text-secondary mt-1">
                How many relationship levels to explore
              </p>
            </div>
          </div>

          <Button
            onClick={handleLoadGraph}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Graph...
              </>
            ) : (
              'Load Relationship Graph'
            )}
          </Button>

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

      {/* Graph Display */}
      {graphData && Object.keys(graphData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Connected Memories (
              {Object.values(graphData).reduce((sum, arr) => sum + arr.length, 0)} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(graphData)
              .sort(([depthA], [depthB]) => parseInt(depthA) - parseInt(depthB))
              .map(([depth, memories]) => (
                <div key={depth}>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                    Level {depth} Connections ({memories.length})
                  </h4>

                  <div className="space-y-2 pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                    {memories.map((memory) => (
                      <div
                        key={memory.id}
                        onClick={() => setSelectedRelationship(memory)}
                        className="p-3 border border-border-subtle rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className={`text-sm font-semibold ${getRelationshipColor(memory.relationshipType)}`}>
                              {memory.relationshipType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-text-secondary">
                              Strength: {memory.relationshipStrength}%
                            </p>
                          </div>
                          <Badge variant="outline">
                            {memory.memoryType}
                          </Badge>
                        </div>

                        <p className="text-sm text-text-secondary truncate">
                          {memory.content.description || 'No description'}
                        </p>

                        <div className="mt-2 flex justify-between">
                          <span className="text-xs text-text-secondary">
                            Relevance: {memory.relevanceScore.toFixed(0)}/100
                          </span>
                          <span className="text-xs text-text-secondary">
                            ID: {memory.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Relationship Details */}
      {selectedRelationship && (
        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <span className={getRelationshipColor(selectedRelationship.relationshipType)}>
                  {selectedRelationship.relationshipType.replace(/_/g, ' ').toUpperCase()}
                </span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRelationship(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-text-secondary">Relationship Strength</p>
                <p className="text-lg font-bold text-purple-600">
                  {selectedRelationship.relationshipStrength}%
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Memory Type</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedRelationship.memoryType}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Relevance Score</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedRelationship.relevanceScore.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Memory ID</p>
                <p className="text-xs font-mono text-text-secondary">
                  {selectedRelationship.id.substring(0, 12)}...
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Content
              </p>
              <pre className="text-xs bg-bg-raised p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(selectedRelationship.content, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && graphData && Object.keys(graphData).length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              No related memories found for this memory at depth {maxDepth}. Try increasing the depth.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
