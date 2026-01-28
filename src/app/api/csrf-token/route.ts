/**
 * CSRF Token API Endpoint
 * 
 * Provides CSRF tokens to clients for form submissions and AJAX requests.
 * Call this endpoint to get a fresh CSRF token before making state-changing requests.
 * 
 * Usage:
 * ```typescript
 * const response = await fetch('/api/csrf-token');
 * const { token, headerName } = await response.json();
 * 
 * // Include token in subsequent requests
 * await fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     [headerName]: token,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */

import { NextResponse } from 'next/server';
import { createCsrfTokenResponse } from '@/lib/security/csrf';

export async function GET() {
  return createCsrfTokenResponse();
}

export const dynamic = 'force-dynamic';
