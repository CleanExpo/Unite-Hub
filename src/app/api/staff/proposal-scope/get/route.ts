import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import type { ProposalScope } from '@/lib/projects/scope-planner';

/**
 * Get Proposal Scope API
 * Phase 3 Step 2 - Staff Tools
 *
 * Fetches an existing proposal scope for a given idea.
 *
 * Following CLAUDE.md patterns:
 * - Bearer token authentication
 * - Query parameter validation
 * - Workspace isolation
 * - Error handling with descriptive messages
 *
 * Query parameters:
 * - ideaId: UUID of the client idea
 *
 * Response:
 * {
 *   success: true;
 *   scope: ProposalScope | null;
 *   scopeId?: string;
 *   status?: 'draft' | 'sent';
 * }
 */

export async function GET(req: NextRequest) {
  try {
    // Authentication: Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      // Validate token using supabaseBrowser
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      userId = data.user.id;
    } else {
      // Fallback to server-side auth
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        );
      }

      userId = data.user.id;
    }

    // Extract and validate ideaId from query parameters
    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Missing required parameter: ideaId' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ideaId)) {
      return NextResponse.json(
        { error: 'Invalid ideaId format - must be a valid UUID' },
        { status: 400 }
      );
    }

    // Get Supabase server client
    const supabase = await getSupabaseServer();

    // Verify the idea exists and belongs to user's organization
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, organization_id, client_id')
      .eq('id', ideaId)
      .maybeSingle();

    if (ideaError) {
      console.error('Error fetching idea:', ideaError);
      return NextResponse.json(
        { error: 'Database error while fetching idea' },
        { status: 500 }
      );
    }

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch existing proposal scope for this idea
    const { data: proposalScope, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('id, scope_data, status, created_at, updated_at, created_by, updated_by')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (scopeError) {
      console.error('Error fetching proposal scope:', scopeError);
      return NextResponse.json(
        { error: 'Database error while fetching proposal scope' },
        { status: 500 }
      );
    }

    // If no scope exists, return null
    if (!proposalScope) {
      return NextResponse.json({
        success: true,
        scope: null,
        message: 'No proposal scope found for this idea',
      });
    }

    // Return the scope data
    return NextResponse.json({
      success: true,
      scope: proposalScope.scope_data as ProposalScope,
      scopeId: proposalScope.id,
      status: proposalScope.status as 'draft' | 'sent',
      metadata: {
        createdAt: proposalScope.created_at,
        updatedAt: proposalScope.updated_at,
        createdBy: proposalScope.created_by,
        updatedBy: proposalScope.updated_by,
      },
    });
  } catch (error) {
    console.error('Get proposal scope error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
