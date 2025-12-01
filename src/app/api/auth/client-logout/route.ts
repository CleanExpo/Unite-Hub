 
import { clientLogout } from '@/lib/auth/supabase';
import { withErrorBoundary, DatabaseError } from '@/lib/errors/boundaries';
import { successResponse } from '@/lib/errors/boundaries';

/**
 * Client Logout API Route
 * Phase 2 Step 5 - Client logout endpoint
 *
 * Signs out the current client user
 */
export const POST = withErrorBoundary(async () => {
  const result = await clientLogout();

  if (!result.success) {
    throw new DatabaseError(result.error || 'Logout operation failed');
  }

  return successResponse({}, undefined, 'Logout successful', 200);
});
