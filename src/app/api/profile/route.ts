import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let authenticatedUserId: string;

    if (token) {
      // Use browser client for implicit OAuth tokens
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      authenticatedUserId = data.user.id;
    } else {
      // Fallback to server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      authenticatedUserId = data.user.id;
    }

    // SECURITY FIX: Validate requested userId matches authenticated user
    const requestedUserId = req.nextUrl.searchParams.get('userId');

    if (requestedUserId && requestedUserId !== authenticatedUserId) {
      console.warn(`[API Security] User ${authenticatedUserId} attempted to access profile ${requestedUserId}`);
      return NextResponse.json({ error: 'Forbidden - cannot access other users\' profiles' }, { status: 403 });
    }

    // Get Supabase instance for database operations
    const supabase = await getSupabaseServer();

    // Fetch profile for authenticated user ONLY
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authenticatedUserId)
      .single();

    if (error) {
      console.error('[API] Profile fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[API] Profile route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
