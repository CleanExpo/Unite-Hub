import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { selfCorrectionEngine, correctionArchiveBridge } from '@/lib/autonomy';

/**
 * GET /api/correction/status
 *
 * Retrieve status and details of a correction cycle.
 * Includes improvement actions, weakness clusters, and effectiveness metrics.
 *
 * Query Parameters:
 * - cycleId (required): ID of the correction cycle
 * - workspaceId (required): Workspace identifier
 *
 * Rate Limit: 30 requests/minute per client
 */
export async function GET(req: NextRequest) {
  const clientId = req.headers.get('x-client-id') || req.ip || 'unknown';

  // Rate limiting (30 per minute)
  const rateLimitResult = checkRateLimit(`correction:status:${clientId}`, { requests: 30, window: 60 });
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

    // Get query parameters
    const cycleId = req.nextUrl.searchParams.get('cycleId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!cycleId || !workspaceId) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['cycleId', 'workspaceId'],
        },
        { status: 400 }
      );
    }

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

    // Fetch correction cycle details
    const correctionCycle = await selfCorrectionEngine.getCorrectionCycleDetails(cycleId);

    // Fetch related weakness clusters
    const { data: graphNodes } = await supabase
      .from('self_correction_graph')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('severity', { ascending: false })
      .limit(10);

    // Get similar past corrections for learning
    const similarCorrections = await correctionArchiveBridge.findSimilarCorrections(
      correctionCycle.predictedFailureType || 'unknown',
      workspaceId,
      3
    );

    // Get learning insights if cycle is completed
    const learningInsights = correctionCycle.status === 'completed' ?
      await correctionArchiveBridge.generateLearningInsights({
        workspaceId,
        lookbackDays: 7,
        failureType: correctionCycle.predictedFailureType,
      })
      : null;

    return NextResponse.json(
      {
        success: true,
        cycle: correctionCycle,
        weaknessNodes: graphNodes || [],
        similarCorrections,
        learningInsights,
        links: {
          startExecution: `POST /api/correction/execute?cycleId=${cycleId}&workspaceId=${workspaceId}`,
          validateResults: `POST /api/correction/validate?cycleId=${cycleId}&workspaceId=${workspaceId}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching correction status:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
