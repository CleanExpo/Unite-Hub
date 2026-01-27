/**
 * Linear Issues API Route
 *
 * POST /api/integrations/linear/issues - Create a new issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const body = await request.json();

    const {
      teamId,
      title,
      description,
      priority,
      projectId,
      assigneeId,
      labelIds,
      estimate,
      dueDate,
    } = body;

    if (!teamId || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'teamId and title are required',
        },
        { status: 400 }
      );
    }

    const linearClient = getLinearClient();
    const issue = await linearClient.createIssue({
      teamId,
      title,
      description,
      priority,
      projectId,
      assigneeId,
      labelIds,
      estimate,
      dueDate,
    });

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error('[Linear API] Failed to create issue:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Linear issue',
      },
      { status: 500 }
    );
  }
}
