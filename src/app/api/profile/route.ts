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
    let supabase;

    if (token) {
      // CRITICAL FIX: Use authenticated client with JWT context
      // This ensures auth.uid() is set for RLS policies
      const { getSupabaseServerWithAuth } = await import('@/lib/supabase');
      supabase = getSupabaseServerWithAuth(token);

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('[API] Token authentication failed:', error?.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      authenticatedUserId = data.user.id;
      console.log('[API] Token auth successful for profile fetch:', authenticatedUserId);
    } else {
      // Fallback to server-side cookies (PKCE flow)
      console.log('[API] No token, using cookie-based auth for profile fetch');
      supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error('[API] Cookie authentication failed:', error?.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      authenticatedUserId = data.user.id;
      console.log('[API] Cookie auth successful for profile fetch:', authenticatedUserId);
    }

    // SECURITY FIX: Validate requested userId matches authenticated user
    const requestedUserId = req.nextUrl.searchParams.get('userId');

    if (requestedUserId && requestedUserId !== authenticatedUserId) {
      console.warn(`[API Security] User ${authenticatedUserId} attempted to access profile ${requestedUserId}`);
      return NextResponse.json({ error: 'Forbidden - cannot access other users\' profiles' }, { status: 403 });
    }

    // Fetch profile using AUTHENTICATED client (has JWT context for RLS)
    // RLS Policy: "Users can view their own profile" USING (id = auth.uid())
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authenticatedUserId)
      .maybeSingle();

    if (error) {
      console.error('[API] Profile fetch error:', error);
      console.error('[API] This may indicate RLS policy issues');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no profile exists, return null (not an error)
    if (!profile) {
      console.warn('[API] No profile found for user:', authenticatedUserId);
      console.warn('[API] User may need to be initialized via /api/auth/initialize-user');
      return NextResponse.json(null, { status: 200 });
    }

    console.log('[API] Profile fetched successfully for:', authenticatedUserId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[API] Profile route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
