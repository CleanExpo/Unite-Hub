/**
 * Reports API
 *
 * Phase: D54 - External Reporting & Investor Pack Engine
 *
 * Routes:
 * - GET /api/synthex/reports - List reports
 * - POST /api/synthex/reports - Create report
 *
 * Query Params:
 * - action=get&id=<report-id> - Get specific report
 * - action=audiences&id=<report-id> - List audiences
 * - action=engagement&id=<report-id> - Get engagement metrics
 * - action=summary - Get report summary stats
 * - action=create_audience - Create audience
 * - action=update&id=<report-id> - Update report
 * - action=delete&id=<report-id> - Delete report
 * - action=ai_generate - AI-generate report from template
 * - action=ai_summary&id=<report-id> - AI-generate executive summary
 * - status=<status> - Filter by status
 * - audience_type=<type> - Filter by audience type
 * - template_id=<id> - Filter by template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createReport,
  getReport,
  listReports,
  updateReport,
  deleteReport,
  createReportAudience,
  listReportAudiences,
  getReportEngagement,
  getReportSummary,
  aiGenerateReport,
  aiGenerateExecutiveSummary,
  CreateReportInput,
  CreateAudienceInput,
  ReportStatus,
  AudienceType,
} from '@/lib/synthex/reportingService';

// =============================================================================
// GET - List reports, get report, get engagement, get summary
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific report
    if (action === 'get' && id) {
      const report = await getReport(tenantId, id);
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json({ report });
    }

    // List audiences
    if (action === 'audiences' && id) {
      const audiences = await listReportAudiences(id);
      return NextResponse.json({ audiences });
    }

    // Get engagement metrics
    if (action === 'engagement' && id) {
      const engagement = await getReportEngagement(id);
      return NextResponse.json({ engagement });
    }

    // Get summary statistics
    if (action === 'summary') {
      const months = parseInt(request.nextUrl.searchParams.get('months') || '12', 10);
      const summary = await getReportSummary(tenantId, months);
      return NextResponse.json({ summary });
    }

    // List reports
    const status = request.nextUrl.searchParams.get('status') as ReportStatus | null;
    const audienceType = request.nextUrl.searchParams.get('audience_type') as AudienceType | null;
    const templateId = request.nextUrl.searchParams.get('template_id');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const reports = await listReports(tenantId, {
      status: status || undefined,
      audienceType: audienceType || undefined,
      templateId: templateId || undefined,
      limit,
    });

    return NextResponse.json({ reports });
  } catch (error: unknown) {
    console.error('GET /api/synthex/reports error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create, update, delete reports and audiences, AI generation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // AI-generate report from template
    if (action === 'ai_generate') {
      const { template_id, data_snapshot } = body;

      if (!template_id) {
        return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
      }

      const generated = await aiGenerateReport(tenantId, template_id, data_snapshot || {});
      return NextResponse.json({ generated });
    }

    // AI-generate executive summary
    if (action === 'ai_summary') {
      const reportId = request.nextUrl.searchParams.get('id') || body.report_id;

      if (!reportId) {
        return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
      }

      const report = await getReport(tenantId, reportId);
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const summary = await aiGenerateExecutiveSummary(report, report.sections || {});
      return NextResponse.json({ summary });
    }

    // Create report
    if (!action || action === 'create') {
      const input: CreateReportInput = {
        template_id: body.template_id,
        title: body.title,
        period_start: body.period_start,
        period_end: body.period_end,
        audience_type: body.audience_type,
        generated_by: user.id,
      };

      if (!input.template_id || !input.title || !input.audience_type) {
        return NextResponse.json(
          { error: 'template_id, title, and audience_type are required' },
          { status: 400 }
        );
      }

      const report = await createReport(tenantId, input);
      return NextResponse.json({ report }, { status: 201 });
    }

    // Create audience
    if (action === 'create_audience') {
      const input: CreateAudienceInput = {
        report_id: body.report_id,
        audience_name: body.audience_name,
        audience_type: body.audience_type,
        email_list: body.email_list,
        custom_message: body.custom_message,
      };

      if (!input.report_id || !input.audience_name || !input.audience_type) {
        return NextResponse.json(
          { error: 'report_id, audience_name, and audience_type are required' },
          { status: 400 }
        );
      }

      const audience = await createReportAudience(tenantId, input);
      return NextResponse.json({ audience }, { status: 201 });
    }

    // Update report
    if (action === 'update') {
      const reportId = request.nextUrl.searchParams.get('id') || body.report_id;
      if (!reportId) {
        return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
      }

      const updates = {
        title: body.title,
        status: body.status,
        sections: body.sections,
        ai_generated_narrative: body.ai_generated_narrative,
        data_snapshot: body.data_snapshot,
        exported_formats: body.exported_formats,
        export_urls: body.export_urls,
        finalized_at: body.finalized_at,
        sent_at: body.sent_at,
      };

      const report = await updateReport(tenantId, reportId, updates);
      return NextResponse.json({ report });
    }

    // Delete report
    if (action === 'delete') {
      const reportId = request.nextUrl.searchParams.get('id') || body.report_id;
      if (!reportId) {
        return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
      }

      await deleteReport(tenantId, reportId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/synthex/reports error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage reports' },
      { status: 500 }
    );
  }
}
