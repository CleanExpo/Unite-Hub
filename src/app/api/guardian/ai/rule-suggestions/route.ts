/**
 * GET /api/guardian/ai/rule-suggestions - List rule suggestions
 * POST /api/guardian/ai/rule-suggestions - Generate new suggestions
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listSuggestions, buildAndStoreSuggestions } from '@/lib/guardian/ai/ruleSuggestionOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const status = req.nextUrl.searchParams.get('status');
  const source = req.nextUrl.searchParams.get('source');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const { suggestions, total } = await listSuggestions(workspaceId, {
    status: status || undefined,
    source: source || undefined,
    limit,
    offset,
  });

  return successResponse({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      title: s.title,
      rationale: s.rationale,
      source: s.source,
      status: s.status,
      confidence: s.confidence,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      createdBy: s.created_by,
    })),
    total,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { windowHours, maxSuggestions, expiresInDays } = body;

  const result = await buildAndStoreSuggestions(workspaceId, {
    windowHours: windowHours || 24,
    maxSuggestions: maxSuggestions || 10,
    expiresInDays: expiresInDays || 30,
    actor: 'api-admin',
  });

  return successResponse({
    created: result.created,
    aiUsed: result.aiUsed,
    suggestions: result.suggestions,
  });
});
