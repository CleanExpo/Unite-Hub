/**
 * GET /api/safety/ledger
 * Retrieve safety intervention ledger with historical actions
 *
 * Query params:
 * - workspaceId (required): Workspace to get ledger for
 * - limit (optional): Max entries to return (default: 50)
 * - offset (optional): Pagination offset (default: 0)
 * - filterAction (optional): Filter by action type
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`safety:ledger:${clientId}`, { requests: 30, window: 60 });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetInSeconds },
        { status: 429 }
      );
    }

    // Authentication
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

    // Get parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
    const filterAction = req.nextUrl.searchParams.get('filterAction');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify workspace access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: orgAccess } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (!orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('safety_ledger')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (filterAction) {
      query = query.eq('action', filterAction);
    }

    // Fetch ledger entries with pagination
    const { data: entries, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Calculate statistics
    const allEntries = (entries || []) as any[];
    const totalRiskReduction = allEntries.reduce((sum, e) => sum + ((e.risk_before || 0) - (e.risk_after || 0)), 0);
    const avgRiskReduction = allEntries.length > 0 ? Math.round(totalRiskReduction / allEntries.length) : 0;

    // Action distribution
    const actionCounts: Record<string, number> = {};
    for (const entry of allEntries) {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    }

    return NextResponse.json(
      {
        success: true,
        workspace: {
          id: workspaceId,
          orgId: workspace.org_id,
        },
        pagination: {
          offset,
          limit,
          total: count || 0,
          hasMore: (offset + limit) < (count || 0),
        },
        statistics: {
          totalInterventions: count || 0,
          uniqueActions: Object.keys(actionCounts).length,
          totalRiskReduced: totalRiskReduction,
          averageRiskReduction: avgRiskReduction,
          actionDistribution: actionCounts,
        },
        entries: allEntries.map(entry => ({
          id: entry.id,
          action: entry.action,
          riskBefore: entry.risk_before,
          riskAfter: entry.risk_after,
          riskReduction: entry.risk_before - entry.risk_after,
          uncertaintyBefore: entry.uncertainty_before,
          uncertaintyAfter: entry.uncertainty_after,
          affectedAgents: entry.affected_agents || [],
          reason: entry.metadata?.reason || '',
          actionType: entry.metadata?.action_type || '',
          createdBy: entry.created_by,
          createdAt: entry.created_at,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting safety ledger:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to get safety ledger', details: message },
      { status: 500 }
    );
  }
}
