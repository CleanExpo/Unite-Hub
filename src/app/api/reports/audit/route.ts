/**
 * Audit & Compliance API
 * GET - Query events, POST - Log event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { auditComplianceService } from '@/lib/services/financial/AuditComplianceService';

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

    const type = req.nextUrl.searchParams.get('type') || 'events';

    let result: any;

    switch (type) {
      case 'events':
        const category = req.nextUrl.searchParams.get('category') as any;
        const severity = req.nextUrl.searchParams.get('severity') as any;
        const eventUserId = req.nextUrl.searchParams.get('userId') || undefined;
        const workspaceId = req.nextUrl.searchParams.get('workspaceId') || undefined;
        const startDate = req.nextUrl.searchParams.get('startDate');
        const endDate = req.nextUrl.searchParams.get('endDate');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

        result = await auditComplianceService.queryEvents(orgId, {
          category,
          severity,
          user_id: eventUserId,
          workspace_id: workspaceId,
          start_date: startDate ? new Date(startDate) : undefined,
          end_date: endDate ? new Date(endDate) : undefined,
          limit,
        });
        break;

      case 'compliance':
        const reportStart = req.nextUrl.searchParams.get('startDate');
        const reportEnd = req.nextUrl.searchParams.get('endDate');

        if (!reportStart || !reportEnd) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for compliance report' },
            { status: 400 }
          );
        }

        result = await auditComplianceService.generateComplianceReport(
          orgId,
          new Date(reportStart),
          new Date(reportEnd)
        );
        break;

      case 'critical':
        const criticalLimit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
        result = await auditComplianceService.getCriticalEvents(orgId, criticalLimit);
        break;

      case 'user-activity':
        const activityUserId = req.nextUrl.searchParams.get('userId');
        if (!activityUserId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }
        const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
        result = await auditComplianceService.getUserActivity(orgId, activityUserId, days);
        break;

      case 'counts':
        const countStart = req.nextUrl.searchParams.get('startDate');
        const countEnd = req.nextUrl.searchParams.get('endDate');

        if (!countStart || !countEnd) {
          return NextResponse.json(
            { error: 'startDate and endDate are required' },
            { status: 400 }
          );
        }

        result = await auditComplianceService.getEventCounts(
          orgId,
          new Date(countStart),
          new Date(countEnd)
        );
        break;

      case 'export':
        const exportStart = req.nextUrl.searchParams.get('startDate');
        const exportEnd = req.nextUrl.searchParams.get('endDate');
        const format = (req.nextUrl.searchParams.get('format') || 'json') as 'json' | 'csv';

        if (!exportStart || !exportEnd) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for export' },
            { status: 400 }
          );
        }

        const exportData = await auditComplianceService.exportLogs(
          orgId,
          new Date(exportStart),
          new Date(exportEnd),
          format
        );

        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="audit_logs_${exportStart}_${exportEnd}.csv"`,
            },
          });
        }

        return NextResponse.json(JSON.parse(exportData));

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { orgId, event } = body;

    if (!orgId || !event) {
      return NextResponse.json(
        { error: 'orgId and event are required' },
        { status: 400 }
      );
    }

    // Verify user has access to org
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const eventId = await auditComplianceService.logEvent({
      ...event,
      org_id: orgId,
      user_id: event.user_id || userId,
    });

    return NextResponse.json({ id: eventId }, { status: 201 });
  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
