// User types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  assignedAgent?: string;
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agent types
export type AgentStatus = 'active' | 'idle' | 'busy' | 'error';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  capabilities: string[];
}

// Verification types
export interface VerificationResult {
  passed: boolean;
  checks: Record<string, boolean>;
  errors: string[];
  output?: string;
}
