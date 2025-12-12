/**
 * POST /api/guardian/ai/rule-suggestions/[id]/feedback - Record suggestion feedback
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { addSuggestionFeedback } from '@/lib/guardian/ai/ruleSuggestionOrchestrator';

export const POST = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { action, rating, reason, notes } = body;

  if (!action) throw new Error('action required');

  const feedback = await addSuggestionFeedback(workspaceId, id, {
    action,
    rating: rating ? parseInt(rating) : undefined,
    reason,
    notes,
    actor: 'api-admin',
  });

  return successResponse({
    id: feedback[0].id,
    action: feedback[0].action,
    createdAt: feedback[0].created_at,
  });
});
