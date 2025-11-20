/**
 * /api/enterprise/workspaces
 * Workspace management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { workspaceService } from '@/lib/enterprise/workspaceService';
import { orgGraphService, WorkspaceRole } from '@/lib/enterprise/orgGraphService';

// GET - List workspaces
export async function GET(req: NextRequest) {
  try {
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
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');

    // Get single workspace
    if (workspaceId) {
      const workspace = await workspaceService.getWorkspace(workspaceId);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      // Verify access
      const { valid } = await workspaceService.validateWorkspaceAccess(userId, workspaceId);
      if (!valid) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: workspace });
    }

    // Get all user workspaces (no org filter)
    if (!orgId) {
      const workspaces = await workspaceService.getUserWorkspaces(userId);
      return NextResponse.json({ success: true, data: workspaces });
    }

    // Get org workspaces
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

    const workspaces = await workspaceService.getOrgWorkspaces(orgId);
    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get workspaces' },
      { status: 500 }
    );
  }
}

// POST - Create workspace
export async function POST(req: NextRequest) {
  try {
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
    const { name, org_id, settings } = body;

    if (!name || !org_id) {
      return NextResponse.json(
        { error: 'name and org_id required' },
        { status: 400 }
      );
    }

    // Verify user can create workspaces in this org
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', org_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only org owners/admins can create workspaces' },
        { status: 403 }
      );
    }

    const workspace = await workspaceService.createWorkspace({
      name,
      org_id,
      owner_user_id: userId,
      settings,
    });

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workspace' },
      { status: 500 }
    );
  }
}

// PATCH - Update workspace
export async function PATCH(req: NextRequest) {
  try {
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
    const { workspace_id, name, settings } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify admin access
    const role = await orgGraphService.getUserWorkspaceRole(userId, workspace_id);
    if (!role || !['owner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Only workspace owners/admins can update settings' },
        { status: 403 }
      );
    }

    let workspace = await workspaceService.getWorkspace(workspace_id);

    if (name) {
      workspace = {
        ...workspace!,
        ...(await workspaceService.updateWorkspace(workspace_id, { name })),
      };
    }

    if (settings) {
      const updatedSettings = await workspaceService.updateWorkspaceSettings(
        workspace_id,
        settings
      );
      workspace = {
        ...workspace!,
        settings: updatedSettings,
      };
    }

    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workspace
export async function DELETE(req: NextRequest) {
  try {
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

    const workspaceId = req.nextUrl.searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify owner access
    const role = await orgGraphService.getUserWorkspaceRole(userId, workspaceId);
    if (role !== 'owner') {
      return NextResponse.json(
        { error: 'Only workspace owner can delete' },
        { status: 403 }
      );
    }

    await workspaceService.deleteWorkspace(workspaceId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
