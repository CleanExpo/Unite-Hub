/**
 * GET /api/strategy/report
 * Get strategy summary reports, domain health, and refinement history
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { strategySummaryReportService } from '@/lib/strategy/strategySummaryReportService';

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
    const reportType = req.nextUrl.searchParams.get('type') || 'summary';
    const periodDays = parseInt(req.nextUrl.searchParams.get('period_days') || '30');

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

    let result: unknown;

    switch (reportType) {
      case 'summary':
        result = await strategySummaryReportService.generateSummaryReport(
          organizationId,
          periodDays
        );
        break;

      case 'health':
        result = await strategySummaryReportService.calculateSystemHealth(organizationId);
        break;

      case 'domain-health':
        result = await strategySummaryReportService.getDomainHealthReports(organizationId);
        break;

      case 'refinement-history':
        result = await strategySummaryReportService.getRefinementHistory(
          organizationId,
          periodDays
        );
        break;

      case 'horizon-progress':
        result = await strategySummaryReportService.getHorizonProgress(organizationId);
        break;

      case 'simulation-outcomes':
        result = await strategySummaryReportService.getSimulationOutcomes(
          organizationId,
          periodDays
        );
        break;

      case 'quick':
        result = await strategySummaryReportService.getQuickSummary(organizationId);
        break;

      default:
        return NextResponse.json({ error: `Unknown report type: ${reportType}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      report_type: reportType,
      data: result,
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
