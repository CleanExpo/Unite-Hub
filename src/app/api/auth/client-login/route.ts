 
import type { NextRequest } from 'next/server';
import { clientLogin } from '@/lib/auth/supabase';
import { withErrorBoundary, ValidationError, AuthenticationError } from '@/lib/errors/boundaries';
import { successResponse } from '@/lib/errors/boundaries';

/**
 * Client Login API Route
 * Phase 2 Step 5 - Client authentication endpoint
 *
 * Authenticates client users with email/password
 * Verifies user exists in client_users table
 * Checks active status
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const { email, password } = await req.json();

  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required', {
      email: email ? undefined : 'Email is required',
      password: password ? undefined : 'Password is required',
    });
  }

  // Attempt client login
  const result = await clientLogin(email, password);

  if (!result.success) {
    throw new AuthenticationError(result.error || 'Authentication failed');
  }

  // Return success with session data
  return successResponse({
    user: result.user,
    session: result.session,
    client: result.client,
  }, undefined, 'Login successful', 200);
});
