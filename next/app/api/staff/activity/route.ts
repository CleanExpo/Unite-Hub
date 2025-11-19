/**
 * Staff Activity Logs API Route - Phase 2
 * GET /api/staff/activity - Get activity logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth, getUserId, hasRole } from '@/next/core/middleware/auth';
import { supabaseStaff } from '@/next/core/auth/supabase';

export const GET = withStaffAuth(async (req) => {
  try {
    const userId = getUserId(req);
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const isAdmin = hasRole(req, 'founder') || hasRole(req, 'admin');

    let query = supabaseStaff
      .from('staff_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Non-admins can only see their own logs
    if (!isAdmin && userId) {
      query = query.eq('staff_id', userId);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Failed to fetch activity logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
