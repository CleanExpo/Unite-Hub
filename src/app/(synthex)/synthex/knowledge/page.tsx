'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Network,
  Plus,
  Search,
  Sparkles,
  RefreshCw,
  Loader2,
  Tag,
  FileText,
  Users,
  Globe,
  Link2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

interface KGNode {
  node_id: string;
  node_type: string;
  label: string;
  importance_score: number;
  properties: Record<string, unknown>;
  created_at: string;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  avgImportance: number;
}

interface TopicMapCluster {
  name: string;
  nodes: string[];
  importance: number;
}

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  keyword: <Tag className="h-4 w-4" />,
  topic: <Target className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  audience: <Users className="h-4 w-4" />,
  competitor: <TrendingUp className="h-4 w-4" />,
  url: <Globe className="h-4 w-4" />,
  entity: <Link2 className="h-4 w-4" />,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  keyword: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  topic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  content: 'bg-green-500/20 text-green-400 border-green-500/30',
  audience: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  competitor: 'bg-red-500/20 text-red-400 border-red-500/30',
  url: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  entity: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  concept: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  brand: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

export default function KnowledgeGraphPage() {
  const { tenantId, isLoading: tenantLoading } = useSynthexTenant();
  const [nodes, setNodes] = useState<KGNode[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [clusters, setClusters] = useState<TopicMapCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState('keyword');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Fetch nodes and stats in parallel
      const [nodesRes, statsRes] = await Promise.all([
        fetch(`/api/synthex/knowledge/nodes?tenantId=${tenantId}&limit=200`),
        fetch(`/api/synthex/knowledge/search?tenantId=${tenantId}`),
      ]);

      if (nodesRes.ok) {
        const nodesData = await nodesRes.json();
        setNodes(nodesData.nodes || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || null);
      }
    } catch (error) {
      console.error('Error fetching knowledge graph:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNode = async () => {
    if (!tenantId || !newNodeLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/synthex/knowledge/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          node_type: newNodeType,
          label: newNodeLabel.trim(),
          importance_score: 0.5,
        }),
      });

      if (res.ok) {
        setNewNodeLabel('');
        fetchData();
      }
    } catch (error) {
      console.error('Error creating node:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSuggestClusters = async () => {
    if (!tenantId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/synthex/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'suggest_clusters',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClusters(data.clusters || []);
      }
    } catch (error) {
      console.error('Error generating clusters:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || node.node_type === selectedType;
    return matchesSearch && matchesType;
  });

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Network className="h-7 w-7 text-accent-500" />
            Knowledge Graph
          </h1>
          <p className="text-text-secondary mt-1">
            Semantic connections between keywords, content, campaigns, and audiences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSuggestClusters} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Clusters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Network className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Nodes</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.totalNodes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Link2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Connections</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.totalEdges || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Tag className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Keywords</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats?.nodesByType?.keyword || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border-border-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Avg Importance</p>
                <p className="text-2xl font-bold text-text-primary">
                  {((stats?.avgImportance || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList className="bg-bg-surface">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="clusters">AI Clusters</TabsTrigger>
          <TabsTrigger value="add">Add Node</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          {/* Filters */}
          <Card className="bg-bg-card border-border-default">
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-bg-surface border-border-default"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px] bg-bg-surface border-border-default">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="keyword">Keywords</SelectItem>
                    <SelectItem value="topic">Topics</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="audience">Audiences</SelectItem>
                    <SelectItem value="competitor">Competitors</SelectItem>
                    <SelectItem value="url">URLs</SelectItem>
                    <SelectItem value="entity">Entities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.length === 0 ? (
              <Card className="col-span-full bg-bg-card border-border-default">
                <CardContent className="py-12 text-center">
                  <Network className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No nodes found. Add your first node to get started.</p>
                </CardContent>
              </Card>
            ) : (
              filteredNodes.map((node) => (
                <Card key={node.node_id} className="bg-bg-card border-border-default hover:border-accent-500/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${NODE_TYPE_COLORS[node.node_type] || 'bg-gray-500/20'}`}>
                          {NODE_TYPE_ICONS[node.node_type] || <Network className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{node.label}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {node.node_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">Importance</p>
                        <p className="font-medium text-accent-500">
                          {(node.importance_score * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-500" />
                AI-Suggested Topic Clusters
              </CardTitle>
              <CardDescription>
                Claude analyzes your knowledge graph to identify semantic clusters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clusters.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary mb-4">
                    Click &quot;AI Clusters&quot; to generate topic clusters from your nodes
                  </p>
                  <Button onClick={handleSuggestClusters} disabled={generating}>
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Clusters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clusters.map((cluster, idx) => (
                    <Card key={idx} className="bg-bg-surface border-border-default">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-text-primary">{cluster.name}</h4>
                          <Badge variant="outline">
                            {(cluster.importance * 100).toFixed(0)}% important
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cluster.nodes.slice(0, 5).map((node, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {node}
                            </Badge>
                          ))}
                          {cluster.nodes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{cluster.nodes.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card className="bg-bg-card border-border-default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent-500" />
                Add New Node
              </CardTitle>
              <CardDescription>
                Manually add entities to your knowledge graph
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Node Label</label>
                  <Input
                    placeholder="e.g., digital marketing, SEO strategy..."
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    className="bg-bg-surface border-border-default"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Node Type</label>
                  <Select value={newNodeType} onValueChange={setNewNodeType}>
                    <SelectTrigger className="bg-bg-surface border-border-default">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="topic">Topic</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="audience">Audience</SelectItem>
                      <SelectItem value="competitor">Competitor</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreateNode}
                disabled={creating || !newNodeLabel.trim()}
                className="w-full md:w-auto"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Node
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
