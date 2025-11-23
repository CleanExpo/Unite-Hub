/**
 * API Response Utilities - Standardized response format
 *
 * Source: docs/abacus/api-map.json
 * Purpose: Consistent API response patterns across 104+ endpoints
 */

import { NextResponse } from "next/server";

// Standard response types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes
export const ERROR_CODES = {
  // Authentication errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Authorization errors (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  WORKSPACE_ACCESS_DENIED: "WORKSPACE_ACCESS_DENIED",

  // Resource errors (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Validation errors (400)
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Conflict errors (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // Rate limiting (429)
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Create a success response
 */
export function success<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"]
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = {
      ...meta,
      timestamp: meta.timestamp || new Date().toISOString(),
    };
  }

  return NextResponse.json(response);
}

/**
 * Create a paginated success response
 */
export function paginated<T>(
  data: T[],
  options: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse<ApiSuccessResponse<T[]>> {
  return success(data, {
    page: options.page,
    limit: options.limit,
    total: options.total,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create an error response
 */
export function error(
  code: ErrorCode,
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

// Convenience error methods
export const errors = {
  unauthorized: (message = "Authentication required") =>
    error(ERROR_CODES.UNAUTHORIZED, message, 401),

  invalidToken: (message = "Invalid or expired token") =>
    error(ERROR_CODES.INVALID_TOKEN, message, 401),

  forbidden: (message = "Access denied") =>
    error(ERROR_CODES.FORBIDDEN, message, 403),

  workspaceAccessDenied: (message = "Workspace access denied") =>
    error(ERROR_CODES.WORKSPACE_ACCESS_DENIED, message, 403),

  notFound: (resource = "Resource") =>
    error(ERROR_CODES.NOT_FOUND, `${resource} not found`, 404),

  badRequest: (message = "Invalid request") =>
    error(ERROR_CODES.BAD_REQUEST, message, 400),

  validationError: (message: string, details?: unknown) =>
    error(ERROR_CODES.VALIDATION_ERROR, message, 400, details),

  missingField: (field: string) =>
    error(ERROR_CODES.MISSING_REQUIRED_FIELD, `Missing required field: ${field}`, 400),

  duplicate: (resource = "Resource") =>
    error(ERROR_CODES.DUPLICATE_ENTRY, `${resource} already exists`, 409),

  rateLimited: (message = "Too many requests") =>
    error(ERROR_CODES.RATE_LIMITED, message, 429),

  internal: (message = "Internal server error") =>
    error(ERROR_CODES.INTERNAL_ERROR, message, 500),

  database: (message = "Database error") =>
    error(ERROR_CODES.DATABASE_ERROR, message, 500),

  externalService: (service: string) =>
    error(ERROR_CODES.EXTERNAL_SERVICE_ERROR, `External service error: ${service}`, 502),
};

/**
 * Wrap an async handler with standard error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((err: unknown) => {
    console.error("API Error:", err);

    if (err instanceof Error) {
      // Check for specific error types
      if (err.message.includes("not found")) {
        return errors.notFound();
      }
      if (err.message.includes("unauthorized") || err.message.includes("auth")) {
        return errors.unauthorized();
      }
      if (err.message.includes("validation")) {
        return errors.validationError(err.message);
      }
    }

    return errors.internal();
  });
}

/**
 * Parse request body with validation
 */
export async function parseBody<T>(
  req: Request,
  validator?: (data: unknown) => data is T
): Promise<T> {
  try {
    const body = await req.json();

    if (validator && !validator(body)) {
      throw new Error("Invalid request body");
    }

    return body as T;
  } catch {
    throw new Error("Failed to parse request body");
  }
}

/**
 * Get query parameter with default
 */
export function getQueryParam(
  url: URL,
  key: string,
  defaultValue?: string
): string | undefined {
  return url.searchParams.get(key) || defaultValue;
}

/**
 * Get numeric query parameter
 */
export function getNumericParam(
  url: URL,
  key: string,
  defaultValue: number
): number {
  const value = url.searchParams.get(key);
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
