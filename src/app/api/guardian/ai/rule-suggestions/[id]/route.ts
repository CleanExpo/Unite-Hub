/**
 * GET /api/guardian/ai/rule-suggestions/[id] - Get suggestion detail
 * PATCH /api/guardian/ai/rule-suggestions/[id] - Update suggestion status
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSuggestion, updateSuggestionStatus } from '@/lib/guardian/ai/ruleSuggestionOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const suggestion = await getSuggestion(workspaceId, id);

  return successResponse({
    id: suggestion.id,
    title: suggestion.title,
    rationale: suggestion.rationale,
    source: suggestion.source,
    status: suggestion.status,
    confidence: suggestion.confidence,
    signals: suggestion.signals,
    ruleDraft: suggestion.rule_draft,
    safety: suggestion.safety,
    createdAt: suggestion.created_at,
    expiresAt: suggestion.expires_at,
    appliedRuleId: suggestion.applied_rule_id,
    metadata: suggestion.metadata,
  });
});

export const PATCH = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { status, metadata } = body;

  if (!status) throw new Error('status required');

  const updated = await updateSuggestionStatus(workspaceId, id, status, metadata);

  return successResponse({
    id: updated[0].id,
    status: updated[0].status,
    updatedAt: updated[0].updated_at,
  });
});
