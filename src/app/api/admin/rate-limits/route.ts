/**
 * Admin Rate Limit Management
 *
 * Endpoints for managing rate limit overrides, blocked IPs, and analytics.
 * Requires ADMIN or FOUNDER role.
 *
 * @module api/admin/rate-limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/app/api/_middleware';
import { successResponse } from '@/app/api/_middleware/response';
import {
  createRateLimitOverride,
  blockIp,
  unblockIp,
  getRateLimitAnalytics,
} from '@/lib/services/rate-limit-service';
import type { RateLimitTier } from '@/core/security/types';

/**
 * GET /api/admin/rate-limits
 * Get rate limit analytics
 */
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tier = searchParams.get('tier') as RateLimitTier | null;
    const endpoint = searchParams.get('endpoint');

    const analytics = await getRateLimitAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      tier || undefined,
      endpoint || undefined
    );

    return successResponse({
      analytics,
      count: analytics.length,
    });
  },
  {
    auth: true,
    roles: ['ADMIN', 'FOUNDER'],
    rateLimit: 'admin',
  }
);

/**
 * POST /api/admin/rate-limits/override
 * Create a rate limit override
 */
export const POST = withApiHandler(
  async (request: NextRequest, { user }) => {
    const body = await request.json();

    const {
      clientKey,
      endpointPattern,
      workspaceId,
      tier,
      maxRequests,
      windowSeconds,
      reason,
      expiresAt,
    } = body;

    // Validate required fields
    if (!maxRequests || maxRequests < 1) {
      return NextResponse.json({ error: 'maxRequests is required and must be positive' }, { status: 400 });
    }

    if (!clientKey && !endpointPattern && !workspaceId) {
      return NextResponse.json(
        { error: 'At least one of clientKey, endpointPattern, or workspaceId is required' },
        { status: 400 }
      );
    }

    try {
      await createRateLimitOverride({
        clientKey,
        endpointPattern,
        workspaceId,
        tier,
        maxRequests,
        windowSeconds: windowSeconds || 60,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: user?.id,
      });

      return successResponse({
        message: 'Rate limit override created successfully',
      });
    } catch (error) {
      console.error('Error creating rate limit override:', error);
      return NextResponse.json({ error: 'Failed to create rate limit override' }, { status: 500 });
    }
  },
  {
    auth: true,
    roles: ['ADMIN', 'FOUNDER'],
    rateLimit: 'admin',
  }
);
