/**
 * Result<T, E> Pattern - Railway-Oriented Programming
 *
 * Implements explicit error handling using discriminated unions.
 * Eliminates null/undefined returns and forces error handling.
 *
 * Pattern:
 * 1. Function returns Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
 * 2. Caller checks result.ok before accessing value/error
 * 3. Type system prevents accessing value when ok=false
 *
 * Benefits:
 * - Errors are explicit in return type (not hidden)
 * - Compiler prevents "forgot to handle error" bugs
 * - Enables method chaining with map/flatMap
 * - Clear success/failure paths
 */

/**
 * Success result
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Error result
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * Result type: either success (Ok) or failure (Err)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create successful result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create error result
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Check if result is success
 * @example
 *   if (isOk(result)) {
 *     console.log(result.value); // Type is T
 *   }
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

/**
 * Check if result is error
 * @example
 *   if (isErr(result)) {
 *     console.error(result.error); // Type is E
 *   }
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

/**
 * Transform success value (functor map)
 * @example
 *   const result = await fetchUser(id);
 *   const mapped = mapOk(result, user => user.email);
 *   // mapped: Result<string, Error>
 */
export function mapOk<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/**
 * Transform error value
 * @example
 *   const result = await fetchUser(id);
 *   const mapped = mapErr(result, err => new AppError(err.message));
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/**
 * Chain operations (monadic flatMap)
 * @example
 *   const result = await fetchUser(id);
 *   const chained = flatMapOk(result, user =>
 *     fetchUserPosts(user.id)
 *   );
 *   // Flattens Result<Result<Posts, E>, E> to Result<Posts, E>
 */
export function flatMapOk<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/**
 * Chain error recovery
 * @example
 *   const result = await fetchUser(id);
 *   const recovered = flatMapErr(result, error =>
 *     fetchUserFromCache(id) // Try fallback
 *   );
 */
export function flatMapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return isErr(result) ? fn(result.error) : result;
}

/**
 * Extract value or provide default
 * @example
 *   const email = unwrapOr(result, 'unknown@example.com');
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Extract value or throw error
 * @example
 *   const user = unwrapOrThrow(result, 'User not found');
 *   // If result is Err, throws result.error
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
return result.value;
}
  throw result.error;
}

/**
 * Convert Result to Promise
 * @example
 *   const promise = resultToPromise(result);
 *   // Resolves with value if Ok, rejects with error if Err
 */
export function resultToPromise<T, E extends Error>(
  result: Result<T, E>
): Promise<T> {
  return isOk(result)
    ? Promise.resolve(result.value)
    : Promise.reject(result.error);
}

/**
 * Combine multiple results (all-or-nothing)
 * @example
 *   const r1 = ok(1);
 *   const r2 = ok(2);
 *   const combined = combineResults([r1, r2]);
 *   // Ok: [1, 2]
 */
export function combineResults<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
}

/**
 * Run effect on success without changing value
 * @example
 *   const result = await fetchUser(id);
 *   const logged = tapOk(result, user => console.log(user));
 *   // Logs user, returns same result
 */
export function tapOk<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> {
  if (isOk(result)) {
    fn(result.value);
  }
  return result;
}

/**
 * Run effect on error without changing result
 * @example
 *   const result = await fetchUser(id);
 *   const logged = tapErr(result, error => logger.error(error));
 */
export function tapErr<T, E>(
  result: Result<T, E>,
  fn: (error: E) => void
): Result<T, E> {
  if (isErr(result)) {
    fn(result.error);
  }
  return result;
}

/**
 * Pattern match on result
 * @example
 *   const message = match(result, {
 *     ok: (user) => `Welcome ${user.name}`,
 *     err: (error) => `Error: ${error.message}`,
 *   });
 */
export function match<T, E, A, B>(
  result: Result<T, E>,
  {
    ok: onOk,
    err: onErr,
  }: {
    ok: (value: T) => A;
    err: (error: E) => B;
  }
): A | B {
  return isOk(result) ? onOk(result.value) : onErr(result.error);
}

// ============================================================================
// API-SPECIFIC ERROR TYPES
// ============================================================================

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  status: number;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
}

/**
 * Create API error
 */
export function createApiError(
  code: string,
  status: number,
  message: string,
  details?: Record<string, string>
): ApiError {
  return {
    code,
    status,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Custom
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  WORKSPACE_ERROR: 'WORKSPACE_ERROR',
} as const;

// ============================================================================
// CONVERSION FROM LEGACY PATTERNS
// ============================================================================

/**
 * Convert try-catch to Result
 * @example
 *   const result = await tryCatch(() => fetchUser(id));
 *   if (isOk(result)) {
 *     // Use result.value
 *   }
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return err(err);
  }
}

/**
 * Wraps function returning Result
 * @example
 *   const safeFetchUser = resultify(async (id: string) => {
 *     const response = await fetch(`/api/users/${id}`);
 *     return response.json();
 *   });
 *
 *   const result = await safeFetchUser('123');
 *   if (isOk(result)) {
 *     // Use result.value
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resultify<Args extends any[], T>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<Result<T, Error>> {
  return async (...args: Args) => {
    return tryCatch(() => fn(...args));
  };
}
