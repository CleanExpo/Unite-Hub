/**
 * Linear Issue API Route
 *
 * GET /api/integrations/linear/issues/[issueId] - Get issue details
 * PATCH /api/integrations/linear/issues/[issueId] - Update an issue
 * DELETE /api/integrations/linear/issues/[issueId] - Delete an issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/integrations/linear/linearClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { issueId } = await params;

    if (!issueId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue ID is required',
        },
        { status: 400 }
      );
    }

    const linearClient = getLinearClient();
    const issue = await linearClient.getIssue(issueId);

    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error('[Linear API] Failed to fetch issue:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issue',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { issueId } = await params;

    if (!issueId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue ID is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      priority,
      stateId,
      assigneeId,
      projectId,
      labelIds,
      estimate,
      dueDate,
    } = body;

    const linearClient = getLinearClient();
    const issue = await linearClient.updateIssue(issueId, {
      title,
      description,
      priority,
      stateId,
      assigneeId,
      projectId,
      labelIds,
      estimate,
      dueDate,
    });

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error('[Linear API] Failed to update issue:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update issue',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    // TODO: Add authentication check
    // const { userId } = await authenticateRequest(request);

    const { issueId } = await params;

    if (!issueId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue ID is required',
        },
        { status: 400 }
      );
    }

    const linearClient = getLinearClient();
    const success = await linearClient.deleteIssue(issueId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete issue',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    console.error('[Linear API] Failed to delete issue:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete issue',
      },
      { status: 500 }
    );
  }
}
