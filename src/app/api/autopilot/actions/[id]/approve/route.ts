/**
 * Approve Autopilot Action API
 * Phase 89: Approve and execute a suggested action
 */

 
import { NextRequest } from 'next/server';
import { withErrorBoundary, successResponse } from '@/lib/errors/boundaries';
import { getSupabaseServer } from '@/lib/supabase';
import { approveAndExecute } from '@/lib/autopilot';
import { AuthenticationError, InternalServerError } from '@/core/errors/app-error';

export const POST = withErrorBoundary(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let userId: string;

  if (token) {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError();
    }
    userId = data.user.id;
  } else {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new AuthenticationError();
    }
    userId = data.user.id;
  }

  const { id } = await params;

  const result = await approveAndExecute(id, userId);

  if (!result.success) {
    throw new InternalServerError(result.error || 'Execution failed');
  }

  return successResponse({
    success: true,
    result,
  });
});
