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
    (_deleted: Node[]) => {
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
    <div className="w-full h-full flex flex-col bg-[#050505]" ref={reactFlowWrapper}>
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
          className="bg-[#050505]"
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          {/* Background Grid */}
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#ffffff10" />

          {/* Controls (Zoom, Fit View, etc.) */}
          <Controls showInteractive={!readOnly} />

          {/* MiniMap */}
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                trigger: '#00FF88',
                email: '#00F5FF',
                wait: '#FFB800',
                condition: '#FF00FF',
                split: '#FF00FF',
                action: '#00F5FF',
                exit: '#FF4444',
              };
              return colors[node.type || 'default'] || '#ffffff30';
            }}
            maskColor="rgba(5, 5, 5, 0.7)"
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}
          />

          {/* Toolbar Panel */}
          {!readOnly && (
            <Panel position="top-left">
              <CampaignToolbar onAddNode={onAddNode} onSave={handleSave} />
            </Panel>
          )}

          {/* Info Panel */}
          <Panel position="top-right">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-3">
              <div className="text-sm space-y-1">
                <div className="font-mono font-semibold text-white">
                  {campaignId ? 'Editing Campaign' : 'New Campaign'}
                </div>
                <div className="font-mono text-white/40 text-xs">
                  {nodes.length} nodes, {edges.length} connections
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
