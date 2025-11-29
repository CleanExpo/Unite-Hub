/**
 * Test Rate Limit Endpoint
 *
 * Example endpoint demonstrating rate limiting integration.
 * Uses withApiHandler with rate limiting enabled.
 *
 * @module api/test-rate-limit
 */

import { NextRequest } from 'next/server';
import { withApiHandler } from '@/app/api/_middleware';
import { successResponse } from '@/app/api/_middleware/response';

/**
 * Test endpoint with staff tier rate limiting (100/min)
 */
export const GET = withApiHandler(
  async (request: NextRequest) => {
    return successResponse({
      message: 'Rate limit test successful',
      timestamp: new Date().toISOString(),
    });
  },
  {
    rateLimit: 'staff', // 100 requests per minute
  }
);

/**
 * Test endpoint with public tier rate limiting (10/min)
 * No authentication required
 */
export const POST = withApiHandler(
  async (request: NextRequest) => {
    return successResponse({
      message: 'Public rate limit test successful',
      timestamp: new Date().toISOString(),
    });
  },
  {
    rateLimit: 'public', // 10 requests per minute
  }
);
