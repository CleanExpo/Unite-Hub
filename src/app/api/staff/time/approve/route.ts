/**
 * POST /api/staff/time/approve
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Approves or rejects time entries.
 *
 * Request Body:
 * {
 *   entryId?: string (UUID) - For single approval/rejection;
 *   entryIds?: string[] - For bulk approval;
 *   action: 'approve' | 'reject';
 *   reason?: string - Required for rejection;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   entry?: TimeEntry (for single);
 *   count?: number (for bulk);
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Admin role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { approveEntry, rejectEntry, bulkApproveEntries } from '@/lib/services/staff/timeService';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let organizationId: string;

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

    // Get organization ID and verify admin role
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

    // Authorization: Must be owner or admin
    if (!['owner', 'admin'].includes(userOrgs.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin role required to approve/reject time entries' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { entryId, entryIds, action, reason } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    // Handle bulk approval
    if (entryIds && Array.isArray(entryIds)) {
      if (action === 'reject') {
        return NextResponse.json(
          { success: false, error: 'Bulk rejection is not supported. Use individual rejection.' },
          { status: 400 }
        );
      }

      const result = await bulkApproveEntries({
        entryIds,
        approvedBy: userId,
        organizationId,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        count: result.data?.count,
        message: result.message,
      });
    }

    // Handle single approval/rejection
    if (!entryId) {
      return NextResponse.json(
        { success: false, error: 'entryId or entryIds is required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const result = await approveEntry({
        entryId,
        approvedBy: userId,
        organizationId,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        entry: result.data,
        message: result.message,
      });
    } else {
      // Reject
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const result = await rejectEntry({
        entryId,
        rejectedBy: userId,
        organizationId,
        reason,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        entry: result.data,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('POST /api/staff/time/approve error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
