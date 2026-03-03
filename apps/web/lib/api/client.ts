/**
 * API Client for FastAPI Backend
 *
 * Replaces Supabase client with direct fetch calls to FastAPI.
 * Handles JWT authentication via cookies, request timeout,
 * and exponential backoff retry for transient failures.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export interface ApiError {
  detail: string;
  error_code?: string;
  request_id?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Get JWT token from cookies (browser-side)
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find((c) => c.startsWith('auth_token='));

  if (!tokenCookie) return null;

  return tokenCookie.split('=')[1];
}

/**
 * Determine whether a status code is retryable (5xx server errors)
 */
function isRetryable(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt a single token refresh via the server-side route.
 * Returns true if the refresh succeeded and the caller should retry.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Make an authenticated API request with timeout and retry
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retriesLeft = MAX_RETRIES,
  didRefresh = false,
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 — attempt token refresh once
    if (response.status === 401 && !didRefresh) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return fetchApi<T>(endpoint, options, retriesLeft, true);
      }
      // Refresh failed — redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiClientError('Session expired', 401);
    }

    // Retry on 5xx with exponential backoff
    if (isRetryable(response.status) && retriesLeft > 0) {
      const delay = RETRY_BASE_MS * 2 ** (MAX_RETRIES - retriesLeft);
      await sleep(delay);
      return fetchApi<T>(endpoint, options, retriesLeft - 1, didRefresh);
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));

      throw new ApiClientError(
        error.detail,
        response.status,
        error.error_code,
        error.request_id,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    // Re-throw ApiClientError as-is
    if (err instanceof ApiClientError) throw err;

    // Wrap AbortError (timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError('Request timed out', 408, 'TIMEOUT');
    }

    throw new ApiClientError(
      err instanceof Error ? err.message : 'Network error',
      0,
      'NETWORK_ERROR',
    );
  }
}

/**
 * API Client - Browser-side
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Create a browser client (for compatibility with existing code)
 */
export function createClient() {
  return apiClient;
}
