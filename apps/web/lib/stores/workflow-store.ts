import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  addEdge,
} from '@xyflow/react';

// Spectral colours for node types
export const NODE_COLOURS = {
  trigger: '#00F5FF', // Cyan - workflow start
  action: '#00FF88', // Emerald - execute operations
  logic: '#FFB800', // Amber - conditionals
  agent: '#FF00FF', // Magenta - AI agent invocation
  output: '#6B7280', // Grey - end nodes
} as const;

export type NodeType = keyof typeof NODE_COLOURS;

export interface WorkflowNode extends Node {
  type: NodeType;
  data: {
    label: string;
    description?: string;
    config?: Record<string, unknown>;
    status?: 'idle' | 'running' | 'completed' | 'failed';
  };
}

export interface WorkflowEdge extends Edge {
  animated?: boolean;
  data?: {
    condition?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowState {
  // Current workflow
  workflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // UI state
  selectedNodeId: string | null;
  isPanelOpen: boolean;
  isExecuting: boolean;

  // Actions
  setWorkflow: (workflow: Workflow) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  togglePanel: () => void;
  setExecuting: (isExecuting: boolean) => void;
  updateNodeStatus: (nodeId: string, status: WorkflowNode['data']['status']) => void;
  resetWorkflow: () => void;
}

const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      workflow: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isPanelOpen: true,
      isExecuting: false,

      // Workflow management
      setWorkflow: (workflow) =>
        set({
          workflow,
          nodes: workflow.nodes,
          edges: workflow.edges,
        }),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      // React Flow handlers
      onNodesChange: (changes) =>
        set({
          nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
        }),

      onEdgesChange: (changes) =>
        set({
          edges: applyEdgeChanges(changes, get().edges) as WorkflowEdge[],
        }),

      onConnect: (connection) =>
        set({
          edges: addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 1 },
            },
            get().edges
          ) as WorkflowEdge[],
        }),

      // Node operations
      addNode: (type, position) => {
        const newNode: WorkflowNode = {
          id: generateNodeId(),
          type,
          position,
          data: {
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            status: 'idle',
          },
        };
        set({ nodes: [...get().nodes, newNode] });
      },

      updateNodeData: (nodeId, data) =>
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
        }),

      deleteNode: (nodeId) =>
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        }),

      // UI state
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
      togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
      setExecuting: (isExecuting) => set({ isExecuting }),

      // Execution status
      updateNodeStatus: (nodeId, status) =>
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
          ),
        }),

      // Reset
      resetWorkflow: () =>
        set({
          workflow: null,
          nodes: [],
          edges: [],
          selectedNodeId: null,
          isExecuting: false,
        }),
    })),
    { name: 'workflow-store' }
  )
);
