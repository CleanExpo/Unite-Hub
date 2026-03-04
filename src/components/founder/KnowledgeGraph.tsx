'use client';

/**
 * KnowledgeGraph — Scientific Luxury styled ReactFlow knowledge graph.
 *
 * Renders contact and business nodes with dagre auto-layout (left-to-right).
 * Custom node styles follow the design system:
 *   - Contact: #00F5FF (cyan) border
 *   - Business: #00FF88 (emerald) border
 */

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 150 });

  nodes.forEach((n) =>
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  );
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return {
        ...n,
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      };
    }),
    edges,
  };
}

// ─── Custom Nodes ─────────────────────────────────────────────────────────────

interface ContactNodeData {
  label: string;
  business?: string;
  status?: string;
  tags?: string[];
}

function ContactNode({ data }: NodeProps<ContactNodeData>) {
  const statusColour =
    data.status === 'active'
      ? '#00FF88'
      : data.status === 'prospect'
      ? '#FFB800'
      : '#555';

  return (
    <div
      style={{
        background: '#0d0d0d',
        border: '1.5px solid #00F5FF',
        borderRadius: '2px',
        padding: '8px 12px',
        minWidth: NODE_WIDTH,
        boxShadow: '0 0 10px rgba(0,245,255,0.15)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#00F5FF' }} />

      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#00F5FF',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.label}
      </div>

      {data.business && (
        <div
          style={{
            fontSize: '10px',
            color: '#888',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.business}
        </div>
      )}

      {data.status && (
        <div
          style={{
            display: 'inline-block',
            marginTop: '4px',
            padding: '1px 6px',
            borderRadius: '2px',
            background: `${statusColour}22`,
            border: `1px solid ${statusColour}55`,
            fontSize: '9px',
            color: statusColour,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {data.status}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#00F5FF' }} />
    </div>
  );
}

interface BusinessNodeData {
  label: string;
}

function BusinessNode({ data }: NodeProps<BusinessNodeData>) {
  return (
    <div
      style={{
        background: '#050a06',
        border: '1.5px solid #00FF88',
        borderRadius: '2px',
        padding: '10px 14px',
        minWidth: NODE_WIDTH,
        boxShadow: '0 0 12px rgba(0,255,136,0.18)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#00FF88' }} />

      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#00FF88',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.label}
      </div>

      <div
        style={{
          fontSize: '10px',
          color: '#00FF8877',
          marginTop: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        BUSINESS
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#00FF88' }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contact: ContactNode as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  business: BusinessNode as any,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface KnowledgeGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (
    nodeId: string,
    nodeType: string,
    data: Record<string, unknown>
  ) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KnowledgeGraph({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Apply dagre layout when data arrives
  useEffect(() => {
    if (!initialNodes.length) return;

    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(layouted);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id, node.type ?? '', node.data as Record<string, unknown>);
      }
    },
    [onNodeClick]
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#050505' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        style={{ height: '100%' }}
        edgesFocusable={false}
        elementsSelectable
        defaultEdgeOptions={{
          style: { stroke: '#333', strokeWidth: 1 },
          labelStyle: {
            fill: '#555',
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
          },
          labelBgStyle: { fill: '#050505' },
        }}
      >
        <Background color="#111" gap={20} />
        <Controls
          style={{
            background: '#0d0d0d',
            border: '1px solid #00F5FF22',
            borderRadius: '2px',
          }}
        />
        <MiniMap
          style={{
            background: '#0d0d0d',
            border: '1px solid #00F5FF22',
          }}
          nodeColor={(n) => {
            if (n.type === 'contact') return '#00F5FF44';
            if (n.type === 'business') return '#00FF8844';
            return '#333';
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}

export default KnowledgeGraph;
