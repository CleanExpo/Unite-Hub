/**
 * POST /api/enterprise/init
 * Initialize enterprise mode for an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { orgGraphService, PlanType } from '@/lib/enterprise/orgGraphService';
import { workspaceService } from '@/lib/enterprise/workspaceService';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { org_id, plan_type = 'starter' } = body as {
      org_id: string;
      plan_type?: PlanType;
    };

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Verify user is org owner/admin
    const { data: membership, error: memberError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', org_id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only org owners/admins can initialize enterprise mode' },
        { status: 403 }
      );
    }

    // Check if already initialized
    const existingSettings = await orgGraphService.getOrgSettings(org_id);
    if (existingSettings) {
      return NextResponse.json({
        success: true,
        message: 'Enterprise mode already initialized',
        data: {
          settings: existingSettings,
          already_initialized: true,
        },
      });
    }

    // Initialize org settings
    const settings = await orgGraphService.initializeOrgSettings(org_id, plan_type);

    // Get existing workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', org_id);

    // If no workspaces, create default one
    if (!workspaces || workspaces.length === 0) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', org_id)
        .single();

      await workspaceService.createWorkspace({
        name: `${org?.name || 'Default'} Workspace`,
        org_id,
        owner_user_id: userId,
      });
    } else {
      // Ensure user is member of existing workspaces
      for (const ws of workspaces) {
        const { data: existingMember } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', ws.id)
          .eq('user_id', userId)
          .single();

        if (!existingMember) {
          await workspaceService.addMember({
            workspace_id: ws.id,
            user_id: userId,
            role_name: 'owner',
            invited_by: userId,
          });
        }
      }
    }

    // Get full org graph
    const orgGraph = await orgGraphService.getOrgGraph(org_id);

    return NextResponse.json({
      success: true,
      message: 'Enterprise mode initialized',
      data: {
        settings,
        org_graph: orgGraph,
      },
    });
  } catch (error) {
    console.error('Enterprise init error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize enterprise mode' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const orgId = req.nextUrl.searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    // Verify access
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get settings and graph
    const settings = await orgGraphService.getOrgSettings(orgId);
    const orgGraph = await orgGraphService.getOrgGraph(orgId);

    return NextResponse.json({
      success: true,
      data: {
        initialized: !!settings,
        settings,
        org_graph: orgGraph,
      },
    });
  } catch (error) {
    console.error('Enterprise status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get enterprise status' },
      { status: 500 }
    );
  }
}
