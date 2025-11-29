/**
 * Error Handler
 *
 * Centralized error handling for API routes.
 *
 * @module core/errors/handler
 */

import { NextResponse } from 'next/server';
import { AppError } from './app-error';
import { HTTP_STATUS, ApiErrorResponse } from './types';

/**
 * Convert any error to AppError format
 */
export function normalizeError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError({
      code: 'INTERNAL_ERROR',
      message: error.message,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      domain: 'INTERNAL',
      cause: error,
    });
  }

  // String error
  if (typeof error === 'string') {
    return new AppError({
      code: 'INTERNAL_ERROR',
      message: error,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      domain: 'INTERNAL',
    });
  }

  // Unknown error type
  return new AppError({
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    domain: 'INTERNAL',
    details: { originalError: String(error) },
  });
}

/**
 * Create error response for API routes
 */
export function errorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  const appError = normalizeError(error);

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${appError.domain}] ${appError.code}:`, appError.message);
    if (appError.cause) {
      console.error('Caused by:', appError.cause);
    }
  }

  // Log critical errors in production
  if (
    process.env.NODE_ENV === 'production' &&
    appError.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    console.error(JSON.stringify({
      level: 'error',
      code: appError.code,
      message: appError.message,
      domain: appError.domain,
      timestamp: appError.timestamp.toISOString(),
      stack: appError.stack,
    }));
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: appError.toJSON(),
    },
    { status: appError.status }
  );
}

/**
 * Try-catch wrapper for API route handlers
 *
 * @example
 * export const GET = handleErrors(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * });
 */
export function handleErrors<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  }) as T;
}

/**
 * Assert condition or throw error
 */
export function assert(
  condition: unknown,
  error: AppError | string
): asserts condition {
  if (!condition) {
    if (typeof error === 'string') {
      throw new AppError({
        code: 'ASSERTION_FAILED',
        message: error,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        domain: 'INTERNAL',
      });
    }
    throw error;
  }
}

/**
 * Assert value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  assert(value != null, message);
}

/**
 * Wrap async function with error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  onError?: (error: AppError) => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const appError = normalizeError(error);
    if (onError) {
      return onError(appError);
    }
    throw appError;
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create error result
 */
export function err<E = AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Execute function and return Result
 */
export async function toResult<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(normalizeError(error));
  }
}
