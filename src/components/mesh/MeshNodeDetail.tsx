'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Network,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import type { IntelligenceNode, IntelligenceEdge } from '@/lib/intelligenceMesh';

interface MeshNodeDetailProps {
  node: IntelligenceNode;
  edges: {
    outgoing: Array<{
      id: string;
      toNodeId: string;
      relationship: string;
      strength: number;
      confidence: number;
    }>;
    incoming: Array<{
      id: string;
      fromNodeId: string;
      relationship: string;
      strength: number;
      confidence: number;
    }>;
  };
  onSelectNode?: (nodeId: string) => void;
}

export function MeshNodeDetail({ node, edges, onSelectNode }: MeshNodeDetailProps) {
  return (
    <div className="space-y-4">
      {/* Node Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {node.label || `Node ${node.id.slice(0, 8)}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <Badge variant="outline">{node.nodeType}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                {new Date(node.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Weight</span>
              <span>{node.weight.toFixed(2)}</span>
            </div>
            <Progress value={node.weight * 100} className="h-2" />
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Confidence</span>
              <span>{(node.confidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={node.confidence * 100} className="h-2" />
          </div>

          {/* Tags */}
          {node.tags.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {node.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {node.sourceTable && (
            <div>
              <div className="text-sm text-muted-foreground">Source</div>
              <div className="text-sm font-mono">
                {node.sourceTable}:{node.sourceId?.slice(0, 8)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outgoing Edges */}
      {edges.outgoing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Outgoing Connections ({edges.outgoing.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {edges.outgoing.map((edge) => (
                <div
                  key={edge.id}
                  className="flex items-center justify-between p-2 rounded bg-muted cursor-pointer hover:bg-accent"
                  onClick={() => onSelectNode?.(edge.toNodeId)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {edge.relationship}
                    </Badge>
                    <span className="text-xs font-mono">
                      {edge.toNodeId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(edge.strength * 100).toFixed(0)}% strength
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incoming Edges */}
      {edges.incoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Incoming Connections ({edges.incoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {edges.incoming.map((edge) => (
                <div
                  key={edge.id}
                  className="flex items-center justify-between p-2 rounded bg-muted cursor-pointer hover:bg-accent"
                  onClick={() => onSelectNode?.(edge.fromNodeId)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {edge.relationship}
                    </Badge>
                    <span className="text-xs font-mono">
                      {edge.fromNodeId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(edge.strength * 100).toFixed(0)}% strength
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {edges.outgoing.length === 0 && edges.incoming.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No connections to this node
          </CardContent>
        </Card>
      )}
    </div>
  );
}
