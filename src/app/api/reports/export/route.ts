/**
 * Report Export API
 * Phase 77: Export reports in various formats
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
import { prepareRenderableReport } from '@/lib/reports/reportRenderEngine';
import { exportToPdf } from '@/lib/reports/pdfExportAdapter';
import { exportToSlides } from '@/lib/reports/slideExportAdapter';
import { ReportType } from '@/lib/reports/reportSectionsConfig';
import { LayoutVariant } from '@/lib/reports/reportLayoutTemplates';

export type ExportFormat = 'pdf' | 'slides' | 'json' | 'markdown' | 'html';

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
      format = 'pdf',
      view_type = 'client',
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

    // Validate format
    const validFormats: ExportFormat[] = ['pdf', 'slides', 'json', 'markdown', 'html'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Use: ${validFormats.join(', ')}` },
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
    const layout = (layout_variant as LayoutVariant) || 'standard_agency_report';

    // Generate filename base
    const dateStr = new Date().toISOString().split('T')[0];
    const clientSlug = (client_name || 'client').toLowerCase().replace(/\s+/g, '-');
    const filenameBase = `${clientSlug}-${report_type}-report-${dateStr}`;

    // Export based on format
    switch (format) {
      case 'pdf': {
        const renderable = prepareRenderableReport(report, layout);
        const pdfResult = exportToPdf(renderable);

        return NextResponse.json({
          success: true,
          format: 'pdf',
          content_type: pdfResult.content_type,
          content: pdfResult.content,
          filename: pdfResult.filename,
          pages: pdfResult.pages,
          size_bytes: pdfResult.size_bytes,
          meta: pdfResult.meta,
          integration_note: pdfResult.integration_note,
        });
      }

      case 'slides': {
        const renderable = prepareRenderableReport(report, layout);
        const slideResult = exportToSlides(renderable);

        return NextResponse.json({
          success: true,
          format: 'slides',
          deck: slideResult.deck,
          filename: slideResult.filename,
          meta: slideResult.meta,
          integration_note: slideResult.integration_note,
        });
      }

      case 'json': {
        const jsonExport = exportReportToJSON(report, layout);

        return NextResponse.json({
          success: true,
          format: 'json',
          content_type: 'application/json',
          content: jsonExport.content,
          filename: `${filenameBase}.json`,
        });
      }

      case 'markdown': {
        const markdownExport = exportReportToMarkdown(report, layout);

        return NextResponse.json({
          success: true,
          format: 'markdown',
          content_type: 'text/markdown',
          content: markdownExport.content,
          filename: `${filenameBase}.md`,
        });
      }

      case 'html': {
        const htmlExport = exportReportToHTML(report, layout);

        return NextResponse.json({
          success: true,
          format: 'html',
          content_type: 'text/html',
          content: htmlExport.content,
          filename: `${filenameBase}.html`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Info endpoint
  return NextResponse.json({
    endpoint: '/api/reports/export',
    method: 'POST',
    required_fields: ['client_id', 'workspace_id', 'report_type'],
    optional_fields: ['client_name', 'layout_variant', 'format', 'view_type', 'include_optional'],
    formats: ['pdf', 'slides', 'json', 'markdown', 'html'],
    report_types: ['weekly', 'monthly', 'ninety_day'],
    layout_variants: ['standard_agency_report', 'compact_summary'],
    view_types: ['client', 'founder'],
    notes: {
      pdf: 'Returns HTML-based PDF preview. Integrate with puppeteer for binary PDF.',
      slides: 'Returns JSON slide frames. Integrate with Google Slides/PowerPoint API.',
      markdown: 'Returns Markdown string for documentation.',
      html: 'Returns styled HTML for web viewing.',
      json: 'Returns structured JSON for integrations.',
    },
  });
}
