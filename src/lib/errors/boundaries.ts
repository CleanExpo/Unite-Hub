/**
 * Error Boundaries - Explicit Error Handling for API Routes
 *
 * Wraps API handler functions to catch errors and return standardized responses.
 * Eliminates try-catch boilerplate while ensuring all errors are handled.
 *
 * Pattern:
 * 1. Wrap async handler with withErrorBoundary()
 * 2. Handler returns Response (success) or throws Error (failure)
 * 3. Boundary catches error and converts to standardized API response
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Result, ApiError } from './result';
import { createApiError, ErrorCodes, err } from './result';

 
type Response = {};  // Use NextResponse in implementation

/**
 * Type for API handler function
 */
export type ApiHandler = (
  req: NextRequest
) => Promise<Response | NextResponse>;

/**
 * Error boundary that wraps API handlers
 *
 * @example
 *   export const POST = withErrorBoundary(async (req) => {
 *     const data = await someOperation();
 *     return Response.json({ success: true, data });
 *   });
 *
 *   // Errors are automatically caught and converted to API errors
 */
export function withErrorBoundary(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      const apiError = normalizeError(error);
      return errorResponse(apiError);
    }
  };
}

/**
 * Error boundary with custom error handler
 *
 * @example
 *   export const POST = withErrorBoundaryCustom(
 *     async (req) => {
 *       const data = await someOperation();
 *       return Response.json({ success: true, data });
 *     },
 *     (error, req) => {
 *       // Custom logging
 *       logger.error('API error', { error, path: req.nextUrl.pathname });
 *       // Custom error transformation
 *       return normalizeError(error);
 *     }
 *   );
 */
export function withErrorBoundaryCustom(
  handler: ApiHandler,
  onError: (error: unknown, req: NextRequest) => ApiError
): ApiHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      const apiError = onError(error, req);
      return errorResponse(apiError);
    }
  };
}

/**
 * Error boundary for parallel operations
 *
 * @example
 *   export const POST = withParallelErrorBoundary(async (req) => {
 *     const [users, campaigns, contacts] = await Promise.all([
 *       fetchUsers(),
 *       fetchCampaigns(),
 *       fetchContacts(),
 *     ]);
 *     return Response.json({ users, campaigns, contacts });
 *   });
 *
 *   // If any promise rejects, error is caught and handled
 */
export function withParallelErrorBoundary(handler: ApiHandler): ApiHandler {
  return withErrorBoundary(handler);
}

/**
 * Normalize any error to ApiError format
 *
 * @example
 *   const error = new Error('Something went wrong');
 *   const apiError = normalizeError(error);
 *   // { code: 'INTERNAL_SERVER_ERROR', status: 500, message: '...' }
 */
export function normalizeError(error: unknown): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return createApiError(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500,
      error.message
    );
  }

  // String error
  if (typeof error === 'string') {
    return createApiError(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500,
      error
    );
  }

  // Unknown error type
  return createApiError(
    ErrorCodes.INTERNAL_SERVER_ERROR,
    500,
    'An unexpected error occurred'
  );
}

/**
 * Check if value is ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'status' in value &&
    'message' in value &&
    'timestamp' in value
  );
}

/**
 * Convert API error to HTTP response
 */
export function errorResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      },
    },
    { status: error.status }
  );
}

/**
 * Success response helper (for consistency)
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// ============================================================================
// SPECIFIC ERROR TYPES & FACTORIES
// ============================================================================

/**
 * Validation error
 */
export class ValidationError extends Error {
  readonly code = ErrorCodes.VALIDATION_ERROR;
  readonly status = 400;

  constructor(
    message: string,
    public details: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends Error {
  readonly code = ErrorCodes.AUTHENTICATION_ERROR;
  readonly status = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends Error {
  readonly code = ErrorCodes.FORBIDDEN;
  readonly status = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends Error {
  readonly code = ErrorCodes.NOT_FOUND;
  readonly status = 404;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (duplicate, constraint violation)
 */
export class ConflictError extends Error {
  readonly code = ErrorCodes.CONFLICT;
  readonly status = 409;

  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Database error
 */
export class DatabaseError extends Error {
  readonly code = ErrorCodes.DATABASE_ERROR;
  readonly status = 500;

  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Workspace error
 */
export class WorkspaceError extends Error {
  readonly code = ErrorCodes.WORKSPACE_ERROR;
  readonly status = 400;

  constructor(message: string = 'Invalid workspace') {
    super(message);
    this.name = 'WorkspaceError';
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends Error {
  readonly code = ErrorCodes.SERVICE_UNAVAILABLE;
  readonly status = 503;

  constructor(
    service: string = 'Service',
    message?: string
  ) {
    super(message || `${service} is temporarily unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends Error {
  readonly code = ErrorCodes.TIMEOUT;
  readonly status = 504;

  constructor(operation: string = 'Operation') {
    super(`${operation} timed out`);
    this.name = 'TimeoutError';
  }
}

/**
 * Extract code and status from error for response
 */
export function getErrorCodeAndStatus(
  error: unknown
): { code: string; status: number } {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'status' in error
  ) {
    return {
      code: String(error.code),
      status: Number(error.status),
    };
  }

  return {
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    status: 500,
  };
}

// ============================================================================
// MIDDLEWARE FOR ERROR HANDLING
// ============================================================================

/**
 * Convert thrown errors to Result<T, E>
 *
 * @example
 *   const result = await toResult(async () => {
 *     const user = await fetchUser(id);
 *     return user;
 *   });
 *
 *   if (isOk(result)) {
 *     // Use result.value
 *   } else {
 *     // Use result.error
 *   }
 */
export async function toResult<T>(
  fn: () => Promise<T>
): Promise<Result<T, ApiError>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    const apiError = normalizeError(error);
    return err(apiError);
  }
}

/**
 * Chain multiple operations with error handling
 *
 * @example
 *   const result = await chainOperations(
 *     () => fetchUser(id),
 *     (user) => fetchUserPosts(user.id),
 *     (posts) => enrichPosts(posts)
 *   );
 */
 
export async function chainOperations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...fns: Array<(value: any) => Promise<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Result<any, ApiError>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = await fns[0]();

    for (let i = 1; i < fns.length; i++) {
      value = await fns[i](value);
    }

    return { ok: true, value };
  } catch (error) {
    const apiError = normalizeError(error);
    return err(apiError);
  }
}
