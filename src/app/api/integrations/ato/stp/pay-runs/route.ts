/**
 * STP Pay Runs API
 *
 * GET /api/integrations/ato/stp/pay-runs - List pay runs
 * POST /api/integrations/ato/stp/pay-runs - Create pay run
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPayRun,
  getEmployee,
  updateYTDSummary,
  type PayRunInput,
} from '@/lib/integrations/ato/stpComplianceService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const employeeId = searchParams.get('employeeId');
    const financialYear = searchParams.get('financialYear');
    const status = searchParams.get('status');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('stp_pay_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('payment_date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (financialYear) {
      query = query.eq('financial_year', parseInt(financialYear));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payRuns, error } = await query;

    if (error) throw new Error(`Database query failed: ${error.message}`);

    return NextResponse.json({
      success: true,
      payRuns: payRuns || [],
      count: payRuns?.length || 0,
    });
  } catch (error) {
    console.error('List pay runs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list pay runs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, ...payRunInput } = body as { workspaceId: string } & PayRunInput;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate required fields
    const requiredFields = [
      'employee_id',
      'pay_period_start',
      'pay_period_end',
      'payment_date',
      'gross_earnings',
    ];
    for (const field of requiredFields) {
      if (!(payRunInput as any)[field]) {
        return NextResponse.json({ error: `${field} required` }, { status: 400 });
      }
    }

    // Get employee for tax calculations
    const employee = await getEmployee(workspaceId, payRunInput.employee_id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create pay run with automatic tax/super calculations
    const payRun = await createPayRun(workspaceId, payRunInput, employee);

    // Update YTD summary
    await updateYTDSummary(workspaceId, employee.id, payRun);

    return NextResponse.json({
      success: true,
      payRun,
    });
  } catch (error) {
    console.error('Create pay run error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create pay run',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
