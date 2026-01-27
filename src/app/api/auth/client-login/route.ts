import { NextRequest, NextResponse } from 'next/server';
import { clientLogin } from '@/lib/auth/supabase';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * Client Login API Route
 * Phase 2 Step 5 - Client authentication endpoint
 *
 * Authenticates client users with email/password
 * Verifies user exists in client_users table
 * Checks active status
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await strictRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt client login
    const result = await clientLogin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Return success with session data
    return NextResponse.json({
      success: true,
      user: result.user,
      session: result.session,
      client: result.client,
    });
  } catch (error) {
    console.error('Client login API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
