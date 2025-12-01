 
/**
 * Staff Login API Route - Phase 2
 * POST /api/auth/staff-login
 */

import type { NextRequest } from 'next/server';
import { staffLogin } from '@/lib/auth/supabase';
import { validateBody } from '@/lib/middleware/validation';
import { z } from 'zod';
import { withErrorBoundary, ValidationError, AuthenticationError } from '@/lib/errors/boundaries';
import { successResponse } from '@/lib/errors/boundaries';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Validate request body
  const { data, error: validationError } = await validateBody(req, loginSchema);

  if (validationError || !data) {
    throw new ValidationError(validationError || 'Invalid request body');
  }

  // Attempt login
  const result = await staffLogin(data.email, data.password);

  if (!result.success) {
    throw new AuthenticationError(result.error || 'Authentication failed');
  }

  return successResponse({
    user: result.user,
    session: result.session,
    role: result.role,
  }, undefined, 'Login successful', 200);
});
