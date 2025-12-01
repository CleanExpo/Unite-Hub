/**
 * Client Proposals API Routes - Phase 2
 * GET /api/client/proposals - List user's proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClientAuth, getUserId } from '@/lib/middleware/auth';
import { supabaseStaff } from '@/lib/auth/supabase';

export const GET = withClientAuth(async (req) => {
  try {
    const clientId = getUserId(req);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get proposals for user's ideas
    const { data: proposals, error } = await (supabaseStaff
      .from('proposal_scopes') as any)
      .select('*, ideas!inner(client_id)')
      .eq('ideas.client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch proposals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch proposals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposals: proposals || [],
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
