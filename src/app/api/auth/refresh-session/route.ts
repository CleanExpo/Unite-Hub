/**
 * Session Refresh API Route
 *
 * Allows client-side to manually refresh the Supabase session.
 * Used by session timeout hook to extend session when user clicks "Stay logged in".
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session found',
        },
        { status: 401 }
      );
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Error refreshing session:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session refresh failed',
        },
        { status: 500 }
      );
    }

    // Return success with session metadata (not the full session for security)
    return NextResponse.json({
      success: true,
      expiresAt: data.session.expires_at,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error refreshing session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
