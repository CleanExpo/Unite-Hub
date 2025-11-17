"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles, Layout } from "lucide-react";

// =====================================================
// TYPES
// =====================================================

interface MindmapNode {
  id: string;
  parent_id: string | null;
  node_type: string;
  label: string;
  description: string | null;
  position_x: number;
  position_y: number;
  status: string;
  priority: number;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

interface MindmapConnection {
  id: string;
  source_node_id: string;
  target_node_id: string;
  connection_type: string;
  label: string | null;
}

interface InteractiveMindmapProps {
  mindmapId: string;
  initialNodes: MindmapNode[];
  initialConnections: MindmapConnection[];
  onNodeUpdate: (nodeId: string, updates: Partial<MindmapNode>) => Promise<void>;
  onNodeDelete: (nodeId: string) => Promise<void>;
  onConnectionCreate: (connection: {
    source_node_id: string;
    target_node_id: string;
    connection_type: string;
  }) => Promise<void>;
  onNodeCreate?: (node: Partial<MindmapNode>) => Promise<void>;
  onTriggerAI?: () => Promise<void>;
}

// =====================================================
// NODE COLOR BY TYPE
// =====================================================

const NODE_COLORS: Record<string, string> = {
  project_root: "#8B5CF6", // purple
  feature: "#3B82F6", // blue
  requirement: "#10B981", // green
  task: "#F59E0B", // amber
  milestone: "#EF4444", // red
  idea: "#EC4899", // pink
  question: "#6366F1", // indigo
  note: "#6B7280", // gray
};

const NODE_STATUS_BORDERS: Record<string, string> = {
  pending: "border-gray-300",
  in_progress: "border-blue-500",
  completed: "border-green-500",
  blocked: "border-red-500",
  on_hold: "border-yellow-500",
};

// =====================================================
// CUSTOM NODE COMPONENT
// =====================================================

function CustomNode({ data }: { data: any }) {
  const bgColor = NODE_COLORS[data.node_type] || "#6B7280";
  const borderClass = NODE_STATUS_BORDERS[data.status] || "border-gray-300";

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${borderClass} bg-white shadow-lg min-w-[150px] max-w-[200px]`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: bgColor,
      }}
    >
      <div className="font-semibold text-sm text-gray-900">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-600 mt-1 truncate">
          {data.description}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {data.node_type}
        </span>
        {data.priority > 7 && (
          <span className="text-xs text-red-600 font-bold">!</span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function InteractiveMindmap({
  mindmapId,
  initialNodes,
  initialConnections,
  onNodeUpdate,
  onNodeDelete,
  onConnectionCreate,
  onNodeCreate,
  onTriggerAI,
}: InteractiveMindmapProps) {
  // Convert database nodes to ReactFlow format
  const convertToFlowNodes = useCallback((dbNodes: MindmapNode[]): Node[] => {
    return dbNodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: { x: node.position_x, y: node.position_y },
      data: {
        label: node.label,
        description: node.description,
        node_type: node.node_type,
        status: node.status,
        priority: node.priority,
        nodeId: node.id, // Store for callbacks
      },
    }));
  }, []);

  const convertToFlowEdges = useCallback(
    (dbConnections: MindmapConnection[]): Edge[] => {
      return dbConnections.map((conn) => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        label: conn.label || undefined,
        type: "smoothstep",
        animated: conn.connection_type === "depends_on",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));
    },
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    convertToFlowNodes(initialNodes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    convertToFlowEdges(initialConnections)
  );

  const [isAutoLayouting, setIsAutoLayouting] = useState(false);
  const [isTriggeringAI, setIsTriggeringAI] = useState(false);

  // Update flow when initial data changes
  useEffect(() => {
    setNodes(convertToFlowNodes(initialNodes));
  }, [initialNodes, convertToFlowNodes, setNodes]);

  useEffect(() => {
    setEdges(convertToFlowEdges(initialConnections));
  }, [initialConnections, convertToFlowEdges, setEdges]);

  // Handle node position changes
  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      try {
        await onNodeUpdate(node.data.nodeId, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
      } catch (error) {
        console.error("Failed to update node position:", error);
      }
    },
    [onNodeUpdate]
  );

  // Handle connection creation
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (connection.source && connection.target) {
        try {
          await onConnectionCreate({
            source_node_id: connection.source,
            target_node_id: connection.target,
            connection_type: "relates_to",
          });
          setEdges((eds) => addEdge(connection, eds));
        } catch (error) {
          console.error("Failed to create connection:", error);
        }
      }
    },
    [onConnectionCreate, setEdges]
  );

  // Simple auto-layout (tree-based)
  const autoLayout = useCallback(() => {
    setIsAutoLayouting(true);

    // Find root nodes (no parent)
    const rootNodes = initialNodes.filter((n) => !n.parent_id);

    // Simple tree layout
    const layoutedNodes: Node[] = [];
    let currentY = 0;

    const layoutNode = (
      node: MindmapNode,
      x: number,
      y: number,
      level: number
    ) => {
      layoutedNodes.push({
        id: node.id,
        type: "custom",
        position: { x, y },
        data: {
          label: node.label,
          description: node.description,
          node_type: node.node_type,
          status: node.status,
          priority: node.priority,
          nodeId: node.id,
        },
      });

      // Find children
      const children = initialNodes.filter((n) => n.parent_id === node.id);
      children.forEach((child, index) => {
        layoutNode(child, x + 250, y + index * 100, level + 1);
      });
    };

    rootNodes.forEach((rootNode, index) => {
      layoutNode(rootNode, 100, index * 150, 0);
    });

    setNodes(layoutedNodes);

    // Save updated positions
    layoutedNodes.forEach(async (node) => {
      try {
        await onNodeUpdate(node.data.nodeId, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
      } catch (error) {
        console.error("Failed to save layout:", error);
      }
    });

    setTimeout(() => setIsAutoLayouting(false), 500);
  }, [initialNodes, setNodes, onNodeUpdate]);

  // Trigger AI analysis
  const handleTriggerAI = useCallback(async () => {
    if (!onTriggerAI) return;

    setIsTriggeringAI(true);
    try {
      await onTriggerAI();
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setIsTriggeringAI(false);
    }
  }, [onTriggerAI]);

  return (
    <div className="w-full h-[700px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
      >
        <Controls />
        <Background />

        {/* Toolbar */}
        <Panel position="top-right" className="space-x-2">
          {onNodeCreate && (
            <Button
              size="sm"
              variant="default"
              onClick={() =>
                onNodeCreate({
                  node_type: "feature",
                  label: "New Feature",
                  description: "",
                  position_x: Math.random() * 400,
                  position_y: Math.random() * 400,
                  status: "pending",
                  priority: 5,
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Node
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={autoLayout}
            disabled={isAutoLayouting}
          >
            {isAutoLayouting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Layout className="w-4 h-4 mr-1" />
            )}
            Auto Layout
          </Button>

          {onTriggerAI && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTriggerAI}
              disabled={isTriggeringAI}
            >
              {isTriggeringAI ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              AI Analyze
            </Button>
          )}
        </Panel>

        {/* Stats Panel */}
        <Panel position="bottom-left" className="bg-white p-2 rounded shadow-sm">
          <div className="text-xs text-gray-600">
            <div>Nodes: {nodes.length}</div>
            <div>Connections: {edges.length}</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
