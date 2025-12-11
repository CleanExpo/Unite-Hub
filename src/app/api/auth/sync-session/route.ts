import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Sync Session API Route
 * After client-side signin, this refreshes the server-side session cookies
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Set the session on the server
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Session sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
