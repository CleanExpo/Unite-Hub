/**
 * POST /api/safety/intervene
 * Execute a safety intervention action
 *
 * Request body:
 * {
 *   workspaceId: string (required)
 *   action: 'block_agent' | 'pause_workflow' | 'halt_autonomy' | 'require_approval' | 'throttle' | 'override' (required)
 *   reason: string (required)
 *   targetAgent?: string
 *   targetWorkflow?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { safetyInterventionController, safetyArchiveBridge } from '@/lib/safety';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

interface InterventionRequest {
  workspaceId: string;
  action: 'block_agent' | 'pause_workflow' | 'halt_autonomy' | 'require_approval' | 'throttle' | 'override';
  reason: string;
  targetAgent?: string;
  targetWorkflow?: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`safety:intervene:${clientId}`, { requests: 10, window: 60 });

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

    // Parse request body
    let body: InterventionRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { workspaceId, action, reason, targetAgent, targetWorkflow } = body;

    if (!workspaceId || !action || !reason) {
      return NextResponse.json(
        { error: 'workspaceId, action, and reason are required' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['block_agent', 'pause_workflow', 'halt_autonomy', 'require_approval', 'throttle', 'override'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify workspace access (must be owner to intervene)
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
      return NextResponse.json({ error: 'Only workspace owners can execute interventions' }, { status: 403 });
    }

    // Execute intervention
    const interventionResult = await safetyInterventionController.executeIntervention({
      workspaceId,
      action,
      reason,
      targetAgent,
      targetWorkflow,
    });

    // Get current risk scores for archive
    const { data: recentEvents } = await supabase
      .from('safety_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    const currentEvent = recentEvents?.[0];
    const riskBefore = currentEvent?.risk_level || 50;
    const riskAfter = Math.max(0, riskBefore - 10); // Conservative reduction estimate

    // Archive the intervention
    await safetyArchiveBridge.recordInterventionAction({
      workspaceId,
      action,
      riskBefore,
      riskAfter,
      reason,
      targetAgent,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        intervention: {
          id: interventionResult.interventionId,
          action: interventionResult.action,
          executed: interventionResult.executed,
          timestamp: interventionResult.timestamp,
          affectedSystems: interventionResult.affectedSystems,
          result: {
            success: interventionResult.result.success,
            message: interventionResult.result.message,
            details: interventionResult.result.details,
          },
        },
        riskReduction: {
          before: riskBefore,
          after: riskAfter,
          reduction: riskBefore - riskAfter,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error executing safety intervention:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to execute intervention', details: message },
      { status: 500 }
    );
  }
}
