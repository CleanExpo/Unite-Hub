/**
 * GET /api/synthex/cohorts
 * POST /api/synthex/cohorts
 *
 * List and create audience cohorts.
 *
 * GET Query params:
 * - tenantId: string (required)
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   name: string (required)
 *   description?: string
 *   rule: { type: string, ... }
 *   isDynamic?: boolean
 *   color?: string
 *   icon?: string
 * }
 *
 * Phase: B14 - Cohort-Based Journey Analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listCohorts,
  createCohort,
  evaluateCohort,
  CohortRule,
} from '@/lib/synthex/journeyService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await listCohorts(tenantId);

    if (result.error) {
throw result.error;
}

    return NextResponse.json({
      status: 'ok',
      cohorts: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[cohorts GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, name, description, rule, isDynamic, color, icon, evaluate } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name' },
        { status: 400 }
      );
    }

    if (!rule || !rule.type) {
      return NextResponse.json(
        { error: 'Missing required field: rule with type' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Create cohort
    const result = await createCohort(tenantId, name, rule as CohortRule, {
      description,
      isDynamic,
      color,
      icon,
    });

    if (result.error) {
throw result.error;
}

    // Optionally evaluate cohort immediately
    let evaluationResult = null;
    if (evaluate && result.data) {
      evaluationResult = await evaluateCohort(tenantId, result.data.id);
    }

    return NextResponse.json({
      status: 'ok',
      cohort: result.data,
      evaluation: evaluationResult?.data || null,
    }, { status: 201 });
  } catch (error) {
    console.error('[cohorts POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
