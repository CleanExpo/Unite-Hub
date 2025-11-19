/**
 * GET /api/staff/time/entries
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Lists time entries with optional filters.
 *
 * Query Parameters:
 * - staffId?: UUID (if not provided, returns current user's entries)
 * - projectId?: string
 * - taskId?: string
 * - startDate?: YYYY-MM-DD
 * - endDate?: YYYY-MM-DD
 * - status?: pending | approved | rejected | billed
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * {
 *   success: boolean;
 *   entries?: TimeEntry[];
 *   totalHours?: number;
 *   totalAmount?: number;
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Can view own entries or all entries if admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getTimeEntries } from '@/lib/services/staff/timeService';

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let organizationId: string;
    let userRole: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // Get organization ID and role
    const supabase = await getSupabaseServer();
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!userOrgs) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 400 }
      );
    }

    organizationId = userOrgs.organization_id;
    userRole = userOrgs.role;

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authorization: If requesting another staff's entries, must be admin
    const requestedStaffId = staffId || userId;
    if (requestedStaffId !== userId && !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view other staff entries' },
        { status: 403 }
      );
    }

    // Get entries using service layer
    const result = await getTimeEntries({
      staffId: requestedStaffId,
      organizationId,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status as any,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: result.entries,
      totalHours: result.totalHours,
      totalAmount: result.totalAmount,
      message: result.message,
    });
  } catch (error) {
    console.error('GET /api/staff/time/entries error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
