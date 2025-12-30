/**
 * Auth Session API
 * Returns current user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
throw error;
}

    return NextResponse.json({
      session,
      user: session?.user || null
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch session',
      session: null,
      user: null
    }, { status: 200 }); // Return 200 even on error for auth checks
  }
}
