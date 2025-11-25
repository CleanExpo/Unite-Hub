/**
 * POST /api/safety/enforce
 * Execute automatic enforcement based on evaluation
 *
 * Request body:
 * {
 *   workspaceId: string (required)
 *   riskScore: number (0-100)
 *   uncertaintyScore: number (0-100)
 *   cascadeRiskScore: number (0-100)
 *   memoryCorruptionScore: number (0-100)
 *   activeAgents: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { safetyEnforcementManager } from '@/lib/safety';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

interface EnforceRequest {
  workspaceId: string;
  riskScore: number;
  uncertaintyScore: number;
  cascadeRiskScore: number;
  memoryCorruptionScore: number;
  activeAgents: string[];
}

export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`safety:enforce:${clientId}`, { requests: 20, window: 60 });

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
    let body: EnforceRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const {
      workspaceId,
      riskScore,
      uncertaintyScore,
      cascadeRiskScore,
      memoryCorruptionScore,
      activeAgents,
    } = body;

    if (!workspaceId || typeof riskScore !== 'number') {
      return NextResponse.json(
        { error: 'workspaceId and riskScore are required' },
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

    // Evaluate enforcement decision
    const decision = await safetyEnforcementManager.evaluateEnforcement({
      workspaceId,
      riskScore,
      uncertaintyScore,
      cascadeRiskScore,
      memoryCorruptionScore,
      activeAgents: activeAgents || [],
    });

    // If enforcement is needed, execute it
    let enforcementResult = null;
    if (decision.shouldEnforce) {
      enforcementResult = await safetyEnforcementManager.enforce({
        workspaceId,
        decision,
      });
    }

    return NextResponse.json(
      {
        success: true,
        decision: {
          shouldEnforce: decision.shouldEnforce,
          action: decision.action,
          severity: decision.severity,
          reason: decision.reason,
          affectedSystems: decision.affectedSystems,
        },
        enforcement: enforcementResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error executing enforcement:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to execute enforcement', details: message },
      { status: 500 }
    );
  }
}
