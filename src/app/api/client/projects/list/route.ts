/**
 * GET /api/client/projects/list
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Returns all projects for the authenticated client.
 *
 * Query Parameters:
 * - status?: 'active' | 'on_hold' | 'completed' | 'cancelled'
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 *
 * Response:
 * {
 *   success: boolean;
 *   projects?: Project[];
 *   error?: string;
 * }
 *
 * Authentication: Required (Bearer token)
 * Authorization: Client must own the projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getProjectsForClient } from '@/lib/services/staff/projectService';

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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as 'active' | 'on_hold' | 'completed' | 'cancelled' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch projects using service layer
    const result = await getProjectsForClient({
      clientId: userId, // Filter by current user as client
      organizationId,
      status,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch projects',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: result.projects || [],
      message: result.message,
    });
  } catch (error) {
    console.error('GET /api/client/projects/list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
