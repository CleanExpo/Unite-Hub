/**
 * TypeScript types for visual workflows (frontend)
 * Scientific Luxury Design System Compliant
 */

export type NodeType =
  | 'start'
  | 'end'
  | 'llm'
  | 'agent'
  | 'tool'
  | 'conditional'
  | 'loop'
  | 'knowledge'
  | 'http'
  | 'code'
  | 'verification'
  | 'trigger'
  | 'action'
  | 'logic'
  | 'output';

// Spectral colour mapping for Scientific Luxury UI
export const NODE_SPECTRAL_COLOURS: Record<NodeType, string> = {
  start: '#00F5FF', // Cyan - workflow start
  trigger: '#00F5FF', // Cyan - workflow trigger
  end: '#6B7280', // Grey - workflow end
  output: '#6B7280', // Grey - output nodes
  llm: '#FF00FF', // Magenta - AI/LLM
  agent: '#FF00FF', // Magenta - AI agent
  tool: '#00FF88', // Emerald - tools/actions
  action: '#00FF88', // Emerald - actions
  conditional: '#FFB800', // Amber - conditionals
  logic: '#FFB800', // Amber - logic
  loop: '#FFB800', // Amber - loops
  knowledge: '#00F5FF', // Cyan - knowledge base
  http: '#00FF88', // Emerald - HTTP calls
  code: '#00FF88', // Emerald - code execution
  verification: '#FFB800', // Amber - verification
} as const;

export type EdgeType = 'default' | 'true' | 'false' | 'success' | 'error' | 'item';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfig {
  id: string;
  type: NodeType;
  position: NodePosition;
  label: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON config
  config: Record<string, any>;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON metadata
  metadata: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  type: EdgeType;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: NodeConfig[];
  edges: WorkflowEdge[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON variables
  variables: Record<string, any>;
  skill_compatibility: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  tags: string[];
  is_published: boolean;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowExecution {
  execution_id: string;
  workflow_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  current_node_id?: string;
  completed_nodes: string[];
  failed_nodes: string[];
}

// Node execution status for Scientific Luxury breathing animations
export type NodeVisualStatus = 'idle' | 'running' | 'completed' | 'failed' | 'awaiting';

export const NODE_STATUS_COLOURS: Record<NodeVisualStatus, string> = {
  idle: '#6B7280', // Grey - pending
  running: '#00F5FF', // Cyan - in progress
  completed: '#00FF88', // Emerald - success
  failed: '#FF4444', // Red - error
  awaiting: '#FFB800', // Amber - awaiting verification
} as const;

// Australian localisation helpers (en-AU)
export const formatAustralianDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatAustralianTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatAustralianDateTime = (date: Date | string): string => {
  return `${formatAustralianDate(date)} ${formatAustralianTime(date)}`;
};
