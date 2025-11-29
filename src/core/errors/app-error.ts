/**
 * Application Error Classes
 *
 * Custom error classes for consistent error handling across the application.
 *
 * @module core/errors/app-error
 */

import {
  ErrorDomain,
  HttpStatus,
  HTTP_STATUS,
  BaseErrorOptions,
  ValidationErrorDetail,
} from './types';

/**
 * Base application error
 *
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: HttpStatus;
  public readonly domain: ErrorDomain;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly timestamp: Date;

  constructor(options: BaseErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status;
    this.domain = options.domain;
    this.details = options.details;
    this.cause = options.cause;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Convert to JSON for API response
   */
  toJSON(): {
    code: string;
    message: string;
    domain: ErrorDomain;
    details?: Record<string, unknown>;
    stack?: string;
  } {
    return {
      code: this.code,
      message: this.message,
      domain: this.domain,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    code: string = 'AUTH_REQUIRED',
    details?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      status: HTTP_STATUS.UNAUTHORIZED,
      domain: 'AUTH',
      details,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    code: string = 'ACCESS_DENIED',
    details?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      status: HTTP_STATUS.FORBIDDEN,
      domain: 'AUTH',
      details,
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(
    errors: ValidationErrorDetail[],
    message: string = 'Validation failed'
  ) {
    super({
      code: 'VALIDATION_FAILED',
      message,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      domain: 'VALIDATION',
      details: { errors },
    });
    this.name = 'ValidationError';
    this.errors = errors;
  }

  /**
   * Create from a single field error
   */
  static field(field: string, message: string, value?: unknown): ValidationError {
    return new ValidationError([{ field, message, value }]);
  }

  /**
   * Create from multiple field errors
   */
  static fields(errors: Array<{ field: string; message: string }>): ValidationError {
    return new ValidationError(errors);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(
    resourceType: string,
    resourceId?: string,
    message?: string
  ) {
    super({
      code: 'NOT_FOUND',
      message: message || `${resourceType}${resourceId ? ` with ID ${resourceId}` : ''} not found`,
      status: HTTP_STATUS.NOT_FOUND,
      domain: 'DATABASE',
      details: { resourceType, resourceId },
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: string = 'DATABASE_ERROR',
    cause?: Error,
    details?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      domain: 'DATABASE',
      cause,
      details,
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Integration error (external services)
 */
export class IntegrationError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    code?: string,
    cause?: Error,
    details?: Record<string, unknown>
  ) {
    super({
      code: code || `${service.toUpperCase()}_ERROR`,
      message,
      status: HTTP_STATUS.BAD_GATEWAY,
      domain: 'INTEGRATION',
      cause,
      details: { service, ...details },
    });
    this.name = 'IntegrationError';
    this.service = service;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, message?: string) {
    super({
      code: 'RATE_LIMITED',
      message: message || 'Too many requests. Please try again later.',
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      domain: 'RATE_LIMIT',
      details: { retryAfter },
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Agent error (AI agent operations)
 */
export class AgentError extends AppError {
  public readonly agentName: string;

  constructor(
    agentName: string,
    message: string,
    code?: string,
    cause?: Error,
    details?: Record<string, unknown>
  ) {
    super({
      code: code || 'AGENT_ERROR',
      message,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      domain: 'AGENT',
      cause,
      details: { agentName, ...details },
    });
    this.name = 'AgentError';
    this.agentName = agentName;
  }
}

/**
 * Billing error
 */
export class BillingError extends AppError {
  constructor(
    message: string,
    code: string = 'BILLING_ERROR',
    details?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      status: HTTP_STATUS.FORBIDDEN,
      domain: 'BILLING',
      details,
    });
    this.name = 'BillingError';
  }
}

/**
 * Conflict error (e.g., duplicate resources)
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    code: string = 'CONFLICT',
    details?: Record<string, unknown>
  ) {
    super({
      code,
      message,
      status: HTTP_STATUS.CONFLICT,
      domain: 'DATABASE',
      details,
    });
    this.name = 'ConflictError';
  }
}
