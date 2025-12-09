/**
 * Skill Intelligence Dashboard API
 * Serves consolidated analytics data from reports
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DashboardData {
  svie: any;
  drift: any;
  heatmap: any;
  appm: any;
  srre: any;
}

/**
 * Load latest report of a given type
 */
function loadLatestReport(reportDir: string, pattern: string): any {
  try {
    if (!fs.existsSync(reportDir)) {
      console.warn(`Report directory not found: ${reportDir}`);
      return null;
    }

    const files = fs.readdirSync(reportDir)
      .filter(f => f.includes(pattern) && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.warn(`No reports matching pattern: ${pattern}`);
      return null;
    }

    const content = fs.readFileSync(path.join(reportDir, files[0]), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load report ${pattern}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Use reports directory (relative to project root)
    const reportDir = path.join(process.cwd(), 'reports');

    // Load all reports
    const dashboardData: DashboardData = {
      svie: loadLatestReport(reportDir, 'SVIE_ANALYSIS'),
      drift: loadLatestReport(reportDir, 'SKILL_DRIFT'),
      heatmap: loadLatestReport(reportDir, 'SKILL_HEATMAP'),
      appm: loadLatestReport(reportDir, 'agent_performance_prediction'),
      srre: loadLatestReport(reportDir, 'skill_refactor_plan')
    };

    // Check if we have any data
    if (!Object.values(dashboardData).some(v => v)) {
      return NextResponse.json(
        { error: 'No analytics data available. Run shadow observer analysis first.' },
        { status: 404 }
      );
    }

    // Add metadata
    const response = {
      ...dashboardData,
      metadata: {
        generated: new Date().toISOString(),
        reportDir,
        hasData: {
          svie: !!dashboardData.svie,
          drift: !!dashboardData.drift,
          heatmap: !!dashboardData.heatmap,
          appm: !!dashboardData.appm,
          srre: !!dashboardData.srre
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Skill Intelligence API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
