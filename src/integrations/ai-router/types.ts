/**
 * AI Router Types
 * Unified type definitions for multi-provider AI routing
 */

export type AIProvider = 'openrouter' | 'perplexity' | 'anthropic';

export type AIModel =
  | 'claude-3.5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku'
  | 'gpt-4-turbo'
  | 'gpt-4-vision'
  | 'gpt-3.5-turbo'
  | 'gemini-pro-1.5'
  | 'llama-3-70b'
  | 'sonar'
  | 'sonar-pro';

export type TaskType =
  | 'creative-content'    // Social media posts, marketing copy
  | 'seo-research'        // Keyword analysis, SERP research
  | 'competitor-analysis' // Market intelligence
  | 'technical-analysis'  // Technical SEO audits
  | 'bulk-generation'     // High-volume content
  | 'visual-analysis'     // Image optimization
  | 'web-search'          // Real-time web search
  | 'general';            // General purpose

export type Priority = 'cost' | 'quality' | 'speed';

export type ContextSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ModelCapability {
  provider: AIProvider;
  model: AIModel;
  maxTokens: number;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  costPerMillionPrompt: number;
  costPerMillionCompletion: number;
  optimalFor: TaskType[];
}

export interface TaskConfig {
  task: TaskType;
  priority?: Priority;
  contextSize?: ContextSize;
  requiresVision?: boolean;
  requiresWebSearch?: boolean;
  maxBudget?: number; // Maximum cost in dollars
}

export interface RouteDecision {
  provider: AIProvider;
  model: AIModel;
  estimatedCost: number;
  reasoning: string;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  images?: string[];
  temperature?: number;
  maxTokens?: number;
  // Optional cost tracking
  organizationId?: string;
  workspaceId?: string;
  clientId?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: AIModel;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latency: number; // milliseconds
  citations?: Citation[];
  metadata?: Record<string, any>;
}

export interface Citation {
  index: number;
  url: string;
  title: string;
  snippet: string;
}

export interface CostTracking {
  organizationId: string;
  workspaceId: string;
  clientId?: string;
  taskType: TaskType;
  provider: AIProvider;
  model: AIModel;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<AIProvider, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byModel: Record<AIModel, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byTaskType: Record<TaskType, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}
