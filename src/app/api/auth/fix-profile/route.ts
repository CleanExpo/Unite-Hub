import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Manual Profile Fix Endpoint
 *
 * This endpoint manually creates a missing user profile for users who
 * signed up before the service role fix was applied.
 *
 * SECURITY: This uses the service role to bypass RLS, so it requires
 * the user to be authenticated (we verify their token).
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - token required' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    const user = data.user;

    // Get admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profileId: existingProfile.id,
      });
    }

    // Create missing profile using service role (bypasses RLS)
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('[fix-profile] Profile creation failed:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create profile',
          details: profileError,
        },
        { status: 500 }
      );
    }

    console.log('[fix-profile] ✅ Profile created for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile,
    });
  } catch (error) {
    console.error('[fix-profile] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
