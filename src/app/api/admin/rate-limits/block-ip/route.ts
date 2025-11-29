/**
 * Admin IP Blocking
 *
 * Endpoints for blocking and unblocking IP addresses.
 * Requires ADMIN or FOUNDER role.
 *
 * @module api/admin/rate-limits/block-ip
 */

import { NextRequest } from 'next/server';
import { withApiHandler } from '@/app/api/_middleware';
import { successResponse, errorResponse } from '@/app/api/_middleware/response';
import { blockIp, unblockIp } from '@/lib/services/rate-limit-service';

/**
 * POST /api/admin/rate-limits/block-ip
 * Block an IP address
 */
export const POST = withApiHandler(
  async (request: NextRequest, { user }) => {
    const body = await request.json();
    const { ip, reason, duration } = body;

    // Validate required fields
    if (!ip) {
      return errorResponse('ip is required', 400);
    }

    if (!reason) {
      return errorResponse('reason is required', 400);
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return errorResponse('Invalid IP address format', 400);
    }

    try {
      await blockIp(ip, reason, user!.id, duration);

      return successResponse({
        message: `IP ${ip} has been blocked`,
        ip,
        reason,
        duration: duration || 'permanent',
      });
    } catch (error) {
      console.error('Error blocking IP:', error);
      return errorResponse('Failed to block IP address', 500);
    }
  },
  {
    auth: true,
    roles: ['ADMIN', 'FOUNDER'],
    rateLimit: 'admin',
  }
);

/**
 * DELETE /api/admin/rate-limits/block-ip
 * Unblock an IP address
 */
export const DELETE = withApiHandler(
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const ip = searchParams.get('ip');

    // Validate required fields
    if (!ip) {
      return errorResponse('ip parameter is required', 400);
    }

    try {
      await unblockIp(ip);

      return successResponse({
        message: `IP ${ip} has been unblocked`,
        ip,
      });
    } catch (error) {
      console.error('Error unblocking IP:', error);
      return errorResponse('Failed to unblock IP address', 500);
    }
  },
  {
    auth: true,
    roles: ['ADMIN', 'FOUNDER'],
    rateLimit: 'admin',
  }
);
