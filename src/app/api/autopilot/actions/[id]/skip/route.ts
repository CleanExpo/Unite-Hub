/**
 * Skip Autopilot Action API
 * Phase 89: Skip a suggested action
 */

 
import { NextRequest } from 'next/server';
import { withErrorBoundary, successResponse } from '@/lib/errors/boundaries';
import { getSupabaseServer } from '@/lib/supabase';
import { skipAction } from '@/lib/autopilot';
import { AuthenticationError, DatabaseError } from '@/core/errors/app-error';

export const POST = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError();
    }
  } else {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new AuthenticationError();
    }
  }

  const { id } = await params;

  const success = await skipAction(id);

  if (!success) {
    throw new DatabaseError('Failed to skip action');
  }

  return successResponse({
    success: true,
  });
});
