/**
 * Error Handling Utility
 * Centralized error handling and logging for API routes
 */

import { NextRequest, NextResponse } from "next/server";

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Error types for different scenarios
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class TierLimitError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 403, "TIER_LIMIT_EXCEEDED", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: unknown): NextResponse {
  // Log error for debugging
  console.error("API Error:", error);

  // Handle AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Database errors
    if (error.message.includes("PGRST")) {
      return NextResponse.json(
        {
          error: "Database error",
          code: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    // Network errors
    if (
      error.message.includes("fetch") ||
      error.message.includes("network")
    ) {
      return NextResponse.json(
        {
          error: "Network error",
          code: "NETWORK_ERROR",
        },
        { status: 503 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(
  handler: (request: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: Record<string, unknown>): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null
  );

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`, {
      missing,
    });
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Log error to external service (implement as needed)
 */
export async function logError(
  error: Error | AppError,
  context?: Record<string, unknown>
): Promise<void> {
  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  console.error("Error logged:", {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Implement external error tracking
  // await sentryClient.captureException(error, { context });
}
