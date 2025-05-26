/**
 * AI Gateway Types
 * Unite Group Advanced AI Service Gateway
 */

// Core AI Provider Types
export type AIProvider = 'openai' | 'claude' | 'google' | 'azure' | 'local';

export interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

// Request/Response Types
export interface AIRequest {
  id: string;
  provider: AIProvider;
  type: AIRequestType;
  prompt: string;
  options?: AIRequestOptions;
  metadata?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

export interface AIResponse {
  id: string;
  requestId: string;
  provider: AIProvider;
  content: string;
  usage?: AIUsage;
  metadata?: Record<string, unknown>;
  timestamp: string;
  processingTime: number;
  cached?: boolean;
}

export type AIRequestType = 
  | 'text_generation'
  | 'text_completion'
  | 'text_analysis'
  | 'text_summarization'
  | 'text_translation'
  | 'sentiment_analysis'
  | 'entity_extraction'
  | 'image_analysis'
  | 'image_generation'
  | 'document_analysis'
  | 'code_generation'
  | 'question_answering';

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  model?: string;
  systemPrompt?: string;
  context?: string[];
  format?: 'text' | 'json' | 'markdown' | 'html';
  language?: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  model: string;
}

// Provider-Specific Types
export interface OpenAIConfig extends AIServiceConfig {
  provider: 'openai';
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-4o';
  organization?: string;
}

export interface ClaudeConfig extends AIServiceConfig {
  provider: 'claude';
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
  version?: string;
}

export interface GoogleAIConfig extends AIServiceConfig {
  provider: 'google';
  model: 'gemini-pro' | 'gemini-pro-vision' | 'text-bison' | 'chat-bison';
  projectId?: string;
  location?: string;
}

export interface AzureConfig extends AIServiceConfig {
  provider: 'azure';
  model: string;
  resourceName?: string;
  deploymentName?: string;
  apiVersion?: string;
}

// Error Types
export interface AIError {
  code: string;
  message: string;
  provider: AIProvider;
  requestId?: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  timestamp: string;
}

export type AIErrorCode = 
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'CONTENT_FILTERED'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN_ERROR';

// Monitoring and Analytics
export interface AIMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  totalCost: number;
  providerDistribution: Record<AIProvider, number>;
  requestTypeDistribution: Record<AIRequestType, number>;
  errorDistribution: Record<AIErrorCode, number>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface AIHealthStatus {
  provider: AIProvider;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastChecked: string;
  details?: Record<string, unknown>;
}

// Caching Types
export interface AICacheEntry {
  key: string;
  provider: AIProvider;
  request: AIRequest;
  response: AIResponse;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  lastAccessed: string;
}

export interface AICacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of entries
  keyStrategy: 'hash' | 'content' | 'custom';
  excludeTypes?: AIRequestType[];
  includeProviders?: AIProvider[];
}

// Load Balancing and Routing
export interface AIRoutingRule {
  id: string;
  name: string;
  condition: AIRoutingCondition;
  action: AIRoutingAction;
  priority: number;
  enabled: boolean;
}

export interface AIRoutingCondition {
  requestType?: AIRequestType[];
  provider?: AIProvider[];
  userTier?: string[];
  contentLength?: { min?: number; max?: number };
  timeOfDay?: { start: string; end: string };
  geography?: string[];
  costThreshold?: number;
}

export interface AIRoutingAction {
  targetProvider: AIProvider;
  fallbackProviders?: AIProvider[];
  modifyRequest?: (request: AIRequest) => AIRequest;
  priority?: number;
}

// Security and Compliance
export interface AISecurityConfig {
  enableContentFiltering: boolean;
  enablePIIDetection: boolean;
  enableAuditLogging: boolean;
  dataRetentionDays: number;
  encryptionKey?: string;
  allowedDomains?: string[];
  blockedPatterns?: string[];
  complianceMode?: 'GDPR' | 'CCPA' | 'SOC2' | 'HIPAA';
}

export interface AIAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
  provider: AIProvider;
  requestType: AIRequestType;
  promptHash: string;
  responseHash: string;
  usage: AIUsage;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Batch Processing
export interface AIBatchRequest {
  id: string;
  requests: AIRequest[];
  options: AIBatchOptions;
  status: AIBatchStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  results?: AIBatchResult[];
  errors?: AIError[];
}

