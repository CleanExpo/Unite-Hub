/**
 * Weekly Report Generation Endpoint
 * POST /api/managed/reports/generate
 *
 * Generates weekly reports for all active managed service projects
 * Retrieves GA4 and GSC metrics, creates recommendations, queues emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';
import { generateWeeklyReport } from '@/lib/managed/ReportGenerationEngine';

const logger = createApiLogger({ route: '/api/managed/reports/generate' });

interface GenerateReportRequest {
  projectId?: string;
  weekNumber?: number;
  forceGenerate?: boolean;
}

/**
 * Generate weekly reports for projects
 * If projectId is provided, generate for that project only
 * Otherwise, generate for all active projects
 */
export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body: GenerateReportRequest = await req.json();

    logger.info('📊 Generating weekly reports', {
      projectId: body.projectId,
      weekNumber: body.weekNumber,
    });

    let projects = [];

    if (body.projectId) {
      // Generate for specific project
      const { data: project, error } = await supabaseAdmin
        .from('managed_service_projects')
        .select('*')
        .eq('id', body.projectId)
        .single();

      if (error || !project) {
        logger.warn('⚠️ Project not found', { projectId: body.projectId });
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      projects = [project];
    } else {
      // Generate for all active projects
      const { data: activeProjects, error } = await supabaseAdmin
        .from('managed_service_projects')
        .select('*')
        .eq('status', 'active');

      if (error) {
        logger.error('❌ Failed to fetch active projects', { error });
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
      }

      projects = activeProjects || [];
    }

    const results = {
      totalProjects: projects.length,
      generated: 0,
      failed: 0,
      reports: [] as any[],
    };

    // Generate reports for each project
    for (const project of projects) {
      try {
        // Get current week number
        const weekNumber = body.weekNumber || getWeekNumber(new Date());

        logger.info('📝 Generating report', {
          projectId: project.id,
          projectName: project.project_name,
          weekNumber,
        });

        const reportId = await generateWeeklyReport(project.id, weekNumber);

        if (reportId) {
          results.generated++;
          results.reports.push({
            projectId: project.id,
            projectName: project.project_name,
            reportId,
            status: 'generated',
          });

          logger.info('✅ Report generated', {
            projectId: project.id,
            reportId,
          });
        } else {
          results.failed++;
          logger.warn('⚠️ Report generation returned null', {
            projectId: project.id,
          });
        }
      } catch (error) {
        results.failed++;
        logger.error('❌ Report generation failed', {
          projectId: project.id,
          error,
        });
      }

      // Small delay between projects to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logger.info('✅ Weekly report generation complete', results);

    return NextResponse.json(results);
  } catch (error) {
    logger.error('❌ Report generation endpoint error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
