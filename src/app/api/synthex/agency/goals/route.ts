/**
 * Synthex Agency Goals API
 * Phase B40: Agency Command Center
 *
 * GET  - List agency goals
 * POST - Create a new goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAgencyGoals,
  createGoal,
  updateGoalProgress,
  CreateGoalInput,
} from '@/lib/synthex/agencyCommandService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyTenantId = searchParams.get('agencyTenantId');
    const status = searchParams.get('status');

    if (!agencyTenantId) {
      return NextResponse.json(
        { error: 'agencyTenantId is required' },
        { status: 400 }
      );
    }

    const goals = await getAgencyGoals(agencyTenantId, {
      status: status as 'in_progress' | 'achieved' | 'missed' | 'cancelled' | undefined,
    });

    return NextResponse.json({
      goals,
      count: goals.length,
    });
  } catch (error) {
    console.error('Error in agency/goals GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agencyTenantId, ...goalInput } = body;

    if (!agencyTenantId || !goalInput.goal_type || !goalInput.target_value || !goalInput.period_start || !goalInput.period_end) {
      return NextResponse.json(
        { error: 'agencyTenantId, goal_type, target_value, period_start, and period_end are required' },
        { status: 400 }
      );
    }

    const input: CreateGoalInput = {
      goal_type: goalInput.goal_type,
      target_value: goalInput.target_value,
      period_start: goalInput.period_start,
      period_end: goalInput.period_end,
      metadata: goalInput.metadata,
    };

    const goal = await createGoal(agencyTenantId, input);

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Error in agency/goals POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId, current_value, status } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 }
      );
    }

    const goal = await updateGoalProgress(goalId, current_value, status);

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error in agency/goals PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
