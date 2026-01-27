/**
 * Staff Login API Route - Phase 2
 * POST /api/auth/staff-login
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffLogin } from '@/lib/auth/supabase';
import { validateBody } from '@/lib/middleware/validation';
import { strictRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await strictRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Validate request body
    const { data, error: validationError } = await validateBody(req, loginSchema);

    if (validationError || !data) {
      return NextResponse.json(
        { error: validationError || 'Invalid request body' },
        { status: 400 }
      );
    }

    // Attempt login
    const result = await staffLogin(data.email, data.password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      session: result.session,
      role: result.role,
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
