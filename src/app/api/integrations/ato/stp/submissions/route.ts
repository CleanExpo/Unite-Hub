/**
 * STP Submissions API
 *
 * GET /api/integrations/ato/stp/submissions - List submissions
 * POST /api/integrations/ato/stp/submissions - Create submission
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSTPSubmission,
  aggregatePayRunsForSubmission,
  type STPSubmission,
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
      .from('stp_submissions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('submission_date', { ascending: false });

    if (financialYear) {
      query = query.eq('financial_year', parseInt(financialYear));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) throw new Error(`Database query failed: ${error.message}`);

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      count: submissions?.length || 0,
    });
  } catch (error) {
    console.error('List submissions error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list submissions',
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
    const {
      workspaceId,
      submission_type,
      pay_event_date,
      financial_year,
      payer_abn,
      payer_name,
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify workspace access with admin role
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin role required for STP submissions' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!submission_type || !pay_event_date || !financial_year || !payer_abn || !payer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Aggregate finalized pay runs for this pay event date
    const aggregated = await aggregatePayRunsForSubmission(
      workspaceId,
      new Date(pay_event_date),
      financial_year
    );

    if (aggregated.employee_count === 0) {
      return NextResponse.json(
        { error: 'No finalized pay runs found for this pay event date' },
        { status: 400 }
      );
    }

    // Create submission
    const submissionData: STPSubmission = {
      workspace_id: workspaceId,
      submission_type,
      financial_year,
      pay_event_date: new Date(pay_event_date),
      payer_abn,
      payer_name,
      employee_count: aggregated.employee_count,
      total_gross_earnings: aggregated.total_gross_earnings,
      total_tax_withheld: aggregated.total_tax_withheld,
      total_super_employer: aggregated.total_super_employer,
    };

    const { id: submissionId } = await createSTPSubmission(workspaceId, submissionData);

    // Mark pay runs as submitted
    const { error: updateError } = await supabase
      .from('stp_pay_runs')
      .update({
        status: 'submitted',
        stp_submission_id: submissionId,
      })
      .in('id', aggregated.pay_run_ids);

    if (updateError) {
      console.error('Failed to update pay runs:', updateError);
      // Don't fail the request - submission was created
    }

    return NextResponse.json({
      success: true,
      submissionId,
      summary: {
        employee_count: aggregated.employee_count,
        total_gross_earnings: aggregated.total_gross_earnings,
        total_tax_withheld: aggregated.total_tax_withheld,
        total_super_employer: aggregated.total_super_employer,
        pay_runs_submitted: aggregated.pay_run_ids.length,
      },
    });
  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
