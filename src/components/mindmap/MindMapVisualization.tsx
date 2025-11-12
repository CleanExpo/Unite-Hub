"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { MindMapNode } from "./MindMapNode";

const nodeTypes = {
  mindMapNode: MindMapNode,
};

interface MindMapData {
  rootNode: {
    id: string;
    label: string;
    type: string;
  };
  branches: Array<{
    id: string;
    parentId: string;
    label: string;
    category: string;
    color: string;
    subNodes: Array<{
      id: string;
      label: string;
      details?: string;
    }>;
  }>;
}

interface MindMapVisualizationProps {
  data: MindMapData;
  onNodeClick?: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => void;
}

export function MindMapVisualization({
  data,
  onNodeClick,
  onExpandNode,
}: MindMapVisualizationProps) {
  // Convert data to React Flow format
  const initialNodes: Node[] = [
    // Root node
    {
      id: data.rootNode.id,
      type: "mindMapNode",
      position: { x: 400, y: 50 },
      data: {
        label: data.rootNode.label,
        category: "root",
        color: "#8B5CF6",
        isRoot: true,
      },
    },
    // Branch nodes
    ...data.branches.map((branch, index) => {
      const angle = (index * 2 * Math.PI) / data.branches.length;
      const radius = 250;
      return {
        id: branch.id,
        type: "mindMapNode",
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 250 + radius * Math.sin(angle),
        },
        data: {
          label: branch.label,
          category: branch.category,
          color: branch.color,
          nodeCount: branch.subNodes.length,
        },
      };
    }),
    // Sub-nodes
    ...data.branches.flatMap((branch, branchIndex) => {
      const branchAngle = (branchIndex * 2 * Math.PI) / data.branches.length;
      const branchRadius = 250;
      const branchX = 400 + branchRadius * Math.cos(branchAngle);
      const branchY = 250 + branchRadius * Math.sin(branchAngle);

      return branch.subNodes.map((subNode, subIndex) => {
        const subAngle =
          branchAngle + ((subIndex - branch.subNodes.length / 2) * Math.PI) / 8;
        const subRadius = 150;
        return {
          id: subNode.id,
          type: "mindMapNode",
          position: {
            x: branchX + subRadius * Math.cos(subAngle),
            y: branchY + subRadius * Math.sin(subAngle),
          },
          data: {
            label: subNode.label,
            category: branch.category,
            color: branch.color,
            details: subNode.details,
            isSubNode: true,
          },
        };
      });
    }),
  ];

  const initialEdges: Edge[] = [
    // Root to branches
    ...data.branches.map((branch) => ({
      id: `${data.rootNode.id}-${branch.id}`,
      source: data.rootNode.id,
      target: branch.id,
      type: "smoothstep",
      animated: true,
      style: { stroke: branch.color, strokeWidth: 2 },
    })),
    // Branches to sub-nodes
    ...data.branches.flatMap((branch) =>
      branch.subNodes.map((subNode) => ({
        id: `${branch.id}-${subNode.id}`,
        source: branch.id,
        target: subNode.id,
        type: "smoothstep",
        style: { stroke: branch.color, strokeWidth: 1.5 },
      }))
    ),
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[700px] bg-white rounded-lg shadow-sm border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return (node.data as any).color || "#94a3b8";
          }}
          className="bg-gray-100"
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
