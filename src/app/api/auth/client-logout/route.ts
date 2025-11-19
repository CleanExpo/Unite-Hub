import { NextRequest, NextResponse } from 'next/server';
import { clientLogout } from '@/lib/auth/supabase';

/**
 * Client Logout API Route
 * Phase 2 Step 5 - Client logout endpoint
 *
 * Signs out the current client user
 */
export async function POST(req: NextRequest) {
  try {
    const result = await clientLogout();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client logout API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
