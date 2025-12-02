/**
 * Weekly Report Scheduler
 * GET /api/managed/scheduler/weekly
 *
 * Cron job scheduled to run every Monday at 9 AM UTC
 * Generates weekly reports for all active managed service projects
 * Queues email notifications for distribution
 *
 * Can be triggered via:
 * 1. Vercel Cron: Set cron in vercel.json (0 9 * * 1)
 * 2. External scheduler (GitHub Actions, aws-events, etc)
 * 3. Manual API call for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/managed/scheduler/weekly' });

/**
 * Verify Vercel Cron signature
 */
function verifyVercelCron(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET || 'development-secret';
  return authHeader === `Bearer ${expected}`;
}

/**
 * Calculate week number for date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get date range for week (Monday-Sunday)
 */
function getWeekDateRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday

  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    logger.info('🔔 Weekly scheduler triggered', {
      timestamp: new Date().toISOString(),
      path: req.nextUrl.pathname,
    });

    // Verify Vercel Cron signature (optional, but recommended)
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && !verifyVercelCron(authHeader)) {
      logger.warn('⚠️ Invalid cron authorization', { authHeader });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Get all active projects
    const { data: projects, error: projectsError } = await supabase
      .from('managed_service_projects')
      .select('id, project_name, client_email, status')
      .eq('status', 'active');

    if (projectsError || !projects) {
      logger.error('❌ Failed to fetch active projects', { error: projectsError });
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    logger.info('📊 Found active projects', { count: projects.length });

    const weekNumber = getWeekNumber(new Date());
    const { start: weekStart, end: weekEnd } = getWeekDateRange();
    const results = {
      timestamp: new Date().toISOString(),
      weekNumber,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalProjects: projects.length,
      generated: 0,
      queued: 0,
      failed: 0,
      projects: [] as any[],
    };

    // Process each project
    for (const project of projects) {
      try {
        logger.info('📝 Processing project', {
          projectId: project.id,
          projectName: project.project_name,
        });

        // Check if report already exists for this week
        const { data: existingReport } = await supabase
          .from('managed_service_reports')
          .select('id')
          .eq('project_id', project.id)
          .eq('report_number', weekNumber)
          .single();

        if (existingReport && !process.env.FORCE_GENERATE_REPORT) {
          logger.info('ℹ️ Report already exists for week', {
            projectId: project.id,
            weekNumber,
          });
          results.projects.push({
            projectId: project.id,
            projectName: project.project_name,
            status: 'skipped',
            reason: 'Report already exists for this week',
          });
          continue;
        }

        // Call report generation API
        const generateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008'}/api/managed/reports/generate`;
        const generateResponse = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            weekNumber,
            forceGenerate: !!process.env.FORCE_GENERATE_REPORT,
          }),
        });

        if (!generateResponse.ok) {
          throw new Error(`Generation failed: ${generateResponse.statusText}`);
        }

        const { reports } = await generateResponse.json();

        if (!reports || reports.length === 0) {
          throw new Error('No reports returned from generation');
        }

        const reportId = reports[0]?.reportId;

        if (!reportId) {
          throw new Error('No reportId in response');
        }

        // Queue email notification
        const { error: notificationError } = await supabase
          .from('managed_service_notifications')
          .insert({
            project_id: project.id,
            recipient_email: project.client_email,
            notification_type: 'report_sent',
            subject: `Weekly Report - Week ${weekNumber}`,
            email_body_html: '<p>Your weekly report is ready. Generating preview...</p>',
            email_body_text: 'Your weekly report is ready.',
            status: 'pending',
            scheduled_for: new Date().toISOString(),
          });

        if (notificationError) {
          logger.warn('⚠️ Failed to queue notification', {
            projectId: project.id,
            error: notificationError,
          });
        } else {
          results.queued++;
        }

        results.generated++;
        results.projects.push({
          projectId: project.id,
          projectName: project.project_name,
          reportId,
          clientEmail: project.client_email,
          status: 'generated',
        });

        logger.info('✅ Report generated and queued', {
          projectId: project.id,
          reportId,
        });
      } catch (error) {
        results.failed++;
        logger.error('❌ Project processing failed', {
          projectId: project.id,
          error,
        });
        results.projects.push({
          projectId: project.id,
          projectName: project.project_name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Delay between projects to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Log completion
    logger.info('✅ Weekly scheduler completed', {
      ...results,
      timestamp: new Date().toISOString(),
    });

    // Store scheduler run in database for audit trail
    await supabase
      .from('auditLogs')
      .insert({
        event: 'weekly_scheduler_run',
        details: results,
        timestamp: new Date().toISOString(),
      })
      .catch((err) => logger.warn('⚠️ Failed to log scheduler run', { err }));

    return NextResponse.json(results);
  } catch (error) {
    logger.error('❌ Weekly scheduler error', { error });

    return NextResponse.json(
      {
        error: 'Scheduler error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Allow POST for manual triggering (development/testing)
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
