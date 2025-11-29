/**
 * Core Errors Module
 *
 * Standardized error handling for Unite-Hub/Synthex.
 *
 * @module core/errors
 *
 * @example
 * // Throw typed errors
 * import { NotFoundError, ValidationError } from '@/core/errors';
 *
 * throw new NotFoundError('Contact', contactId);
 * throw ValidationError.field('email', 'Invalid email format');
 *
 * @example
 * // Handle errors in routes
 * import { handleErrors, errorResponse } from '@/core/errors';
 *
 * export const GET = handleErrors(async (request) => {
 *   // Errors are automatically caught and formatted
 *   return NextResponse.json({ data });
 * });
 *
 * @example
 * // Result pattern for operations
 * import { toResult, ok, err } from '@/core/errors';
 *
 * const result = await toResult(() => fetchData());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */

// Types
export type {
  ErrorDomain,
  HttpStatus,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiResponse,
  ValidationErrorDetail,
  BaseErrorOptions,
} from './types';

export { HTTP_STATUS } from './types';

// Error classes
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  IntegrationError,
  RateLimitError,
  AgentError,
  BillingError,
  ConflictError,
} from './app-error';

// Error handlers
export {
  normalizeError,
  errorResponse,
  handleErrors,
  assert,
  assertDefined,
  tryCatch,
  ok,
  err,
  toResult,
  type Result,
} from './handler';
