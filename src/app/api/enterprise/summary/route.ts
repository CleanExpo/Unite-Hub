/**
 * Enterprise Summary API
 * GET - Enterprise health overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { enterpriseSummaryReportService } from '@/lib/services/enterprise/EnterpriseSummaryReportService';
import { enterpriseReadinessChecks } from '@/lib/services/enterprise/EnterpriseReadinessChecks';

export async function GET(req: NextRequest) {
  try {
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

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has admin access
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get('type') || 'summary';

    let result: any;

    switch (type) {
      case 'summary':
        result = await enterpriseSummaryReportService.generateSummary(orgId);
        break;

      case 'readiness':
        result = await enterpriseReadinessChecks.runAllChecks(orgId);
        break;

      case 'full':
        const [summary, readiness] = await Promise.all([
          enterpriseSummaryReportService.generateSummary(orgId),
          enterpriseReadinessChecks.runAllChecks(orgId),
        ]);
        result = { summary, readiness };
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching enterprise summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
