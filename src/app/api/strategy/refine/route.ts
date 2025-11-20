/**
 * POST /api/strategy/refine
 * Start or complete a refinement cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { strategyRefinementService } from '@/lib/strategy/strategyRefinementService';
import { crossDomainCoordinatorService } from '@/lib/strategy/crossDomainCoordinatorService';

const refineSchema = z.object({
  organization_id: z.string().uuid(),
  action: z.enum(['start', 'analyze', 'complete', 'balance']),
  cycle_type: z.enum(['SCHEDULED', 'DRIFT_TRIGGERED', 'MANUAL', 'PERFORMANCE']).optional(),
  horizon_plan_id: z.string().uuid().optional(),
  cycle_id: z.string().uuid().optional(),
  config: z.object({
    drift_threshold_percent: z.number().optional(),
    min_data_points: z.number().optional(),
    look_back_days: z.number().optional(),
    auto_correct: z.boolean().optional(),
  }).optional(),
});

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
    const validation = refineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { organization_id, action, cycle_type, horizon_plan_id, cycle_id, config } = validation.data;

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', organization_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let result: unknown;

    switch (action) {
      case 'start':
        if (!cycle_type) {
          return NextResponse.json({ error: 'cycle_type required for start' }, { status: 400 });
        }
        result = await strategyRefinementService.startRefinementCycle(
          organization_id,
          cycle_type,
          horizon_plan_id
        );
        break;

      case 'analyze':
        if (!cycle_id) {
          return NextResponse.json({ error: 'cycle_id required for analyze' }, { status: 400 });
        }
        result = await strategyRefinementService.analyzeForDrift(
          organization_id,
          cycle_id,
          config
        );
        break;

      case 'complete':
        if (!cycle_id) {
          return NextResponse.json({ error: 'cycle_id required for complete' }, { status: 400 });
        }
        result = await strategyRefinementService.completeRefinementCycle(
          cycle_id,
          0, // adjustments_count - would come from actual adjustments
          {}
        );
        break;

      case 'balance':
        result = await crossDomainCoordinatorService.analyzeBalance(
          organization_id,
          cycle_id
        );
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    console.error('Refine error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process refinement' },
      { status: 500 }
    );
  }
}
