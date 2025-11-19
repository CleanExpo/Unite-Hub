/**
 * POST /api/staff/time/xero-sync
 * Phase 3 Step 8 - Priority 2
 *
 * Syncs approved time entries to Xero (STUB IMPLEMENTATION).
 *
 * Request Body:
 * {
 *   entryIds: string[] (UUIDs) - Time entry IDs to sync;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   syncedCount: number;
 *   failedCount: number;
 *   xeroTimesheetIds?: string[];
 *   errors?: string[];
 *   message: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Admin role required
 *
 * NOTE: This is currently a safe stub implementation that:
 * - Validates the payload
 * - Fetches entries from database
 * - Marks entries as synced
 * - Logs the sync attempt
 * - Returns simulated success response
 *
 * TODO: Replace with real Xero API integration when ready
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { syncToXero, validateXeroSyncPayload } from '@/lib/timetracking/xeroSyncAdapter';

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
        {
          success: false,
          error: 'Admin role required to sync time entries to Xero',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateXeroSyncPayload({
      ...body,
      organizationId,
    });

    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid payload',
        },
        { status: 400 }
      );
    }

    // Perform sync (currently stub implementation)
    const result = await syncToXero(validation.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          syncedCount: result.syncedCount,
          failedCount: result.failedCount,
          errors: result.errors,
          message: result.message,
        },
        { status: 400 }
      );
    }

    // Log successful sync for audit
    await supabase.from('auditLogs').insert({
      user_id: userId,
      action: 'xero_sync',
      resource_type: 'time_entries',
      resource_id: validation.data.entryIds[0], // First entry ID
      details: {
        entryIds: validation.data.entryIds,
        syncedCount: result.syncedCount,
        xeroTimesheetIds: result.xeroTimesheetIds,
        isStub: true, // Flag to indicate this was stub sync
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      syncedCount: result.syncedCount,
      failedCount: result.failedCount,
      xeroTimesheetIds: result.xeroTimesheetIds,
      message: result.message,
    });
  } catch (error) {
    console.error('POST /api/staff/time/xero-sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
      );
  }
}

/**
 * GET /api/staff/time/xero-sync - Get sync status
 *
 * Query params:
 * - entryIds: comma-separated list of entry IDs
 *
 * Returns sync status for specified entries
 */
export async function GET(req: NextRequest) {
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

    // Get organization ID
    const supabase = await getSupabaseServer();
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
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

    // Get entry IDs from query params
    const entryIdsParam = req.nextUrl.searchParams.get('entryIds');
    if (!entryIdsParam) {
      return NextResponse.json(
        { success: false, error: 'entryIds query parameter is required' },
        { status: 400 }
      );
    }

    const entryIds = entryIdsParam.split(',');

    // Get sync status
    const { getXeroSyncStatus } = await import('@/lib/timetracking/xeroSyncAdapter');
    const result = await getXeroSyncStatus(entryIds, organizationId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
    });
  } catch (error) {
    console.error('GET /api/staff/time/xero-sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
