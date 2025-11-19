/**
 * POST /api/staff/projects/create
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Creates a new project from a paid proposal.
 * This endpoint is typically called manually by staff or automatically by webhooks.
 *
 * Request body:
 * {
 *   proposalScopeId: string (UUID);
 *   ideaId: string (UUID);
 *   clientId: string (UUID);
 *   tier: 'good' | 'better' | 'best';
 *   packageId: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   project?: CreatedProject;
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Staff role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createProjectFromProposal } from '@/lib/services/staff/projectService';

export async function POST(req: NextRequest) {
  try {
    // Authentication - CLAUDE.md pattern
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let organizationId: string;

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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // Get organization ID from query params or user profile
    const searchParams = req.nextUrl.searchParams;
    organizationId = searchParams.get('organizationId') || '';

    if (!organizationId) {
      const supabase = await getSupabaseServer();
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (!userOrgs) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 400 }
        );
      }

      organizationId = userOrgs.organization_id;
    }

    // Authorization - verify staff role
    const supabase = await getSupabaseServer();
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!userOrg || !['owner', 'admin', 'staff'].includes(userOrg.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Staff role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { proposalScopeId, ideaId, clientId, tier, packageId } = body;

    // Validate required fields
    if (!proposalScopeId || !ideaId || !clientId || !tier || !packageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: proposalScopeId, ideaId, clientId, tier, packageId',
        },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['good', 'better', 'best'].includes(tier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tier. Must be good, better, or best',
        },
        { status: 400 }
      );
    }

    // Verify idea exists and belongs to organization
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, status, title')
      .eq('id', ideaId)
      .eq('organization_id', organizationId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        {
          success: false,
          error: 'Idea not found or does not belong to your organization',
        },
        { status: 404 }
      );
    }

    // Verify idea is in 'paid' status
    if (idea.status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: `Idea must be in 'paid' status. Current status: ${idea.status}`,
        },
        { status: 400 }
      );
    }

    // Verify proposal scope exists
    const { data: proposalScope, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('id, status')
      .eq('id', proposalScopeId)
      .eq('organization_id', organizationId)
      .single();

    if (scopeError || !proposalScope) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal scope not found or does not belong to your organization',
        },
        { status: 404 }
      );
    }

    // Check if project already exists for this idea
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, name')
      .eq('idea_id', ideaId)
      .single();

    if (existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: `Project already exists for this idea: "${existingProject.name}" (ID: ${existingProject.id})`,
        },
        { status: 409 }
      );
    }

    // Create project using service layer
    const result = await createProjectFromProposal({
      proposalScopeId,
      ideaId,
      clientId,
      organizationId,
      tier,
      packageId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create project',
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        project: result.project,
        message: result.message || 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Project creation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create project. Please try again.',
      },
      { status: 500 }
    );
  }
}
