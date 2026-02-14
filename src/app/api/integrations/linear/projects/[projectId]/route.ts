/**
 * Linear Project API Route (Individual Project Operations)
 *
 * GET /api/integrations/linear/projects/:projectId - Get project details
 * PATCH /api/integrations/linear/projects/:projectId - Update project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

/**
 * GET /api/integrations/linear/projects/:projectId
 * Get project details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { projectId } = await params;
    const linearClient = getLinearClient();
    const project = await linearClient.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('[Linear API] Failed to fetch project:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch Linear project',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/linear/projects/:projectId
 * Update project details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { projectId } = await params;
    const body = await request.json();
    const { name, description, state, startDate, targetDate } = body;

    // Validate state if provided
    const validStates = ['planned', 'started', 'paused', 'completed', 'canceled'];
    if (state && !validStates.includes(state)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid state. Must be one of: ${validStates.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const linearClient = getLinearClient();
    const project = await linearClient.updateProject(projectId, {
      name,
      description,
      state,
      startDate,
      targetDate,
    });

    return NextResponse.json({
      success: true,
      project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('[Linear API] Failed to update project:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update Linear project',
      },
      { status: 500 }
    );
  }
}
