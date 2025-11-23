/**
 * Report Preview API
 * Phase 76: Generate and preview composed reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  buildClientReport,
  buildFounderReport,
} from '@/lib/reports/reportCompositionEngine';
import {
  exportReportToJSON,
  exportReportToHTML,
  exportReportToMarkdown,
} from '@/lib/reports/reportExportComposer';
import { ReportType } from '@/lib/reports/reportSectionsConfig';
import { LayoutVariant, getRecommendedLayout } from '@/lib/reports/reportLayoutTemplates';

export async function POST(req: NextRequest) {
  try {
    // Auth check
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
    const {
      client_id,
      client_name,
      workspace_id,
      report_type,
      layout_variant,
      view_type = 'client', // 'client' or 'founder'
      include_optional = true,
    } = body;

    // Validate required fields
    if (!client_id || !workspace_id || !report_type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, workspace_id, report_type' },
        { status: 400 }
      );
    }

    // Validate report type
    if (!['weekly', 'monthly', 'ninety_day'].includes(report_type)) {
      return NextResponse.json(
        { error: 'Invalid report_type. Use: weekly, monthly, ninety_day' },
        { status: 400 }
      );
    }

    // Build report based on view type
    const report = view_type === 'founder'
      ? buildFounderReport({
          workspace_id,
          client_id,
          client_name: client_name || 'Client',
          report_type: report_type as ReportType,
          include_optional_sections: include_optional,
        })
      : buildClientReport({
          workspace_id,
          client_id,
          client_name: client_name || 'Client',
          report_type: report_type as ReportType,
          include_optional_sections: include_optional,
        });

    // Determine layout
    const layout = (layout_variant as LayoutVariant) || getRecommendedLayout(report_type);

    // Export to all formats
    const jsonExport = exportReportToJSON(report, layout);
    const htmlExport = exportReportToHTML(report, layout);
    const markdownExport = exportReportToMarkdown(report, layout);

    return NextResponse.json({
      success: true,
      report: {
        report_id: report.report_id,
        report_type: report.report_type,
        title: report.title,
        subtitle: report.subtitle,
        timeframe: report.timeframe,
        generated_at: report.generated_at,
        data_completeness: report.data_completeness,
        sections_count: report.sections.length,
        omitted_sections: report.omitted_sections,
      },
      exports: {
        json: jsonExport.content,
        html: htmlExport.content,
        markdown: markdownExport.content,
      },
      meta: {
        layout,
        total_sections: report.meta.total_sections,
        complete_sections: report.meta.complete_sections,
        partial_sections: report.meta.partial_sections,
        omitted_sections: report.meta.omitted_sections,
        data_sources_used: report.meta.data_sources_used,
      },
    });
  } catch (error) {
    console.error('Report preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Simple health check / info endpoint
  return NextResponse.json({
    endpoint: '/api/reports/preview',
    method: 'POST',
    required_fields: ['client_id', 'workspace_id', 'report_type'],
    optional_fields: ['client_name', 'layout_variant', 'view_type', 'include_optional'],
    report_types: ['weekly', 'monthly', 'ninety_day'],
    layout_variants: ['standard_agency_report', 'compact_summary'],
    view_types: ['client', 'founder'],
  });
}
