/**
 * Result type for type-safe error handling
 * Replaces try/catch with explicit success/failure types
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

// Constructor functions
export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

export function err<E>(error: E): Failure<E> {
  return { success: false, error };
}

// Type guards
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

// Utility functions
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}

export async function fromPromise<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Example usage:
// async function fetchUser(id: string): Promise<Result<User, FetchError>> {
//   const result = await fromPromise(fetch(`/api/users/${id}`));
//   if (isFailure(result)) {
//     return err({ type: 'network_error', message: result.error.message });
//   }
//   return ok(await result.data.json());
// }
