/**
 * Core Error Types
 *
 * Standardized error types and codes for the entire application.
 *
 * @module core/errors/types
 */

/**
 * Error domains for categorization
 */
export type ErrorDomain =
  | 'AUTH'
  | 'DATABASE'
  | 'VALIDATION'
  | 'INTEGRATION'
  | 'AGENT'
  | 'BILLING'
  | 'RATE_LIMIT'
  | 'INTERNAL';

/**
 * HTTP status codes mapped to error types
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

/**
 * Error response format for API routes
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    domain?: ErrorDomain;
    details?: Record<string, unknown>;
    stack?: string;  // Only in development
  };
}

/**
 * Success response format for API routes
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

/**
 * Unified API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

/**
 * Base error options
 */
export interface BaseErrorOptions {
  code: string;
  message: string;
  status: HttpStatus;
  domain: ErrorDomain;
  cause?: Error;
  details?: Record<string, unknown>;
}
