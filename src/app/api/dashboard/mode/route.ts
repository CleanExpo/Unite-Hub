/**
 * Dashboard Mode Preference API
 * GET/POST /api/dashboard/mode
 * Manages user's simple vs advanced dashboard mode preference
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// GET - Fetch current mode
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return errorResponse('userId required', 400);
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('dashboard_mode')
    .eq('id', userId)
    .single();

  if (error) {
    return errorResponse(`Failed to fetch mode: ${error.message}`, 500);
  }

  return successResponse({
    mode: data?.dashboard_mode || 'simple',
  });
});

// POST - Update mode
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { userId, mode } = body;

  if (!userId || !mode) {
    return errorResponse('userId and mode required', 400);
  }

  if (!['simple', 'advanced'].includes(mode)) {
    return errorResponse('mode must be simple or advanced', 400);
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      dashboard_mode: mode,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return errorResponse(`Failed to update mode: ${error.message}`, 500);
  }

  return successResponse({
    message: `Dashboard mode updated to ${mode}`,
    mode: data.dashboard_mode,
  });
});
