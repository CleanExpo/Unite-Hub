import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getPendingDecisions,
  simulateDecision,
  recordDecisionOutcome,
  type DecisionType,
  type DecisionScenario,
} from '@/lib/founderOS/cognitiveTwinService';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/founder-os/cognitive-twin/decisions
 * Get pending decisions for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/decisions] GET request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
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
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get query parameters
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    // Get pending decisions
    const result = await getPendingDecisions(userId, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/decisions] Retrieved', result.data?.length || 0, 'decisions');

    return NextResponse.json({
      success: true,
      decisions: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/decisions] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder-os/cognitive-twin/decisions
 * Create a decision scenario and get AI analysis
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/decisions] POST request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
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
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { decisionType, title, context, constraints, timeline, budget, businessId } = body;

    // Validate required fields
    if (!decisionType || !title || !context || !constraints) {
      return NextResponse.json(
        { error: 'Missing required fields: decisionType, title, context, constraints' },
        { status: 400 }
      );
    }

    // Build decision scenario
    const scenario: DecisionScenario & { decisionType: DecisionType; businessId?: string } = {
      decisionType,
      title,
      context,
      constraints: Array.isArray(constraints) ? constraints : [constraints],
      timeline,
      budget,
      businessId,
    };

    // Simulate decision with AI
    console.log('[founder-os/cognitive-twin/decisions] Simulating decision:', decisionType);
    const result = await simulateDecision(userId, scenario);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/decisions] Decision simulated:', result.data?.id);

    return NextResponse.json({
      success: true,
      decision: result.data,
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/decisions] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/founder-os/cognitive-twin/decisions
 * Record a decision outcome
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/decisions] PUT request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
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
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { decisionId, humanDecision, outcome } = body;

    // Validate required fields
    if (!decisionId || !humanDecision) {
      return NextResponse.json(
        { error: 'Missing required fields: decisionId, humanDecision' },
        { status: 400 }
      );
    }

    // Verify ownership of the decision
    const { data: decision, error: fetchError } = await supabaseAdmin
      .from('cognitive_twin_decisions')
      .select('owner_user_id')
      .eq('id', decisionId)
      .single();

    if (fetchError || !decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    if (decision.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Record the decision outcome
    console.log('[founder-os/cognitive-twin/decisions] Recording outcome for decision:', decisionId);
    const result = await recordDecisionOutcome(decisionId, humanDecision, outcome);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/decisions] Decision outcome recorded');

    return NextResponse.json({
      success: true,
      decision: result.data,
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/decisions] PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
