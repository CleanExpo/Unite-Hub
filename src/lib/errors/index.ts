/**
 * Error Handling System
 *
 * Central export point for error utilities:
 * - Result<T, E> type for explicit error handling
 * - Error boundaries for API routes
 * - Specific error classes for different scenarios
 * - Conversion utilities between error formats
 *
 * @example
 *   import {
 *     type Result,
 *     ok, err, isOk,
 *     withErrorBoundary,
 *     ValidationError,
 *   } from '@/lib/errors';
 */

// ============================================================================
// RESULT TYPE & UTILITIES
// ============================================================================

export type {
  Result,
  Ok,
  Err,
  ApiError,
} from './result';

export {
  ok,
  err,
  isOk,
  isErr,
  mapOk,
  mapErr,
  flatMapOk,
  flatMapErr,
  unwrapOr,
  unwrapOrThrow,
  resultToPromise,
  combineResults,
  tapOk,
  tapErr,
  match,
  createApiError,
  ErrorCodes,
  tryCatch,
  resultify,
} from './result';

// ============================================================================
// ERROR BOUNDARIES & RESPONSE HELPERS
// ============================================================================

export {
  withErrorBoundary,
  withErrorBoundaryCustom,
  withParallelErrorBoundary,
  normalizeError,
  isApiError,
  errorResponse,
  successResponse,
  toResult,
  chainOperations,
  getErrorCodeAndStatus,
} from './boundaries';

// ============================================================================
// ERROR LOGGING & MONITORING
// ============================================================================

export type {
  ErrorContext,
  ErrorLogEntry,
} from './logging';

export {
  errorLogger,
  logApiError,
  createErrorContext,
  getErrorMonitoringData,
  checkErrorHealth,
} from './logging';

// ============================================================================
// SPECIFIC ERROR CLASSES
// ============================================================================

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  WorkspaceError,
  ServiceUnavailableError,
  TimeoutError,
} from './boundaries';

// ============================================================================
// QUICK REFERENCE
// ============================================================================

/**
 * Error Handling Patterns:
 *
 * 1. RESULT TYPE (for functions returning Result<T, E>)
 *    ✅ Makes errors explicit in return type
 *    ✅ Compiler prevents forgetting error handling
 *    ✅ Enables method chaining
 *
 *    @example
 *      const result = await fetchUser(id);
 *      if (isOk(result)) {
 *        console.log(result.value);
 *      } else {
 *        console.error(result.error);
 *      }
 *
 * 2. ERROR BOUNDARIES (for API routes)
 *    ✅ Catches all errors automatically
 *    ✅ Converts to standardized API error response
 *    ✅ Eliminates try-catch boilerplate
 *
 *    @example
 *      export const POST = withErrorBoundary(async (req) => {
 *        const data = await someOperation();
 *        return Response.json({ success: true, data });
 *      });
 *
 * 3. ERROR CHAIN OPERATIONS
 *    ✅ Chain multiple async operations
 *    ✅ Short-circuit on first error
 *    ✅ Clear success/error paths
 *
 *    @example
 *      const result = await chain(
 *        () => fetchUser(id),
 *        (user) => fetchUserPosts(user.id),
 *        (posts) => enrichPosts(posts)
 *      );
 *
 * 4. TO-RESULT CONVERSION
 *    ✅ Convert thrown errors to Result type
 *    ✅ Combine try-catch with Result pattern
 *
 *    @example
 *      const result = await toResult(() => fetchUser(id));
 *      if (isOk(result)) {
 *        // Use result.value
 *      } else {
 *        // Use result.error
 *      }
 *
 * 5. SPECIFIC ERROR CLASSES
 *    ✅ Domain-specific errors with proper status codes
 *    ✅ Throw and let error boundary handle it
 *
 *    @example
 *      if (!user) {
 *        throw new NotFoundError('User');
 *      }
 *      if (!hasPermission) {
 *        throw new AuthorizationError();
 *      }
 */
