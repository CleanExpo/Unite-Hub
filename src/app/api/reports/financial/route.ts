/**
 * Financial Reports API - Phase 3 Step 9
 *
 * Returns organization-wide financial reports:
 * - GET /api/reports/financial?type=summary - Financial summary
 * - GET /api/reports/financial?type=pnl - P&L statement
 * - GET /api/reports/financial?type=projects - Project financials
 * - GET /api/reports/financial?type=ai_costs - AI cost breakdown
 * - GET /api/reports/financial?type=transactions - Transaction history
 * - GET /api/reports/financial?type=monthly - Monthly comparison
 * - POST /api/reports/financial/refresh - Refresh materialized views
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getFinancialSummary,
  getProjectFinancials,
  getAICostBreakdown,
  getTransactionHistory,
  refreshFinancialReports,
} from '@/lib/reports/financialReportEngine';
import {
  generateOrganizationPnL,
  generateProjectPnL,
  generateMonthlyComparison,
} from '@/lib/reports/pnlGenerator';

// ============================================================================
// GET - Fetch Financial Reports
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
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
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get organization ID from query params
    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (orgError || !userOrgs) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Get report type
    const reportType = req.nextUrl.searchParams.get('type') || 'summary';
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const projectId = req.nextUrl.searchParams.get('projectId');
    const includePrevious = req.nextUrl.searchParams.get('includePrevious') === 'true';

    // Route to appropriate report function
    switch (reportType) {
      case 'summary': {
        const result = await getFinancialSummary(organizationId, startDate || undefined, endDate || undefined);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to generate summary' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'summary',
          data: result.data,
        });
      }

      case 'pnl': {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        if (projectId) {
          const result = await generateProjectPnL(projectId, start, end);

          if (!result.success) {
            return NextResponse.json(
              { error: result.error || 'Failed to generate project P&L' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            type: 'project_pnl',
            data: result.data,
          });
        } else {
          const result = await generateOrganizationPnL(organizationId, start, end, includePrevious);

          if (!result.success) {
            return NextResponse.json(
              { error: result.error || 'Failed to generate organization P&L' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            type: 'organization_pnl',
            data: result.data,
          });
        }
      }

      case 'projects': {
        const result = await getProjectFinancials(organizationId, projectId || undefined);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to fetch project financials' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'projects',
          data: result.data,
        });
      }

      case 'ai_costs': {
        const result = await getAICostBreakdown(organizationId, startDate || undefined, endDate || undefined);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to fetch AI cost breakdown' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'ai_costs',
          data: result.data,
        });
      }

      case 'transactions': {
        const transactionTypes = req.nextUrl.searchParams.get('transactionTypes')?.split(',');

        const result = await getTransactionHistory({
          organizationId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          projectId: projectId || undefined,
          transactionTypes,
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to fetch transaction history' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'transactions',
          data: result.data,
        });
      }

      case 'monthly': {
        const months = parseInt(req.nextUrl.searchParams.get('months') || '6');

        const result = await generateMonthlyComparison(organizationId, months);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to generate monthly comparison' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          type: 'monthly_comparison',
          data: result.data,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${reportType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[FINANCIAL REPORTS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Refresh Materialized Views
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authentication
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
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const supabase = await getSupabaseServer();
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (orgError || !userOrgs) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin'].includes(userOrgs.role)) {
      return NextResponse.json(
        { error: 'Admin role required to refresh reports' },
        { status: 403 }
      );
    }

    // Refresh materialized views
    const result = await refreshFinancialReports();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to refresh reports' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('auditLogs').insert({
      user_id: userId,
      action: 'refresh_financial_reports',
      details: { organizationId },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Financial reports refreshed successfully',
    });
  } catch (error) {
    console.error('[FINANCIAL REPORTS API] Error refreshing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
