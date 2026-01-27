/**
 * ATO BAS API Route
 *
 * GET  /api/integrations/ato/bas?workspaceId=xxx - List BAS lodgements
 * POST /api/integrations/ato/bas - Lodge BAS to ATO
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createATOClient, BASData } from '@/lib/integrations/ato/ato-client';

/**
 * GET - List BAS lodgements for workspace
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace from query params
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const status = req.nextUrl.searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('bas_lodgements')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('period_year', { ascending: false })
      .order('period_quarter', { ascending: false, nullsFirst: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: lodgements, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      lodgements: lodgements || [],
      count: lodgements?.length || 0,
    });
  } catch (error) {
    console.error('BAS list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch BAS lodgements',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Lodge BAS to ATO
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get BAS data from request body
    const { workspaceId, basData }: { workspaceId: string; basData: BASData } =
      await req.json();

    if (!workspaceId || !basData) {
      return NextResponse.json(
        { error: 'workspaceId and basData required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Only admins/owners can lodge BAS
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin role required to lodge BAS' },
        { status: 403 }
      );
    }

    // Initialize ATO client and lodge BAS
    const atoClient = createATOClient();
    await atoClient.initialize(workspaceId);

    const result = await atoClient.lodgeBAS(basData);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('BAS lodgement error:', error);
    return NextResponse.json(
      {
        error: 'Failed to lodge BAS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
