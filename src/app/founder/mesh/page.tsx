'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network,
  Activity,
  AlertTriangle,
  TrendingUp,
  Zap,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { MeshInsightPanel } from '@/components/mesh/MeshInsightPanel';
import { MeshNodeDetail } from '@/components/mesh/MeshNodeDetail';
import { supabase } from '@/lib/supabase';
import type { IntelligenceNode, MeshInsight } from '@/lib/intelligenceMesh';

interface MeshOverview {
  totalNodes: number;
  totalEdges: number;
  avgConfidence: number;
  avgWeight: number;
  nodesByType: Record<string, number>;
  edgesByRelationship: Record<string, number>;
}

interface MeshHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  metrics: {
    coverage: number;
    connectivity: number;
    confidence: number;
    freshness: number;
  };
}

export default function MeshDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<MeshOverview | null>(null);
  const [health, setHealth] = useState<MeshHealth | null>(null);
  const [topNodes, setTopNodes] = useState<IntelligenceNode[]>([]);
  const [insights, setInsights] = useState<MeshInsight[]>([]);
  const [insightSummary, setInsightSummary] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<IntelligenceNode | null>(null);
  const [selectedNodeEdges, setSelectedNodeEdges] = useState<{
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
  }>({ outgoing: [], incoming: [] });

  const fetchMeshData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/mesh/overview?includeInsights=true&includeTopNodes=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setHealth(data.health);
        setTopNodes(data.topNodes || []);
        setInsights(data.insights || []);
        setInsightSummary(data.insightSummary || '');
      }
    } catch (error) {
      console.error('Failed to fetch mesh data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNodeDetails = async (nodeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch(`/api/mesh/node/${nodeId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedNode(data.node);

        // Transform edges for component
        const outgoing = data.edges
          .filter((e: { fromNodeId: string }) => e.fromNodeId === nodeId)
          .map((e: { id: string; toNodeId: string; relationship: string; strength: number; confidence: number }) => ({
            id: e.id,
            toNodeId: e.toNodeId,
            relationship: e.relationship,
            strength: e.strength,
            confidence: e.confidence,
          }));

        const incoming = data.edges
          .filter((e: { toNodeId: string }) => e.toNodeId === nodeId)
          .map((e: { id: string; fromNodeId: string; relationship: string; strength: number; confidence: number }) => ({
            id: e.id,
            fromNodeId: e.fromNodeId,
            relationship: e.relationship,
            strength: e.strength,
            confidence: e.confidence,
          }));

        setSelectedNodeEdges({ outgoing, incoming });
      }
    } catch (error) {
      console.error('Failed to fetch node details:', error);
    }
  };

  useEffect(() => {
    fetchMeshData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMeshData();
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            Global Intelligence Mesh
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified intelligence fabric across all engines
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health & Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mesh Health</CardTitle>
          </CardHeader>
          <CardContent>
            {health && (
              <Badge className={getHealthColor(health.overall)}>
                {health.overall.toUpperCase()}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalNodes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Edges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalEdges || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((overview?.avgConfidence || 0) * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Mesh Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Coverage</span>
                  <span>{(health.metrics.coverage * 100).toFixed(0)}%</span>
                </div>
                <Progress value={health.metrics.coverage * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Connectivity</span>
                  <span>{(health.metrics.connectivity * 100).toFixed(0)}%</span>
                </div>
                <Progress value={health.metrics.connectivity * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{(health.metrics.confidence * 100).toFixed(0)}%</span>
                </div>
                <Progress value={health.metrics.confidence * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Freshness</span>
                  <span>{(health.metrics.freshness * 100).toFixed(0)}%</span>
                </div>
                <Progress value={health.metrics.freshness * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="nodes" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Top Nodes
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <MeshInsightPanel insights={insights} summary={insightSummary} />
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Node List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Weighted Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                {topNodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No nodes available</p>
                ) : (
                  <div className="space-y-2">
                    {topNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-2 rounded bg-muted cursor-pointer hover:bg-accent"
                        onClick={() => fetchNodeDetails(node.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {node.nodeType}
                          </Badge>
                          <span className="text-sm">
                            {node.label || `Node ${node.id.slice(0, 8)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {node.weight.toFixed(2)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Node Detail */}
            {selectedNode ? (
              <MeshNodeDetail
                node={selectedNode}
                edges={selectedNodeEdges}
                onSelectNode={fetchNodeDetails}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a node to view details
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nodes by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nodes by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {overview && Object.keys(overview.nodesByType).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(overview.nodesByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <Badge variant="outline">{type}</Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No node data available</p>
                )}
              </CardContent>
            </Card>

            {/* Edges by Relationship */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edges by Relationship</CardTitle>
              </CardHeader>
              <CardContent>
                {overview && Object.keys(overview.edgesByRelationship).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(overview.edgesByRelationship)
                      .sort(([, a], [, b]) => b - a)
                      .map(([rel, count]) => (
                        <div key={rel} className="flex items-center justify-between">
                          <Badge variant="secondary">{rel}</Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No edge data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
