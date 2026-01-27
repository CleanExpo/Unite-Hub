/**
 * Linear Projects API Route
 *
 * GET /api/integrations/linear/projects - List all Linear projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const linearClient = getLinearClient();
    const projects = await linearClient.getProjects();

    return NextResponse.json({
      success: true,
      projects,
      total: projects.length,
    });
  } catch (error) {
    console.error('[Linear API] Failed to fetch projects:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Linear projects',
      },
      { status: 500 }
    );
  }
}
