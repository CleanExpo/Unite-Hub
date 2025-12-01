import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { selfCorrectionEngine } from '@/lib/autonomy';

/**
 * POST /api/correction/start
 *
 * Start a new global self-correction cycle.
 * Analyzes current system state for weaknesses and failures,
 * predicts future issues, and generates improvement actions.
 *
 * Rate Limit: 5 requests/minute per client
 */
export async function POST(req: NextRequest) {
  const clientId = req.headers.get('x-client-id') || req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting (5 per minute)
  const rateLimitResult = checkRateLimit(`correction:start:${clientId}`, { requests: 5, window: 60 });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)) } }
    );
  }

  try {
    const supabase = await getSupabaseServer();
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let workspaceId: string;

    // Authenticate user
    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get workspace
    workspaceId = req.nextUrl.searchParams.get('workspaceId') || userId;

    // Verify workspace access
    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .maybeSingle();

    if (!orgData) {
      return NextResponse.json(
        { error: 'Workspace access denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { cycleType = 'adaptive', description } = body;

    // Validate cycle type
    const validCycleTypes = ['preventive', 'reactive', 'adaptive', 'learning', 'system_wide'];
    if (!validCycleTypes.includes(cycleType)) {
      return NextResponse.json(
        {
          error: 'Invalid cycle type',
          validTypes: validCycleTypes,
        },
        { status: 400 }
      );
    }

    // 1. Analyze correction needs
    const { failurePredictions, weaknessClusters, systemRiskLevel } =
      await selfCorrectionEngine.analyzeCorrectionNeeds({
        workspaceId,
        lookbackDays: 7,
      });

    // 2. Start correction cycle
    const correctionCycle = await selfCorrectionEngine.startCorrectionCycle({
      workspaceId,
      cycleType,
      failurePredictions,
      weaknessClusters,
      userId,
    });

    // 3. Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'correction_cycle_started',
      resource_type: 'correction_cycle',
      resource_id: correctionCycle.cycleId,
      details: {
        cycleType,
        failurePredictions: failurePredictions.length,
        weaknessClusters: weaknessClusters.length,
        systemRiskLevel,
        affectedAgents: correctionCycle.affectedAgents.length,
        improvementActions: correctionCycle.improvementActions.length,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        cycle: correctionCycle,
        analysis: {
          failurePredictions: failurePredictions.slice(0, 5), // Top 5 predictions
          weaknessClusters: weaknessClusters.slice(0, 5), // Top 5 clusters
          systemRiskLevel,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting correction cycle:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
