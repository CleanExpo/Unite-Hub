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
  role: "user" | "assistant" | "system";
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
export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "blocked";

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
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "busy" | "error";
  capabilities: string[];
}

// API types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  taskStatus?: {
    id: string;
    status: TaskStatus;
  };
}

// Verification types
export interface VerificationResult {
  passed: boolean;
  checks: Record<string, boolean>;
  errors: string[];
  output?: string;
}
