/**
 * API Test Helpers
 * Utilities for testing API routes
 */

import { NextRequest } from 'next/server';
import { TEST_SESSION } from './auth';

/**
 * Create mock NextRequest
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  searchParams?: Record<string, string>;
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3008/api/test',
    headers = {},
    body = null,
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const request = new NextRequest(urlObj.toString(), {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Create authenticated API request
 */
export function createAuthenticatedRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  searchParams?: Record<string, string>;
  token?: string;
} = {}): NextRequest {
  const { token = TEST_SESSION.access_token, ...restOptions } = options;

  return createMockRequest({
    ...restOptions,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Parse JSON response
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', text);
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

/**
 * Assert response status
 */
export function assertResponseStatus(response: Response, expectedStatus: number) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}: ${response.statusText}`
    );
  }
}

/**
 * Assert successful response (2xx)
 */
export function assertSuccess(response: Response) {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Expected success status, got ${response.status}: ${response.statusText}`);
  }
}

/**
 * Assert error response (4xx or 5xx)
 */
export function assertError(response: Response) {
  if (response.status < 400) {
    throw new Error(`Expected error status, got ${response.status}: ${response.statusText}`);
  }
}

/**
 * Mock fetch for API tests
 */
export function mockFetch(responseData: any, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  fn: () => Promise<Response>,
  maxAttempts = 10,
  delayMs = 100
): Promise<Response> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    try {
      const response = await fn();
      if (response.ok) {
        return response;
      }
      lastError = new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw lastError || new Error('API request timeout');
}

/**
 * Create mock API context
 */
export interface MockApiContext {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}

export function createMockApiContext(
  params: Record<string, string> = {},
  searchParams: Record<string, string> = {}
): MockApiContext {
  return { params, searchParams };
}

/**
 * Rate limit test helper
 * Makes multiple requests to test rate limiting
 */
export async function testRateLimit(
  makeRequest: () => Promise<Response>,
  expectedLimit: number
): Promise<{ allowedRequests: number; blockedRequests: number }> {
  let allowedRequests = 0;
  let blockedRequests = 0;

  // Make requests up to limit + 5 to ensure we hit the limit
  for (let i = 0; i < expectedLimit + 5; i++) {
    const response = await makeRequest();
    if (response.status === 429) {
      blockedRequests++;
    } else {
      allowedRequests++;
    }
  }

  return { allowedRequests, blockedRequests };
}

/**
 * Helper to extract error message from response
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await parseJsonResponse(response);
    return data.error || data.message || 'Unknown error';
  } catch {
    return await response.text();
  }
}

/**
 * Helper to create multipart form data for file uploads
 */
export function createFormData(fields: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}
