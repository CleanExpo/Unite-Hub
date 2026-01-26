/**
 * Campaign Builder Component
 *
 * Visual drag-and-drop campaign builder using ReactFlow
 *
 * @module components/campaigns/builder/CampaignBuilder
 */

'use client';

import { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './nodes';
import { CampaignToolbar } from './CampaignToolbar';
import { CanvasData } from '@/lib/models/social-drip-campaign';

interface CampaignBuilderProps {
  campaignId?: string;
  initialData?: CanvasData;
  onSave?: (data: CanvasData) => void;
  readOnly?: boolean;
}

export function CampaignBuilder({
  campaignId,
  initialData,
  onSave,
  readOnly = false,
}: CampaignBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Initialize nodes and edges from initial data
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;

      // Create edge with appropriate style based on connection
      const newEdge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'smoothstep',
        animated: false,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [readOnly, setEdges]
  );

  // Handle adding a new node
  const onAddNode = useCallback(
    (type: string) => {
      if (!reactFlowInstance || readOnly) return;

      const newNodeId = `node_${Date.now()}`;
      const position = reactFlowInstance.project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, readOnly, setNodes]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (readOnly) return;
      // Additional cleanup can be done here
    },
    [readOnly]
  );

  // Handle saving campaign
  const handleSave = useCallback(() => {
    if (!reactFlowInstance) return;

    const viewport = reactFlowInstance.getViewport();
    const canvasData: CanvasData = {
      nodes: nodes as any[],
      edges: edges as any[],
      viewport,
    };

    onSave?.(canvasData);
  }, [reactFlowInstance, nodes, edges, onSave]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50"
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          {/* Background Grid */}
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />

          {/* Controls (Zoom, Fit View, etc.) */}
          <Controls showInteractive={!readOnly} />

          {/* MiniMap */}
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                trigger: '#10b981',
                email: '#6366f1',
                wait: '#f59e0b',
                condition: '#8b5cf6',
                split: '#d946ef',
                action: '#06b6d4',
                exit: '#ef4444',
              };
              return colors[node.type || 'default'] || '#94a3b8';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Toolbar Panel */}
          {!readOnly && (
            <Panel position="top-left">
              <CampaignToolbar onAddNode={onAddNode} onSave={handleSave} />
            </Panel>
          )}

          {/* Info Panel */}
          <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md">
            <div className="text-sm space-y-1">
              <div className="font-semibold text-gray-900">
                {campaignId ? 'Editing Campaign' : 'New Campaign'}
              </div>
              <div className="text-gray-500 text-xs">
                {nodes.length} nodes, {edges.length} connections
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
