"use client";

/**
 * Strategy Workspace Component - Phase 11 Week 1-2
 *
 * Visualizes strategy nodes, edges, objectives, and evaluations.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  GitBranch,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  Network,
  FileText,
} from "lucide-react";

interface StrategyNode {
  id: string;
  name: string;
  description: string | null;
  node_type: string;
  domain: string;
  priority: number;
  risk_level: string;
  status: string;
  progress: number;
  estimated_duration_hours: number | null;
  deadline: string | null;
  tags: string[];
}

interface StrategyEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  weight: number;
  is_critical: boolean;
}

interface StrategyProposal {
  id: string;
  title: string;
  description: string;
  objectives: unknown[];
  tactics: unknown[];
  actions: unknown[];
  status: string;
  estimatedImpact: {
    trafficIncrease?: number;
    conversionImprovement?: number;
    revenueImpact?: number;
    confidenceScore?: number;
  };
  timeline: {
    totalWeeks?: number;
  };
  created_at: string;
}

interface StrategyWorkspaceProps {
  organizationId: string;
}

export default function StrategyWorkspace({ organizationId }: StrategyWorkspaceProps) {
  const [nodes, setNodes] = useState<StrategyNode[]>([]);
  const [edges, setEdges] = useState<StrategyEdge[]>([]);
  const [proposals, setProposals] = useState<StrategyProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("graph");
  const [selectedNode, setSelectedNode] = useState<StrategyNode | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNode, setNewNode] = useState({
    name: "",
    description: "",
    node_type: "ACTION",
    domain: "SEO",
    priority: 50,
    risk_level: "MEDIUM_RISK",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch nodes and edges
      const nodesRes = await fetch(
        `/api/strategy/nodes?organization_id=${organizationId}`
      );
      if (nodesRes.ok) {
        const data = await nodesRes.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }

      // Fetch proposals
      const proposalsRes = await fetch(
        `/api/strategy/init?organization_id=${organizationId}`
      );
      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error("Failed to fetch strategy data:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNode = async () => {
    try {
      const res = await fetch("/api/strategy/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_node",
          node: {
            organization_id: organizationId,
            ...newNode,
          },
        }),
      });

      if (res.ok) {
        setShowCreateDialog(false);
        setNewNode({
          name: "",
          description: "",
          node_type: "ACTION",
          domain: "SEO",
          priority: 50,
          risk_level: "MEDIUM_RISK",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create node:", error);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      const res = await fetch("/api/strategy/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_node",
          node_id: nodeId,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete node:", error);
    }
  };

  const handleMaterializeProposal = async (proposalId: string) => {
    try {
      const res = await fetch("/api/strategy/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "materialize_proposal",
          organization_id: organizationId,
          proposal_id: proposalId,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to materialize proposal:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "BLOCKED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      LOW_RISK: "bg-green-100 text-green-800",
      MEDIUM_RISK: "bg-yellow-100 text-yellow-800",
      HIGH_RISK: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[risk] || "bg-gray-100"}>
        {risk.replace("_", " ")}
      </Badge>
    );
  };

  const getNodeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      OBJECTIVE: "bg-purple-100 text-purple-800",
      TACTIC: "bg-blue-100 text-blue-800",
      ACTION: "bg-green-100 text-green-800",
      METRIC: "bg-orange-100 text-orange-800",
      MILESTONE: "bg-pink-100 text-pink-800",
      CONSTRAINT: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>;
  };

  // Group nodes by type for visualization
  const nodesByType = nodes.reduce((acc, node) => {
    const type = node.node_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(node);
    return acc;
  }, {} as Record<string, StrategyNode[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategy Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Manage your strategy graph, proposals, and objectives
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Strategy Node</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newNode.name}
                    onChange={(e) =>
                      setNewNode({ ...newNode, name: e.target.value })
                    }
                    placeholder="Node name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newNode.description}
                    onChange={(e) =>
                      setNewNode({ ...newNode, description: e.target.value })
                    }
                    placeholder="Description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newNode.node_type}
                      onValueChange={(v) =>
                        setNewNode({ ...newNode, node_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OBJECTIVE">Objective</SelectItem>
                        <SelectItem value="TACTIC">Tactic</SelectItem>
                        <SelectItem value="ACTION">Action</SelectItem>
                        <SelectItem value="METRIC">Metric</SelectItem>
                        <SelectItem value="MILESTONE">Milestone</SelectItem>
                        <SelectItem value="CONSTRAINT">Constraint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <Select
                      value={newNode.domain}
                      onValueChange={(v) =>
                        setNewNode({ ...newNode, domain: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEO">SEO</SelectItem>
                        <SelectItem value="GEO">GEO</SelectItem>
                        <SelectItem value="CONTENT">Content</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="BACKLINK">Backlink</SelectItem>
                        <SelectItem value="LOCAL">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority (0-100)</Label>
                    <Input
                      type="number"
                      value={newNode.priority}
                      onChange={(e) =>
                        setNewNode({
                          ...newNode,
                          priority: parseInt(e.target.value) || 50,
                        })
                      }
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label>Risk Level</Label>
                    <Select
                      value={newNode.risk_level}
                      onValueChange={(v) =>
                        setNewNode({ ...newNode, risk_level: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW_RISK">Low Risk</SelectItem>
                        <SelectItem value="MEDIUM_RISK">Medium Risk</SelectItem>
                        <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateNode} className="w-full">
                  Create Node
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="graph">
            <Network className="h-4 w-4 mr-2" />
            Graph
          </TabsTrigger>
          <TabsTrigger value="proposals">
            <FileText className="h-4 w-4 mr-2" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="objectives">
            <Target className="h-4 w-4 mr-2" />
            Objectives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{nodes.length}</div>
                <p className="text-sm text-muted-foreground">Total Nodes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{edges.length}</div>
                <p className="text-sm text-muted-foreground">Connections</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {nodes.filter((n) => n.status === "COMPLETED").length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {nodes.filter((n) => n.status === "IN_PROGRESS").length}
                </div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Nodes by type */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(nodesByType).map(([type, typeNodes]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getNodeTypeBadge(type)}
                    <span className="text-sm text-muted-foreground">
                      ({typeNodes.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {typeNodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                          onClick={() => setSelectedNode(node)}
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(node.status)}
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {node.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRiskBadge(node.risk_level)}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected node details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedNode.name}
                  {getNodeTypeBadge(selectedNode.node_type)}
                </CardTitle>
                <CardDescription>{selectedNode.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedNode.status)}
                      {selectedNode.status}
                    </div>
                  </div>
                  <div>
                    <Label>Progress</Label>
                    <Progress value={selectedNode.progress} className="mt-2" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div className="text-lg font-bold">{selectedNode.priority}</div>
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <div>{selectedNode.domain}</div>
                  </div>
                  <div>
                    <Label>Risk Level</Label>
                    <div className="mt-1">{getRiskBadge(selectedNode.risk_level)}</div>
                  </div>
                  <div>
                    <Label>Est. Hours</Label>
                    <div>{selectedNode.estimated_duration_hours || "N/A"}</div>
                  </div>
                </div>
                {selectedNode.tags.length > 0 && (
                  <div className="mt-4">
                    <Label>Tags</Label>
                    <div className="flex gap-1 mt-1">
                      {selectedNode.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No proposals yet. Generate proposals from audit signals.
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{proposal.title}</CardTitle>
                      <CardDescription>{proposal.description}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        proposal.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {proposal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label>Objectives</Label>
                      <div className="text-lg font-bold">
                        {proposal.objectives.length}
                      </div>
                    </div>
                    <div>
                      <Label>Tactics</Label>
                      <div className="text-lg font-bold">
                        {proposal.tactics.length}
                      </div>
                    </div>
                    <div>
                      <Label>Actions</Label>
                      <div className="text-lg font-bold">
                        {proposal.actions.length}
                      </div>
                    </div>
                    <div>
                      <Label>Timeline</Label>
                      <div className="text-lg font-bold">
                        {proposal.timeline.totalWeeks || 0} weeks
                      </div>
                    </div>
                  </div>

                  {proposal.estimatedImpact && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label>Traffic</Label>
                        <div className="text-green-600 font-medium">
                          +{proposal.estimatedImpact.trafficIncrease || 0}%
                        </div>
                      </div>
                      <div>
                        <Label>Conversion</Label>
                        <div className="text-green-600 font-medium">
                          +{proposal.estimatedImpact.conversionImprovement || 0}%
                        </div>
                      </div>
                      <div>
                        <Label>Revenue Impact</Label>
                        <div className="text-green-600 font-medium">
                          ${proposal.estimatedImpact.revenueImpact || 0}
                        </div>
                      </div>
                      <div>
                        <Label>Confidence</Label>
                        <div className="font-medium">
                          {proposal.estimatedImpact.confidenceScore || 0}%
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {proposal.status === "DRAFT" && (
                      <Button
                        onClick={() => handleMaterializeProposal(proposal.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Materialize
                      </Button>
                    )}
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4">
          {nodesByType["OBJECTIVE"]?.length ? (
            nodesByType["OBJECTIVE"].map((objective) => (
              <Card key={objective.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {objective.name}
                      </CardTitle>
                      <CardDescription>{objective.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(objective.status)}
                      {getRiskBadge(objective.risk_level)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{objective.progress}%</span>
                      </div>
                      <Progress value={objective.progress} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Domain</Label>
                        <div>{objective.domain}</div>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <div>{objective.priority}</div>
                      </div>
                      <div>
                        <Label>Deadline</Label>
                        <div>
                          {objective.deadline
                            ? new Date(objective.deadline).toLocaleDateString()
                            : "None"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No objectives yet. Create objectives manually or materialize a
                proposal.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
