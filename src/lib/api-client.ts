/**
 * Authenticated API Client
 *
 * Utility functions for making authenticated API requests from the client.
 * Automatically includes Bearer token and handles common error cases.
 *
 * @module api-client
 */

import { supabaseBrowser } from './supabase';

/**
 * Error thrown when API request fails
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make an authenticated API request
 * Automatically includes Bearer token from Supabase session
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response object
 * @throws APIError if request fails
 *
 * @example
 * ```typescript
 * const response = await authenticatedFetch('/api/contacts', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John Doe' }),
 * });
 * const data = await response.json();
 * ```
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current session
  const { data: { session }, error } = await supabaseBrowser.auth.getSession();

  if (error || !session) {
    throw new APIError('Not authenticated - please log in', 401);
  }

  // Make request with Bearer token
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  // Handle common error cases
  if (response.status === 401) {
    throw new APIError('Authentication required - session may have expired', 401);
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Insufficient permissions for this action',
      403,
      data
    );
  }

  if (response.status === 404) {
    throw new APIError('Resource not found', 404);
  }

  if (response.status >= 500) {
    throw new APIError('Server error - please try again later', response.status);
  }

  return response;
}

/**
 * Make authenticated GET request and parse JSON response
 *
 * @param url - API endpoint URL
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const contacts = await apiGet('/api/contacts');
 * ```
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: 'GET' });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Make authenticated POST request and parse JSON response
 *
 * @param url - API endpoint URL
 * @param body - Request body (will be JSON stringified)
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const contact = await apiPost('/api/contacts', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Make authenticated PUT request and parse JSON response
 *
 * @param url - API endpoint URL
 * @param body - Request body (will be JSON stringified)
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const updated = await apiPut('/api/contacts/123', {
 *   name: 'Jane Doe'
 * });
 * ```
 */
export async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Make authenticated PATCH request and parse JSON response
 *
 * @param url - API endpoint URL
 * @param body - Request body (will be JSON stringified)
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const updated = await apiPatch('/api/contacts/123', {
 *   status: 'active'
 * });
 * ```
 */
export async function apiPatch<T = any>(url: string, body?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Make authenticated DELETE request and parse JSON response
 *
 * @param url - API endpoint URL
 * @param body - Optional request body (will be JSON stringified)
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * await apiDelete('/api/contacts/123');
 * // Or with body:
 * await apiDelete('/api/contacts/delete', { contactId: '123' });
 * ```
 */
export async function apiDelete<T = any>(url: string, body?: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Upload file with authentication
 *
 * @param url - API endpoint URL
 * @param file - File to upload
 * @param additionalData - Additional form data fields
 * @returns Parsed JSON response
 *
 * @example
 * ```typescript
 * const file = document.getElementById('file').files[0];
 * const result = await apiUpload('/api/upload', file, {
 *   contactId: '123'
 * });
 * ```
 */
export async function apiUpload<T = any>(
  url: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<T> {
  // Get session
  const { data: { session }, error } = await supabaseBrowser.auth.getSession();

  if (error || !session) {
    throw new APIError('Not authenticated - please log in', 401);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  // Make request (don't set Content-Type - browser will set it with boundary)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    throw new APIError('Authentication required - session may have expired', 401);
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Insufficient permissions for this action',
      403,
      data
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(
      data.error || 'Upload failed',
      response.status,
      data
    );
  }

  return response.json();
}

/**
 * Handle API errors gracefully
 * Can be used in try-catch blocks
 *
 * @param error - Error object
 * @param defaultMessage - Default error message
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await apiDelete('/api/contacts/123');
 * } catch (error) {
 *   const message = handleAPIError(error, 'Failed to delete contact');
 *   toast.error(message);
 * }
 * ```
 */
export function handleAPIError(
  error: unknown,
  defaultMessage = 'An error occurred'
): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Check if error is authentication error
 *
 * @param error - Error object
 * @returns true if authentication error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof APIError && error.status === 401;
}

/**
 * Check if error is permission error
 *
 * @param error - Error object
 * @returns true if permission error
 */
export function isPermissionError(error: unknown): boolean {
  return error instanceof APIError && error.status === 403;
}
