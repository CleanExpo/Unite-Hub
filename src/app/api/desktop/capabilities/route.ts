/**
 * GET /api/desktop/capabilities
 *
 * Retrieve available desktop agent capabilities for a workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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

    // Get workspaceId from query params
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    // Verify user has access to workspace
    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq(
        'org_id',
        (await supabaseAdmin.from('workspaces').select('org_id').eq('id', workspaceId).maybeSingle()).data?.org_id
      )
      .maybeSingle();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get capabilities for workspace
    const { data: capabilities, error: capError } = await supabaseAdmin
      .from('desktop_agent_capabilities')
      .select('id, command_name, description, category, risk_level, requires_approval, parameters, version, enabled')
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      .eq('enabled', true)
      .eq('deprecated', false)
      .order('risk_level', { ascending: false })
      .order('command_name', { ascending: true });

    if (capError) {
      log.error('Failed to fetch capabilities', { capError, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch capabilities' }, { status: 500 });
    }

    // Group capabilities by category
    const grouped = (capabilities || []).reduce(
      (acc, cap) => {
        if (!acc[cap.category]) {
          acc[cap.category] = [];
        }
        acc[cap.category].push({
          id: cap.id,
          commandName: cap.command_name,
          description: cap.description,
          riskLevel: cap.risk_level,
          requiresApproval: cap.requires_approval,
          parameters: cap.parameters,
          version: cap.version,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Get pending approvals count
    const { count: pendingCount, error: pendingError } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('approval_status', 'pending');

    return NextResponse.json({
      success: true,
      workspaceId,
      timestamp: new Date().toISOString(),
      capabilities: grouped,
      stats: {
        totalCapabilities: capabilities?.length || 0,
        byCategory: Object.fromEntries(
          Object.entries(grouped).map(([category, cmds]) => [category, (cmds as any[]).length])
        ),
        pendingApprovals: pendingCount || 0,
      },
      securityModel: {
        sandboxed: true,
        allowedCommandsOnly: true,
        founderApprovalRequired: true,
        rateLimited: true,
        deniesUnknown: true,
        truthLayerEnforced: true,
      },
    });
  } catch (error) {
    log.error('[/api/desktop/capabilities] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
