/**
 * Service Type Contracts
 *
 * Explicit TypeScript interfaces that define the public API contract for all services.
 * These are the "source of truth" for what each service can do and what it returns.
 *
 * CRITICAL: All service implementations MUST implement these interfaces.
 * This prevents:
 * - Undefined method calls (TS2339 errors)
 * - Type mismatches in return values (TS2322 errors)
 * - Missing method implementations (caught at compile time)
 *
 * Pattern:
 * 1. Define interface IServiceName for each major service
 * 2. Export concrete implementation as ServiceName (using class implements IServiceName)
 * 3. Use interface in API routes: const result = await service.methodName(...)
 * 4. TypeScript validates all method calls and return types
 */

import { NextRequest } from 'next/server';
import type { Database } from '@/types/database.generated';
import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// WORKSPACE VALIDATION SERVICE
// ============================================================================

/**
 * User authentication result with workspace context
 * Returned by all workspace validation functions
 */
export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  workspaceId?: string;
}

/**
 * Workspace Validation Service - handles authentication and authorization
 * Used in 101+ API routes (17% of all routes)
 *
 * Guarantees:
 * - User authentication via JWT or session
 * - Organization membership verification
 * - Workspace ownership verification
 * - Throws on any security violation
 */
export interface IWorkspaceValidationService {
  /**
   * Validates user authentication from request
   * Supports both Bearer token (implicit OAuth) and cookies (PKCE)
   *
   * @throws Error with specific messages:
   *   - "Unauthorized: Invalid token" - Bad JWT
   *   - "Unauthorized: No valid session" - No cookies/token
   *   - "Forbidden: No organization found for user" - User not in any org
   *   - "Forbidden: Error accessing organization" - Database error
   */
  validateUserAuth(req: NextRequest): Promise<AuthenticatedUser>;

  /**
   * Validates that workspace belongs to user's organization
   * Uses service role (user already authenticated)
   *
   * @throws Error with specific messages:
   *   - "Forbidden: Error accessing workspace" - Database error
   *   - "Forbidden: Workspace not found" - Workspace doesn't exist
   *   - "Forbidden: Workspace does not belong to your organization" - Org mismatch
   */
  validateWorkspaceAccess(workspaceId: string, orgId: string): Promise<boolean>;

  /**
   * Validates authentication AND workspace in one call
   * Recommended for most workspace-scoped endpoints
   *
   * @throws Any error from validateUserAuth or validateWorkspaceAccess
   */
  validateUserAndWorkspace(
    req: NextRequest,
    workspaceId: string
  ): Promise<AuthenticatedUser>;

  /**
   * Extracts workspaceId from request query or body
   *
   * @throws Error "Bad Request: workspaceId is required" if not found
   */
  getWorkspaceIdFromRequest(req: NextRequest, body?: any): Promise<string>;
}

// ============================================================================
// RATE LIMIT SERVICE
// ============================================================================

/**
 * Rate Limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Window duration in milliseconds
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: NextRequest) => Response;
}

/**
 * Rate Limit Response when exceeded
 */
export interface RateLimitExceeded {
  status: 429;
  body: {
    error: string;
    retryAfter: number;
  };
  headers: {
    'Retry-After': string;
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
  };
}

/**
 * Rate Limiter Service - prevents abuse and DoS
 * Used in 164+ API routes (27% of all routes)
 *
 * Guarantees:
 * - Token bucket algorithm for fair rate limiting
 * - Redis-backed for distributed systems
 * - Returns 429 when exceeded
 * - Returns null if request passes
 */
export interface IRateLimiterService {
  /**
   * Standard API rate limit: 100 requests per 15 minutes
   * @returns null if allowed, NextResponse with 429 if exceeded
   */
  apiRateLimit(req: NextRequest): Promise<Response | null>;

  /**
   * Strict AI agent rate limit: 10 requests per 15 minutes
   * Use for expensive operations (Anthropic API calls)
   * @returns null if allowed, NextResponse with 429 if exceeded
   */
  aiAgentRateLimit(req: NextRequest): Promise<Response | null>;

  /**
   * Very strict rate limit: 10 requests per 15 minutes
   * Use for critical operations (auth, payment)
   * @returns null if allowed, NextResponse with 429 if exceeded
   */
  strictRateLimit(req: NextRequest): Promise<Response | null>;

  /**
   * Public rate limit: 300 requests per 15 minutes
   * Use for public endpoints (marketing pages)
   * @returns null if allowed, NextResponse with 429 if exceeded
   */
  publicRateLimit(req: NextRequest): Promise<Response | null>;

  /**
   * Custom rate limit with user-defined config
   * @returns null if allowed, NextResponse with 429 if exceeded
   */
  rateLimit(req: NextRequest, config: RateLimitConfig): Promise<Response | null>;

