/**
 * POST /api/staff/time/manual
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Creates a manual time entry (no timer).
 *
 * Request Body:
 * {
 *   projectId?: string;
 *   taskId?: string;
 *   date: string (YYYY-MM-DD);
 *   hours: number (0-24);
 *   description: string;
 *   billable?: boolean;
 *   hourlyRate?: number;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   entry?: TimeEntry;
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Staff role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { addManualEntry } from '@/lib/services/staff/timeService';
import { validateCreateManualEntry } from '@/lib/validation/timeSchemas';

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

    // Get organization ID
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

    // Verify staff role
    if (!['owner', 'admin', 'staff'].includes(userOrgs.role)) {
      return NextResponse.json(
        { success: false, error: 'Staff role required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { projectId, taskId, date, hours, description, billable, hourlyRate } = body;

    const validation = validateCreateManualEntry({
      staffId: userId,
      organizationId,
      projectId,
      taskId,
      date,
      hours,
      description,
      billable,
      hourlyRate,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    // Create manual entry using service layer
    const result = await addManualEntry({
      staffId: userId,
      organizationId,
      projectId,
      taskId,
      date,
      hours,
      description,
      billable,
      hourlyRate,
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

    return NextResponse.json(
      {
        success: true,
        entry: result.data,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/staff/time/manual error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
