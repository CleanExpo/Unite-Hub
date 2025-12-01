/**
 * Services Index
 *
 * Central export point for all service types and implementations.
 * Import services from this file instead of scattered locations.
 *
 * Pattern:
 * - Service types (interfaces) are prefixed with I: IWorkspaceValidationService
 * - Service implementations are exported as: workspaceValidationService
 * - Legacy function exports available for backward compatibility
 *
 * @example
 *   // NEW: Type-safe through service object
 *   import { workspaceValidationService } from '@/lib/services';
 *   const user = await workspaceValidationService.validateUserAuth(req);
 *
 *   // LEGACY: Still works but less type-safe
 *   import { validateUserAuth } from '@/lib/services';
 *   const user = await validateUserAuth(req);
 */

// ============================================================================
// SERVICE TYPES (Interfaces)
// ============================================================================

export type {
  IWorkspaceValidationService,
  IRateLimiterService,
  ISupabaseClientService,
  ILoggerService,
  IApiResponseService,
  IAnthropicService,
  IAgentService,
  // Supporting types
  AuthenticatedUser,
  RateLimitConfig,
  RateLimitExceeded,
  SupabaseResponse,
  SupabaseListResponse,
  SuccessResponse,
  ErrorResponse,
  AnthropicMessage,
  TextBlock,
  ToolUseBlock,
  ContentBlock,
  RetryResult,
  ContactRow,
  ContactIntelligence,
  GeneratedContent,
} from './types';

// ============================================================================
// SERVICE IMPLEMENTATIONS
// ============================================================================

/**
 * Workspace Validation Service
 * Used by 101+ API routes for auth and workspace isolation
 */
export {
  workspaceValidationService,
  // Legacy function exports for backward compatibility
  validateUserAuth,
  validateWorkspaceAccess,
  validateUserAndWorkspace,
  getWorkspaceIdFromRequest,
  WorkspaceErrors,
} from './workspace-validation';

// ============================================================================
// QUICK REFERENCE
// ============================================================================

/**
 * High-Impact Services (67-27% of API routes):
 *
 * 1. SupabaseClient (67% of routes)
 *    - Use: getSupabaseServer() or getSupabaseBrowser()
 *    - Location: @/lib/supabase
 *    - Why: All database access
 *
 * 2. RateLimiter (27% of routes)
 *    - Use: apiRateLimit(req), aiAgentRateLimit(req), strictRateLimit(req)
 *    - Location: @/lib/rate-limit
 *    - Why: Prevent abuse and DoS
 *
 * 3. WorkspaceValidation (17% of routes)
 *    - Use: workspaceValidationService.validateUserAuth(req)
 *    - Location: @/lib/services (this file)
 *    - Why: Auth and workspace isolation
 *
 * 4. ApiHelpers (3% of routes)
 *    - Use: successResponse(data), errorResponse(message)
 *    - Location: @/lib/api-helpers
 *    - Why: Consistent response formats
 *
 * 5. Logger (6% of routes)
 *    - Use: createApiLogger(req).info(message)
 *    - Location: @/lib/logger
 *    - Why: Structured logging
 *
 * 6. AnthropicAPI (2% of routes, high cost impact)
 *    - Use: callAnthropicWithRetry(async () => anthropic.messages.create(...))
 *    - Location: @/lib/anthropic
 *    - Why: AI operations with reliability
 *
 * 7. AgentServices (1% of routes, high complexity)
 *    - Use: getHotLeads(workspaceId), analyzeContactIntelligence(...)
 *    - Location: @/lib/agents
 *    - Why: Complex AI analysis
 */
