"use client";

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Button } from '@/components/ui/button';
import { Maximize2, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Node type imports (will be created next)
import ProjectRootNode from './nodes/ProjectRootNode';
import FeatureNode from './nodes/FeatureNode';
import TaskNode from './nodes/TaskNode';
import MilestoneNode from './nodes/MilestoneNode';
import RequirementNode from './nodes/RequirementNode';
import IdeaNode from './nodes/IdeaNode';
import QuestionNode from './nodes/QuestionNode';
import NoteNode from './nodes/NoteNode';

// Custom edge import (will be created next)
import CustomEdge from './edges/CustomEdge';

interface MindmapCanvasProps {
  projectId: string;
  workspaceId: string;
  mindmapId?: string;
  onNodeAdd?: (node: Node) => void;
  onNodeUpdate?: (node: Node) => void;
  onConnectionAdd?: (connection: Edge) => void;
}

// Define custom node types
const nodeTypes = {
  project_root: ProjectRootNode,
  feature: FeatureNode,
  task: TaskNode,
  milestone: MilestoneNode,
  requirement: RequirementNode,
  idea: IdeaNode,
  question: QuestionNode,
  note: NoteNode,
};

// Define custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Dagre layout configuration
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 75,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function MindmapCanvas({
  projectId,
  workspaceId,
  mindmapId,
  onNodeAdd,
  onNodeUpdate,
  onConnectionAdd,
}: MindmapCanvasProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load mindmap data from API
  useEffect(() => {
    const loadMindmap = async () => {
      if (!mindmapId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/mindmap/${mindmapId}?workspaceId=${workspaceId}`);

        if (!response.ok) {
          throw new Error('Failed to load mindmap');
        }

        const data = await response.json();

        // Convert API data to React Flow format
        const flowNodes: Node[] = data.nodes.map((node: any) => ({
          id: node.id,
          type: node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            label: node.label,
            description: node.description,
            status: node.status,
            priority: node.priority,
            color: node.color,
            icon: node.icon,
            metadata: node.metadata,
          },
        }));

        const flowEdges: Edge[] = data.connections.map((conn: any) => ({
          id: conn.id,
          source: conn.source_node_id,
          target: conn.target_node_id,
          type: 'custom',
          data: {
            connectionType: conn.connection_type,
            label: conn.label,
            strength: conn.strength,
          },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Error loading mindmap:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mindmap',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadMindmap();
  }, [mindmapId, workspaceId, setNodes, setEdges, toast]);

  // Handle connection creation
  const onConnect = useCallback(
    async (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        data: {
          connectionType: 'relates_to',
          strength: 5,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Save to API
      if (mindmapId) {
        try {
          const response = await fetch(`/api/mindmap/${mindmapId}/connections?workspaceId=${workspaceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_node_id: params.source,
              target_node_id: params.target,
              connection_type: 'relates_to',
              strength: 5,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save connection');
          }

          const savedConnection = await response.json();

          if (onConnectionAdd) {
            onConnectionAdd(savedConnection);
          }

          toast({
            title: 'Success',
            description: 'Connection created',
          });
        } catch (error) {
          console.error('Error saving connection:', error);
          toast({
            title: 'Error',
            description: 'Failed to save connection',
            variant: 'destructive',
          });
        }
      }
    },
    [mindmapId, workspaceId, setEdges, onConnectionAdd, toast]
  );

  // Handle node position changes
  const handleNodesChange = useCallback(
    async (changes: any) => {
      onNodesChange(changes);

      // Auto-save position changes
      const positionChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);

      if (positionChange && mindmapId) {
        try {
          await fetch(`/api/mindmap/nodes/${positionChange.id}?workspaceId=${workspaceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position_x: positionChange.position.x,
              position_y: positionChange.position.y,
            }),
          });
        } catch (error) {
          console.error('Error saving node position:', error);
        }
      }
    },
    [onNodesChange, mindmapId, workspaceId]
  );

  // Auto-layout with Dagre
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    toast({
      title: 'Success',
      description: 'Layout applied',
    });
  }, [nodes, edges, setNodes, setEdges, toast]);

  // Fit view
  const handleFitView = useCallback(() => {
    // Will be handled by React Flow Controls component
  }, []);

  // Save mindmap
  const handleSave = useCallback(async () => {
    if (!mindmapId) {
return;
}

    setSaving(true);
    try {
      // Save all node positions
      await Promise.all(
        nodes.map((node) =>
          fetch(`/api/mindmap/nodes/${node.id}?workspaceId=${workspaceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position_x: node.position.x,
              position_y: node.position.y,
            }),
          })
        )
      );

      toast({
        title: 'Success',
        description: 'Mindmap saved',
      });
    } catch (error) {
      console.error('Error saving mindmap:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mindmap',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [mindmapId, nodes, workspaceId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-right" className="space-x-2">
          <Button
            onClick={handleAutoLayout}
            variant="outline"
            size="sm"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Auto Layout
          </Button>

          <Button
            onClick={handleSave}
            variant="default"
            size="sm"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
