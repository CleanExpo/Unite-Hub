import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  buildKnowledgeHubSummary,
  GuardianKnowledgeHubContext,
} from '@/lib/guardian/meta/knowledgeHubService';

/**
 * GET /api/guardian/meta/knowledge-hub/summary
 * Build complete knowledge hub summary with patterns and suggested playbooks
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const ctx: GuardianKnowledgeHubContext = {
    tenantId: workspaceId,
    now: new Date(),
  };

  const summary = await buildKnowledgeHubSummary(ctx);

  return successResponse({
    summary,
    timestamp: new Date().toISOString(),
  });
});
