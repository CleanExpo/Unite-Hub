/**
 * Send Report Email Endpoint
 * POST /api/managed/reports/send
 *
 * Sends a generated report to the client email
 * Updates notification status and marks report as sent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/email-service';

const logger = createApiLogger({ route: '/api/managed/reports/send' });

interface SendReportRequest {
  reportId: string;
  recipientEmail: string;
  projectId?: string;
}

/**
 * Build HTML email from report data
 */
function buildReportHTML(report: any, project: any): string {
  const kpiRows = (report.kpi_tracking || [])
    .map(
      (metric: any) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px;">${metric.name}</td>
      <td style="padding: 12px; text-align: right;">${metric.value?.toFixed(2) || 'N/A'}</td>
      <td style="padding: 12px; text-align: right;">${metric.targetValue?.toFixed(2) || 'N/A'}</td>
      <td style="padding: 12px; text-align: right; color: ${metric.trend === 'up' ? '#10b981' : '#ef4444'};">
        ${metric.trend === 'up' ? '↑' : '↓'} ${Math.abs(metric.change || 0).toFixed(1)}%
      </td>
    </tr>
  `
    )
    .join('');

  const recommendationRows = (report.recommendations || [])
    .map(
      (rec: any) => `
    <div style="margin-bottom: 16px; border-left: 4px solid #3b82f6; padding: 16px; background: #f0f9ff; border-radius: 4px;">
      <strong style="color: #1f2937;">${rec.title}</strong>
      <span style="display: inline-block; margin-left: 8px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
        ${rec.priority === 'high' ? 'background: #fee2e2; color: #991b1b;' : rec.priority === 'medium' ? 'background: #fef3c7; color: #92400e;' : 'background: #dcfce7; color: #166534;'}">
        ${rec.priority?.toUpperCase() || 'NORMAL'}
      </span>
      <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">${rec.description || ''}</p>
      <p style="margin: 8px 0 0 0; color: #666; font-size: 12px;"><strong>Impact:</strong> ${rec.impact || 'N/A'}</p>
      ${
        rec.actionItems && rec.actionItems.length > 0
          ? `
        <ul style="margin: 8px 0 0 16px; padding: 0; color: #666; font-size: 14px;">
          ${rec.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      `
          : ''
      }
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - Week ${report.report_number}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .container {
      background: #f9fafb;
      padding: 20px;
    }
    .email-content {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #1f2937;
      margin: 0 0 8px 0;
      font-size: 28px;
    }
    .date-range {
      color: #666;
      font-size: 14px;
      margin-bottom: 32px;
    }
    h2 {
      color: #1f2937;
      font-size: 20px;
      margin: 32px 0 16px 0;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
    }
    .summary {
      color: #555;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 24px;
      background: #f3f4f6;
      padding: 16px;
      border-radius: 4px;
    }
    .highlights {
      list-style: none;
      padding: 0;
      margin-bottom: 24px;
    }
    .highlights li {
      padding: 12px;
      margin-bottom: 8px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      color: #92400e;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-box {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #3b82f6;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-content">
      <h1>Weekly Report - Week ${report.report_number}</h1>
      <div class="date-range">
        ${new Date(report.period_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to
        ${new Date(report.period_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>

      <h2>Executive Summary</h2>
      <div class="summary">
        ${report.executive_summary || 'No summary provided'}
      </div>

      ${
        report.highlights && report.highlights.length > 0
          ? `
        <h2>Key Highlights</h2>
        <ul class="highlights">
          ${report.highlights.map((h: string) => `<li>✓ ${h}</li>`).join('')}
        </ul>
      `
          : ''
      }

      <h2>Hours Utilization</h2>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Hours Used</div>
          <div class="stat-value">${report.hours_utilized || 0}h</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Hours Remaining</div>
          <div class="stat-value">${report.hours_remaining || 0}h</div>
        </div>
      </div>

      ${
        report.kpi_tracking && report.kpi_tracking.length > 0
          ? `
        <h2>KPI Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th style="text-align: right;">Current</th>
              <th style="text-align: right;">Target</th>
              <th style="text-align: right;">Change</th>
            </tr>
          </thead>
          <tbody>
            ${kpiRows}
          </tbody>
        </table>
      `
          : ''
      }

      ${
        report.recommendations && report.recommendations.length > 0
          ? `
        <h2>Recommendations</h2>
        ${recommendationRows}
      `
          : ''
      }

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://unite-hub.app'}/founder/synthex/projects" class="cta-button">
          View Full Report
        </a>
      </div>

      <div class="footer">
        <p>This is an automated weekly report from your managed service project.</p>
        <p>Sent on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Build plain text email
 */
function buildReportText(report: any, project: any): string {
  let text = `WEEKLY REPORT - WEEK ${report.report_number}\n`;
  text += `${'='.repeat(50)}\n\n`;

  text += `Period: ${new Date(report.period_start_date).toLocaleDateString()} to ${new Date(report.period_end_date).toLocaleDateString()}\n\n`;

  text += `EXECUTIVE SUMMARY\n${'-'.repeat(50)}\n${report.executive_summary || 'No summary provided'}\n\n`;

  if (report.highlights && report.highlights.length > 0) {
    text += `KEY HIGHLIGHTS\n${'-'.repeat(50)}\n`;
    report.highlights.forEach((h: string) => {
      text += `✓ ${h}\n`;
    });
    text += '\n';
  }

  text += `HOURS UTILIZATION\n${'-'.repeat(50)}\n`;
  text += `Hours Used: ${report.hours_utilized || 0}h\n`;
  text += `Hours Remaining: ${report.hours_remaining || 0}h\n\n`;

  if (report.kpi_tracking && report.kpi_tracking.length > 0) {
    text += `KPI PERFORMANCE\n${'-'.repeat(50)}\n`;
    report.kpi_tracking.forEach((metric: any) => {
      text += `${metric.name}\n`;
      text += `  Current: ${metric.value?.toFixed(2) || 'N/A'} | Target: ${metric.targetValue?.toFixed(2) || 'N/A'}\n`;
      text += `  Change: ${metric.trend === 'up' ? '↑' : '↓'} ${Math.abs(metric.change || 0).toFixed(1)}%\n`;
    });
    text += '\n';
  }

  if (report.recommendations && report.recommendations.length > 0) {
    text += `RECOMMENDATIONS\n${'-'.repeat(50)}\n`;
    report.recommendations.forEach((rec: any) => {
      text += `${rec.title} (${rec.priority?.toUpperCase() || 'NORMAL'})\n`;
      text += `${rec.description}\nImpact: ${rec.impact}\n\n`;
    });
  }

  text += `View full report: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://unite-hub.app'}/founder/synthex/projects\n`;

  return text;
}

/**
 * Send report via email
 */
export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SendReportRequest = await req.json();
    const { reportId, recipientEmail, projectId } = body;

    if (!reportId || !recipientEmail) {
      return NextResponse.json({ error: 'reportId and recipientEmail required' }, { status: 400 });
    }

    logger.info('📧 Sending report email', { reportId, recipientEmail });

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('managed_service_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      logger.error('❌ Report not found', { reportId });
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch project
    let project = null;
    if (projectId || report.project_id) {
      const { data: projectData } = await supabaseAdmin
        .from('managed_service_projects')
        .select('*')
        .eq('id', projectId || report.project_id)
        .single();
      project = projectData;
    }

    // Build email content
    const htmlContent = buildReportHTML(report, project);
    const textContent = buildReportText(report, project);

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: `Weekly Report - Week ${report.report_number}`,
      html: htmlContent,
      text: textContent,
    });

    if (!result.success) {
      logger.error('❌ Failed to send email', { error: result.error });
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    // Update report status
    await supabaseAdmin
      .from('managed_service_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    // Create notification record
    await supabaseAdmin
      .from('managed_service_notifications')
      .insert({
        project_id: report.project_id,
        recipient_email: recipientEmail,
        notification_type: 'report_sent',
        subject: `Weekly Report - Week ${report.report_number}`,
        email_body_html: htmlContent,
        email_body_text: textContent,
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider: result.provider,
        message_id: result.messageId,
      });

    logger.info('✅ Report sent successfully', {
      reportId,
      recipientEmail,
      provider: result.provider,
      messageId: result.messageId,
    });

    return NextResponse.json({
      success: true,
      reportId,
      provider: result.provider,
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('❌ Send report error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
