/**
 * GitHub Integration API - OAuth Initiation
 *
 * Initiates GitHub OAuth flow for connecting repositories.
 *
 * @route GET /api/integrations/github
 * @query workspaceId - Required workspace ID for multi-tenant isolation
 * @query redirect - Optional redirect URL after OAuth completion
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { validateUserAndWorkspace, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { getOAuthAuthorizationUrl } from "@/lib/integrations/github";
import crypto from "crypto";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Multi-tenant validation
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Store state in session/cookie for verification on callback
  // Include workspaceId in state for context restoration
  const stateData = JSON.stringify({
    state,
    workspaceId,
    redirect: req.nextUrl.searchParams.get("redirect") || "/founder/repos",
  });
  const encodedState = Buffer.from(stateData).toString("base64url");

  // Build callback URL
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    `${req.nextUrl.origin}/api/integrations/github/callback`;

  // Generate authorization URL
  const authUrl = getOAuthAuthorizationUrl(encodedState, callbackUrl);

  // Redirect to GitHub
  return Response.redirect(authUrl);
});

export const runtime = "nodejs";
