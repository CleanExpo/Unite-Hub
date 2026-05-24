import type { TaskStatus } from './index';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Chat API types
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

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookResponse {
  received: boolean;
  event: string;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks?: Record<string, boolean>;
}
