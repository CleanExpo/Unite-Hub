/**
 * Real-time Authentication Token API
 * POST /api/realtime/token?workspaceId=xxx
 *
 * Returns Ably authentication token for client-side WebSocket connection
 * Token is workspace-scoped (can only subscribe to threats:workspace-{workspaceId} channel)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { generateAblyToken } from '@/lib/realtime/ably-client';

/**
 * POST /api/realtime/token
 * Generate Ably authentication token for client connection
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  // Validate workspace access
  await validateUserAndWorkspace(req, workspaceId);

  try {
    // Generate Ably token (workspace-scoped)
    const token = await generateAblyToken(workspaceId);

    return successResponse({
      status: 'success',
      token,
      expiresIn: 3600, // 1 hour
      workspace: workspaceId,
    });
  } catch (error) {
    console.error('[Realtime API] Failed to generate token:', error);
    return errorResponse('Failed to generate authentication token', 500);
  }
});

/**
 * GET /api/realtime/token
 * Get authentication token (same as POST)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  return POST(req);
});
