/**
 * /api/enterprise/teams
 * Team management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { teamStructureService, TeamRole } from '@/lib/enterprise/teamStructureService';
import { orgPermissionService } from '@/lib/enterprise/orgPermissionService';

// GET - List teams
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
    const teamId = req.nextUrl.searchParams.get('team_id');

    // Get single team
    if (teamId) {
      const team = await teamStructureService.getTeam(teamId);
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Verify access (member of org)
      const supabase = await getSupabaseServer();
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', team.org_id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: team });
    }

    // Get user's teams (no org filter)
    if (!orgId) {
      const teams = await teamStructureService.getUserTeams(userId);
      return NextResponse.json({ success: true, data: teams });
    }

    // Get org teams
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

    const teams = await teamStructureService.getOrgTeams(orgId);
    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get teams' },
      { status: 500 }
    );
  }
}

// POST - Create team
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
    const { org_id, name, description, team_type, bu_id } = body;

    if (!org_id || !name) {
      return NextResponse.json(
        { error: 'org_id and name required' },
        { status: 400 }
      );
    }

    // Check permission
    const canManage = await orgPermissionService.hasPermission(
      userId,
      org_id,
      'manage_teams'
    );

    if (!canManage.has_permission) {
      return NextResponse.json(
        { error: 'Permission denied: manage_teams required' },
        { status: 403 }
      );
    }

    const team = await teamStructureService.createTeam({
      org_id,
      name,
      description,
      team_type,
      bu_id,
      lead_user_id: userId,
    });

    return NextResponse.json({ success: true, data: team });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team' },
      { status: 500 }
    );
  }
}

// PATCH - Update team
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
    const { team_id, name, description, lead_user_id, add_member, remove_member, update_member_role } = body;

    if (!team_id) {
      return NextResponse.json({ error: 'team_id required' }, { status: 400 });
    }

    // Get team and check permission
    const team = await teamStructureService.getTeam(team_id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isLead = await teamStructureService.isTeamLead(userId, team_id);
    const isAdmin = await orgPermissionService.isOrgAdmin(userId, team.org_id);

    if (!isLead && !isAdmin) {
      return NextResponse.json(
        { error: 'Only team lead or org admin can update team' },
        { status: 403 }
      );
    }

    // Handle member operations
    if (add_member) {
      await teamStructureService.addTeamMember(
        team_id,
        add_member.user_id,
        add_member.role_name || 'team_member'
      );
    }

    if (remove_member) {
      await teamStructureService.removeMember(team_id, remove_member.user_id);
    }

    if (update_member_role) {
      await teamStructureService.updateMemberRole(
        team_id,
        update_member_role.user_id,
        update_member_role.role_name
      );
    }

    // Update team properties
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (lead_user_id) updates.lead_user_id = lead_user_id;

    let updatedTeam = team;
    if (Object.keys(updates).length > 0) {
      updatedTeam = await teamStructureService.updateTeam(team_id, updates as any);
    }

    return NextResponse.json({ success: true, data: updatedTeam });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team
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

    const teamId = req.nextUrl.searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json({ error: 'team_id required' }, { status: 400 });
    }

    const team = await teamStructureService.getTeam(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only org admin can delete teams
    const isAdmin = await orgPermissionService.isOrgAdmin(userId, team.org_id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only org admin can delete teams' },
        { status: 403 }
      );
    }

    await teamStructureService.deleteTeam(teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete team' },
      { status: 500 }
    );
  }
}
