/**
 * Get Current Staff User API Route - Phase 2
 * GET /api/staff/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth } from '@/next/core/middleware/auth';

export const GET = withStaffAuth(async (req) => {
  try {
    return NextResponse.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get staff user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
});
