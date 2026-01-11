import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { enrichUpliftTaskHints, formatEnrichedHints } from '@/lib/guardian/meta/upliftAiHelper';

/**
 * POST: Enrich uplift task hints using AI
 * Optional: can be used to generate detailed guidance for uplift tasks
 * Feature flag gated: enableAiHints controls availability
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { taskTitle, taskDescription, taskCategory, taskPriority, taskEffort, currentScore, targetScore } = body;

  if (!taskTitle || !taskDescription) {
    return errorResponse('taskTitle and taskDescription required', 400);
  }

  try {
    const hints = await enrichUpliftTaskHints(
      {
        title: taskTitle,
        description: taskDescription,
        category: taskCategory || 'other',
        priority: taskPriority || 'medium',
        effortEstimate: taskEffort || 'M',
        hints: {},
        linkTargets: [],
      },
      {
        currentScore,
        targetScore,
        category: taskCategory,
      }
    );

    const formattedHints = formatEnrichedHints(hints);

    return successResponse({
      hints,
      formattedHints,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Failed to enrich hints', 500);
  }
});
