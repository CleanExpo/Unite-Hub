/**
 * GET/POST /api/strategy/drift
 * Get drift signals or resolve them
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { strategyRefinementService } from '@/lib/strategy/strategyRefinementService';
import { reinforcementAdjustmentEngine } from '@/lib/strategy/reinforcementAdjustmentEngine';

const resolveSchema = z.object({
  signal_id: z.string().uuid(),
  resolution_action: z.string(),
});

const adjustmentSchema = z.object({
  organization_id: z.string().uuid(),
  refinement_cycle_id: z.string().uuid().optional(),
  target: z.enum(['STEP', 'DOMAIN', 'KPI_TARGET', 'TIMELINE', 'RESOURCE', 'PRIORITY']),
  target_id: z.string().uuid().optional(),
  domain: z.string().optional(),
  trigger_reason: z.string(),
  signals: z.array(z.object({
    source: z.enum(['EXECUTION', 'FEEDBACK', 'SIMULATION', 'HISTORICAL']),
    strength: z.number().min(-1).max(1),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
    data: z.record(z.unknown()),
  })).optional(),
});

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

    const organizationId = req.nextUrl.searchParams.get('organization_id');
    const resolved = req.nextUrl.searchParams.get('resolved');
    const severity = req.nextUrl.searchParams.get('severity');
    const domain = req.nextUrl.searchParams.get('domain');
    const limit = req.nextUrl.searchParams.get('limit');

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
    }

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const signals = await strategyRefinementService.getDriftSignals(organizationId, {
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      severity: severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
      domain: domain || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    // Also get pending adjustments
    const pendingAdjustments = await reinforcementAdjustmentEngine.getPendingAdjustments(
      organizationId
    );

    return NextResponse.json({
      success: true,
      signals,
      pending_adjustments: pendingAdjustments,
      summary: {
        total_signals: signals.length,
        unresolved: signals.filter(s => !s.resolved).length,
        critical: signals.filter(s => s.severity === 'CRITICAL').length,
        pending_approvals: pendingAdjustments.length,
      },
    });
  } catch (error) {
    console.error('Drift GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get drift signals' },
      { status: 500 }
    );
  }
}

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
    const action = body.action;

    if (action === 'resolve') {
      const validation = resolveSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.errors },
          { status: 400 }
        );
      }

      const result = await strategyRefinementService.resolveDriftSignal(
        validation.data.signal_id,
        validation.data.resolution_action
      );

      return NextResponse.json({ success: true, signal: result });
    }

    if (action === 'adjust') {
      const validation = adjustmentSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.error.errors },
          { status: 400 }
        );
      }

      // Verify user has access
      const supabase = await getSupabaseServer();
      const { data: membership, error: membershipError } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', validation.data.organization_id)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const adjustment = await reinforcementAdjustmentEngine.generateAdjustment(
        {
          organization_id: validation.data.organization_id,
          refinement_cycle_id: validation.data.refinement_cycle_id,
          target: validation.data.target,
          target_id: validation.data.target_id,
          domain: validation.data.domain,
          trigger_reason: validation.data.trigger_reason,
        },
        validation.data.signals || []
      );

      return NextResponse.json({ success: true, adjustment });
    }

    if (action === 'approve') {
      const { adjustment_id, feedback, approved } = body;

      if (!adjustment_id) {
        return NextResponse.json({ error: 'adjustment_id required' }, { status: 400 });
      }

      await reinforcementAdjustmentEngine.provideFeedback(
        adjustment_id,
        feedback || '',
        approved === true,
        userId
      );

      return NextResponse.json({ success: true, approved });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Drift POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process drift action' },
      { status: 500 }
    );
  }
}
