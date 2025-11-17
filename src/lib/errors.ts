/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 */

export interface ProblemDetail {
  type: string; // URI reference identifying the problem type
  title: string; // Short, human-readable summary
  status: number; // HTTP status code
  detail?: string; // Human-readable explanation specific to this occurrence
  instance?: string; // URI reference identifying this specific occurrence
  [key: string]: any; // Additional problem-specific fields
}

export class ApiError extends Error {
  public readonly problemDetail: ProblemDetail;

  constructor(problemDetail: ProblemDetail) {
    super(problemDetail.title);
    this.name = 'ApiError';
    this.problemDetail = problemDetail;
  }

  toJSON(): ProblemDetail {
    return this.problemDetail;
  }
}

// Common error types
export const ErrorTypes = {
  // 4xx Client Errors
  BAD_REQUEST: 'https://unite-hub.com/errors/bad-request',
  UNAUTHORIZED: 'https://unite-hub.com/errors/unauthorized',
  FORBIDDEN: 'https://unite-hub.com/errors/forbidden',
  NOT_FOUND: 'https://unite-hub.com/errors/not-found',
  CONFLICT: 'https://unite-hub.com/errors/conflict',
  VALIDATION_ERROR: 'https://unite-hub.com/errors/validation',
  RATE_LIMIT: 'https://unite-hub.com/errors/rate-limit',

  // 5xx Server Errors
  INTERNAL_ERROR: 'https://unite-hub.com/errors/internal',
  SERVICE_UNAVAILABLE: 'https://unite-hub.com/errors/service-unavailable',
  DATABASE_ERROR: 'https://unite-hub.com/errors/database',
  EXTERNAL_API_ERROR: 'https://unite-hub.com/errors/external-api',
};

// Error factory functions
export function badRequest(detail: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.BAD_REQUEST,
    title: 'Bad Request',
    status: 400,
    detail,
    instance,
  });
}

export function unauthorized(detail: string = 'Authentication required', instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.UNAUTHORIZED,
    title: 'Unauthorized',
    status: 401,
    detail,
    instance,
  });
}

export function forbidden(detail: string = 'Access denied', instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.FORBIDDEN,
    title: 'Forbidden',
    status: 403,
    detail,
    instance,
  });
}

export function notFound(resource: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.NOT_FOUND,
    title: 'Not Found',
    status: 404,
    detail: `${resource} not found`,
    instance,
  });
}

export function conflict(detail: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.CONFLICT,
    title: 'Conflict',
    status: 409,
    detail,
    instance,
  });
}

export function validationError(errors: Record<string, string[]>, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.VALIDATION_ERROR,
    title: 'Validation Error',
    status: 422,
    detail: 'Input validation failed',
    instance,
    errors,
  });
}

export function rateLimitExceeded(retryAfter: number, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.RATE_LIMIT,
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: `Too many requests. Please retry after ${retryAfter} seconds.`,
    instance,
    retryAfter,
  });
}

export function internalError(detail: string = 'Internal server error', instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.INTERNAL_ERROR,
    title: 'Internal Server Error',
    status: 500,
    detail,
    instance,
  });
}

export function serviceUnavailable(detail: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.SERVICE_UNAVAILABLE,
    title: 'Service Unavailable',
    status: 503,
    detail,
    instance,
  });
}

export function databaseError(operation: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.DATABASE_ERROR,
    title: 'Database Error',
    status: 500,
    detail: `Database operation failed: ${operation}`,
    instance,
  });
}

export function externalApiError(service: string, instance?: string): ApiError {
  return new ApiError({
    type: ErrorTypes.EXTERNAL_API_ERROR,
    title: 'External API Error',
    status: 502,
    detail: `External service error: ${service}`,
    instance,
  });
}

// Helper to convert any error to ApiError
export function toApiError(error: unknown, instance?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return internalError(error.message, instance);
  }

  return internalError(String(error), instance);
}
