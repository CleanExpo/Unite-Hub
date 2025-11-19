/**
 * GET /api/client/projects/get
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Returns detailed information for a specific project.
 *
 * Query Parameters:
 * - projectId: string (UUID)
 *
 * Response:
 * {
 *   success: boolean;
 *   project?: ProjectDetail;
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Client must own the project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getProjectById } from '@/lib/services/staff/projectService';

export async function GET(req: NextRequest) {
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

    // Get organization ID from user profile
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

    // Get project ID from query params
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Fetch project using service layer
    const result = await getProjectById(projectId, organizationId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch project',
        },
        { status: result.error === 'Project not found' ? 404 : 500 }
      );
    }

    // Verify client owns the project
    if (result.project?.clientId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not own this project.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.project,
      message: result.message,
    });
  } catch (error) {
    console.error('GET /api/client/projects/get error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