  /**
   * Create a rate limiter for specific user (workspace-scoped)
   * Returns a function that can be called with requests
   */
  createUserRateLimit(userId: string): (req: NextRequest) => Promise<Response | null>;
}

// ============================================================================
// SUPABASE CLIENT SERVICE
// ============================================================================

/**
 * Supabase query result - mimics PostgREST response
 */
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: PostgrestError | null;
  count?: number;
  status: number;
  statusText: string;
}

/**
 * Supabase list response - for queries returning multiple rows
 */
export interface SupabaseListResponse<T = any> extends SupabaseResponse<T[]> {
  count?: number; // Total count (with COUNT(*))
}

/**
 * Supabase Authenticated Client Service
 * Used in 407+ API routes (67% of all routes)
 *
 * CRITICAL: This is the foundation for all data access.
 * Provides type-safe access to database tables using Database types.
 *
 * Guarantees:
 * - All operations are JWT-authenticated or session-authenticated
 * - RLS policies are enforced
 * - Return types match Database schema
 */
export interface ISupabaseClientService {
  /**
   * Get a single row
   * @example
   *   const response = await supabase
   *     .from('contacts')
   *     .select('*')
   *     .eq('id', contactId)
   *     .single();
   *   // response.data is Contact | null, response.error is PostgrestError | null
   */
  from<T extends keyof Database['public']['Tables']>(table: T): SupabaseQueryBuilder<T>;

  /**
   * Access auth module
   * @example
   *   const { data: { user } } = await supabase.auth.getUser();
   */
  auth: {
    getUser(): Promise<{ data: { user: any }; error: any }>;
    getSession(): Promise<{ data: { session: any }; error: any }>;
    signOut(): Promise<{ error: any }>;
  };
}

/**
 * Query builder for type-safe queries
 * Returned by from() method
 */
export interface SupabaseQueryBuilder<T extends keyof Database['public']['Tables']> {
  select(
    columns?: string | string[]
  ): SupabaseSelectBuilder<T>;

  insert(
    data: Database['public']['Tables'][T]['Insert'][]
  ): SupabaseInsertBuilder<T>;

  update(
    data: Partial<Database['public']['Tables'][T]['Update']>
  ): SupabaseUpdateBuilder<T>;

  delete(): SupabaseDeleteBuilder<T>;
}

export interface SupabaseSelectBuilder<T extends keyof Database['public']['Tables']> {
  eq(column: string, value: any): SupabaseSelectBuilder<T>;
  neq(column: string, value: any): SupabaseSelectBuilder<T>;
  gt(column: string, value: any): SupabaseSelectBuilder<T>;
  gte(column: string, value: any): SupabaseSelectBuilder<T>;
  lt(column: string, value: any): SupabaseSelectBuilder<T>;
  lte(column: string, value: any): SupabaseSelectBuilder<T>;
  like(column: string, pattern: string): SupabaseSelectBuilder<T>;
  ilike(column: string, pattern: string): SupabaseSelectBuilder<T>;
  in(column: string, values: any[]): SupabaseSelectBuilder<T>;
  is(column: string, value: null): SupabaseSelectBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseSelectBuilder<T>;
  limit(count: number): SupabaseSelectBuilder<T>;
  range(from: number, to: number): SupabaseSelectBuilder<T>;
  single(): Promise<SupabaseResponse<Database['public']['Tables'][T]['Row']>>;
  maybeSingle(): Promise<SupabaseResponse<Database['public']['Tables'][T]['Row'] | null>>;
  then(callback: any): Promise<SupabaseListResponse<Database['public']['Tables'][T]['Row']>>;
}

export interface SupabaseInsertBuilder<T extends keyof Database['public']['Tables']> {
  select(): SupabaseSelectBuilder<T>;
}

export interface SupabaseUpdateBuilder<T extends keyof Database['public']['Tables']> {
  eq(column: string, value: any): SupabaseUpdateBuilder<T>;
  select(): SupabaseSelectBuilder<T>;
}

export interface SupabaseDeleteBuilder<T extends keyof Database['public']['Tables']> {
  eq(column: string, value: any): SupabaseDeleteBuilder<T>;
}

// ============================================================================
// LOGGER SERVICE
// ============================================================================

/**
 * Logger Service - structured logging with Winston
 * Used in 38+ API routes (6% of all routes)
 *
 * Guarantees:
 * - Persistent logs to file with daily rotation
 * - Structured JSON format for machine parsing
 * - Metadata support for context
 * - Multiple log levels (info, warn, error, debug, http)
 */
export interface ILoggerService {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
  http(message: string, metadata?: Record<string, any>): void;
  log(level: string, message: string, metadata?: Record<string, any>): void;
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string | Record<string, string>;
  code?: string;
}

/**
 * API Response Helper Service
 * Used in 17+ API routes (3% of all routes)
 *
 * Guarantees:
 * - Consistent response format
 * - Proper HTTP status codes
 * - Proper Content-Type headers
 */