export interface AIBatchOptions {
  maxConcurrency: number;
  retryFailures: boolean;
  continueOnError: boolean;
  progressCallback?: (progress: AIBatchProgress) => void;
}

export type AIBatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AIBatchResult {
  requestId: string;
  response?: AIResponse;
  error?: AIError;
  processingTime: number;
}

export interface AIBatchProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  estimatedTimeRemaining?: number;
}

// Content Moderation
export interface AIContentModerationResult {
  safe: boolean;
  categories: AIContentCategory[];
  confidence: number;
  reasons: string[];
  suggestions?: string[];
}

export interface AIContentCategory {
  category: AIContentCategoryType;
  score: number;
  severity: 'low' | 'medium' | 'high';
}

export type AIContentCategoryType = 
  | 'hate_speech'
  | 'harassment'
  | 'violence'
  | 'sexual_content'
  | 'illegal_activity'
  | 'spam'
  | 'personal_information'
  | 'financial_information'
  | 'medical_information'
  | 'copyrighted_content';

// Model Management
export interface AIModelInfo {
  id: string;
  provider: AIProvider;
  name: string;
  version: string;
  capabilities: AIModelCapability[];
  limits: AIModelLimits;
  pricing: AIModelPricing;
  status: 'available' | 'deprecated' | 'beta' | 'experimental';
  description?: string;
  documentation?: string;
}

export type AIModelCapability = 
  | 'text_generation'
  | 'text_analysis'
  | 'image_generation'
  | 'image_analysis'
  | 'code_generation'
  | 'function_calling'
  | 'json_mode'
  | 'streaming'
  | 'multimodal';

export interface AIModelLimits {
  maxTokens: number;
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxContextLength: number;
  supportedLanguages?: string[];
}

export interface AIModelPricing {
  inputTokenCost: number; // Cost per 1K input tokens
  outputTokenCost: number; // Cost per 1K output tokens
  currency: string;
  minimumCharge?: number;
}

// Feature Flags and A/B Testing
export interface AIFeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: AIFeatureFlagCondition[];
  rolloutPercentage?: number;
  targetAudience?: string[];
}

export interface AIFeatureFlagCondition {
  type: 'user_id' | 'user_tier' | 'geography' | 'time' | 'random';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: unknown;
}

// Integration Interfaces
export interface AIGatewayInterface {
  // Core Operations
  generateText(request: AIRequest): Promise<AIResponse>;
  analyzeText(text: string, analysisType: string, options?: AIRequestOptions): Promise<AIResponse>;
  processImage(image: ImageData, tasks: string[], options?: AIRequestOptions): Promise<AIResponse>;
  
  // Batch Operations
  processBatch(requests: AIRequest[], options?: AIBatchOptions): Promise<AIBatchRequest>;
  getBatchStatus(batchId: string): Promise<AIBatchRequest>;
  
  // Management Operations
  getProviderHealth(): Promise<AIHealthStatus[]>;
  getMetrics(timeRange?: { start: string; end: string }): Promise<AIMetrics>;
  getUsage(userId?: string, timeRange?: { start: string; end: string }): Promise<AIUsage>;
  
  // Configuration
  updateConfig(config: Partial<AIServiceConfig>): Promise<void>;
  addProvider(config: AIServiceConfig): Promise<void>;
  removeProvider(provider: AIProvider): Promise<void>;
  
  // Security and Compliance
  moderateContent(content: string): Promise<AIContentModerationResult>;
  getAuditLogs(filter?: Record<string, unknown>): Promise<AIAuditLog[]>;
  
  // Caching
  clearCache(pattern?: string): Promise<void>;
  getCacheStats(): Promise<{ size: number; hitRate: number; missRate: number }>;
}

// Utility Types
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: AIPromptVariable[];
  category: string;
  tags: string[];
  examples: AIPromptExample[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIPromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: unknown[];
  };
}

export interface AIPromptExample {
  input: Record<string, unknown>;
  expectedOutput: string;
  description?: string;
}

// Event Types
export interface AIEvent {
  type: AIEventType;
  data: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export type AIEventType = 
  | 'request_started'
  | 'request_completed'
  | 'request_failed'
  | 'rate_limit_hit'
  | 'quota_warning'
  | 'provider_health_changed'
  | 'cache_hit'
  | 'cache_miss'
  | 'model_updated'
  | 'config_changed';

export type AIEventHandler = (event: AIEvent) => void | Promise<void>;
