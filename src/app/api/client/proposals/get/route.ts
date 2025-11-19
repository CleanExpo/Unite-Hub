/**
 * GET /api/client/proposals/get
 * Phase 3 Step 5 - Client Proposal Selection
 *
 * Retrieves a proposal scope for a client to review and select a package.
 *
 * Query Parameters:
 * - ideaId: UUID of the client idea
 *
 * Returns:
 * - success: boolean
 * - proposal: ProposalScope object (if found)
 * - error: string (if error)
 *
 * Following CLAUDE.md patterns:
 * - Bearer token authentication
 * - Workspace isolation
 * - Typed responses
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import type { ProposalScope } from '@/lib/projects/scope-planner';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = req.nextUrl;
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json(
        { success: false, error: 'ideaId is required' },
        { status: 400 }
      );
    }

    // Authenticate request
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();

    // Verify the idea belongs to the authenticated client
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, client_id, organization_id')
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch the proposal scope for this idea
    const { data: proposalScope, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('id, scope_data, status, created_at, updated_at')
      .eq('idea_id', ideaId)
      .eq('status', 'sent') // Only return proposals that have been sent to client
      .maybeSingle();

    if (scopeError) {
      console.error('Error fetching proposal scope:', scopeError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch proposal' },
        { status: 500 }
      );
    }

    if (!proposalScope) {
      return NextResponse.json(
        { success: false, error: 'No proposal found for this idea' },
        { status: 404 }
      );
    }

    // Return the proposal
    return NextResponse.json({
      success: true,
      proposal: proposalScope.scope_data as ProposalScope,
      metadata: {
        proposalId: proposalScope.id,
        status: proposalScope.status,
        createdAt: proposalScope.created_at,
        updatedAt: proposalScope.updated_at,
      },
    });
  } catch (error) {
    console.error('GET /api/client/proposals/get error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