export interface IApiResponseService {
  /**
   * Send success response (200 OK)
   */
  successResponse<T = any>(
    data?: T,
    meta?: SuccessResponse<T>['meta'],
    message?: string,
    status?: number
  ): Response;

  /**
   * Send error response (400/401/403/500)
   */
  errorResponse(
    message: string,
    status?: number,
    details?: string | Record<string, string>,
    code?: string
  ): Response;

  /**
   * Send validation error (400 Bad Request)
   */
  validationError(errors: Record<string, string> | string): Response;

  /**
   * Authenticate request and return user + supabase client
   */
  authenticateRequest(req: NextRequest): Promise<{
    user: { id: string; email?: string } | null;
    supabase: ISupabaseClientService;
    error: Response | null;
  }>;
}

// ============================================================================
// ANTHROPIC API SERVICE
// ============================================================================

/**
 * Anthropic message content block
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export type ContentBlock = TextBlock | ToolUseBlock;

/**
 * Anthropic message response
 */
export interface AnthropicMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalTime: number; // milliseconds
}

/**
 * Anthropic API Service
 * Used in 13+ API routes (2% of all routes, but 10-100x cost impact)
 *
 * Guarantees:
 * - Automatic retry with exponential backoff
 * - Token usage tracking
 * - Model-specific rate limiting
 * - Proper error handling
 */
export interface IAnthropicService {
  /**
   * Send message to Claude with automatic retry
   * @param callback Function that calls anthropic.messages.create()
   * @returns Message response with retry metadata
   * @throws Error if all retries exhausted
   */
  callWithRetry<T extends AnthropicMessage>(
    callback: () => Promise<T>
  ): Promise<RetryResult<T>>;

  /**
   * Get pricing for a model
   */
  getModelPricing(modelId: string): {
    model: string;
    inputCost: number; // per 1M tokens
    outputCost: number; // per 1M tokens
    contextWindow: number;
    maxOutputTokens: number;
  };

  /**
   * Calculate token cost
   */
  calculateTokenCost(
    tokens: number,
    modelId: string,
    tokenType: 'input' | 'output'
  ): number; // USD
}

// ============================================================================
// AGENT SERVICES
// ============================================================================

/**
 * Contact row from database
 */
export interface ContactRow {
  id: string;
  name: string;
  email: string;
  ai_score: number;
  status: string;
  company?: string;
  job_title?: string;
  tags?: string[];
  created_at: string;
}

/**
 * Contact intelligence analysis
 */
export interface ContactIntelligence {
  engagement_score: number;
  buying_intent: 'high' | 'medium' | 'low' | 'unknown';
  decision_stage: 'awareness' | 'consideration' | 'decision' | 'unknown';
  role_type: 'decision_maker' | 'influencer' | 'end_user' | 'unknown';
  next_best_action: string;
  risk_signals: string[];
  opportunity_signals: string[];
  engagement_velocity: number;
  sentiment_score: number;
}

/**
 * Generated content draft
 */
export interface GeneratedContent {
  id: string;
  content_type: string;
  subject?: string;
  body: string;
  html?: string;
  status: 'draft' | 'approved';
  created_at: string;
}

/**
 * Agent Service - handles multi-step AI operations
 * Used in 8+ API routes (1% of all routes, high-complexity operations)
 *
 * Guarantees:
 * - Deterministic AI analysis
 * - Workspace-scoped results
 * - Caching for performance
 * - Proper error handling
 */
export interface IAgentService {
  /**
   * Get hot leads for workspace
   */
  getHotLeads(workspaceId: string, limit?: number): Promise<ContactRow[]>;

  /**
   * Analyze contact intelligence
   */
  analyzeContactIntelligence(
    contactId: string,
    workspaceId: string
  ): Promise<ContactIntelligence>;

  /**
   * Analyze all contacts in workspace
   */
  analyzeWorkspaceContacts(workspaceId: string): Promise<{
    hotCount: number;
    warmCount: number;
    coldCount: number;
    average_score: number;
  }>;

  /**
   * Generate personalized content
   */
  generatePersonalizedContent(
    contactId: string,
    contentType: string
  ): Promise<GeneratedContent>;

  /**
   * Generate bulk content
   */
  generateBulkContent(
    contacts: ContactRow[],
    contentType: string
  ): Promise<GeneratedContent[]>;

  /**
   * Get personalization metrics
   */
  getPersonalizationMetrics(workspaceId: string): Promise<{
    total_contacts: number;
    personalized_count: number;
    personalization_rate: number;
    average_engagement: number;
  }>;
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * All service interfaces exported for type-safe usage
 */
export type {
  IWorkspaceValidationService,
  IRateLimiterService,
  ISupabaseClientService,
  ILoggerService,
  IApiResponseService,
  IAnthropicService,
  IAgentService,
};
