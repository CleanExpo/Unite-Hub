import { NextResponse } from 'next/server';
import { ApiError, toApiError } from '@/lib/errors';
import { securityLog } from '@/lib/logger';

/**
 * Global error handler for API routes
 * Converts all errors to RFC 7807 Problem Details format
 */
export function handleApiError(error: unknown, route?: string): NextResponse {
  const apiError = toApiError(error, route);
  const { problemDetail } = apiError;

  // Log security events for 4xx errors
  if (problemDetail.status >= 400 && problemDetail.status < 500) {
    const severity = problemDetail.status === 401 || problemDetail.status === 403 ? 'medium' : 'low';
    securityLog(`API Error: ${problemDetail.title}`, severity, {
      route,
      status: problemDetail.status,
      detail: problemDetail.detail,
    });
  }

  // Log all 5xx errors as critical
  if (problemDetail.status >= 500) {
    securityLog(`Server Error: ${problemDetail.title}`, 'critical', {
      route,
      status: problemDetail.status,
      detail: problemDetail.detail,
    });
  }

  return NextResponse.json(problemDetail, {
    status: problemDetail.status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T>(
  handler: (req: Request) => Promise<NextResponse>,
  route?: string
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error, route || req.url);
    }
  };
}
