/**
 * Linear Project Issues API Route
 *
 * GET /api/integrations/linear/projects/[projectId]/issues - Get issues for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project ID is required',
        },
        { status: 400 }
      );
    }

    const linearClient = getLinearClient();
    const issues = await linearClient.getProjectIssues(projectId);

    return NextResponse.json({
      success: true,
      issues,
      total: issues.length,
    });
  } catch (error) {
    console.error('[Linear API] Failed to fetch project issues:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project issues',
      },
      { status: 500 }
    );
  }
}
