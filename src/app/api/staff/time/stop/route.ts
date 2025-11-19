/**
 * POST /api/staff/time/stop
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Stops an active time tracking session.
 *
 * Request Body:
 * {
 *   sessionId: string (UUID);
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
 * Authorization: Must be the session owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { stopTimer } from '@/lib/services/staff/timeService';
import { validateStopTimeSession } from '@/lib/validation/timeSchemas';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

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

    // Parse and validate request body
    const body = await req.json();
    const { sessionId } = body;

    const validation = validateStopTimeSession({
      sessionId,
      staffId: userId,
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

    // Stop timer using service layer
    const result = await stopTimer({
      sessionId,
      staffId: userId,
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
  } catch (error) {
    console.error('POST /api/staff/time/stop error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
