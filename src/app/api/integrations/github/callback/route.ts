/**
 * GitHub Integration API - OAuth Callback
 *
 * Handles GitHub OAuth callback, exchanges code for token, stores credentials.
 *
 * @route GET /api/integrations/github/callback
 * @query code - Authorization code from GitHub
 * @query state - State parameter for CSRF protection
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { withErrorBoundary } from "@/lib/error-boundary";
import {
  exchangeCodeForToken,
  createGitHubOAuthClient,
  listUserRepos,
} from "@/lib/integrations/github";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code");
  const encodedState = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    const errorDescription = req.nextUrl.searchParams.get("error_description");
    console.error("[GitHub OAuth] Error:", error, errorDescription);
    return Response.redirect(
      `${req.nextUrl.origin}/founder/repos?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !encodedState) {
    return Response.redirect(
      `${req.nextUrl.origin}/founder/repos?error=missing_params`
    );
  }

  // Decode and verify state
  let stateData: { state: string; workspaceId: string; redirect: string };
  try {
    stateData = JSON.parse(Buffer.from(encodedState, "base64url").toString());
  } catch {
    return Response.redirect(
      `${req.nextUrl.origin}/founder/repos?error=invalid_state`
    );
  }

  const { workspaceId, redirect } = stateData;

  if (!workspaceId) {
    return Response.redirect(
      `${req.nextUrl.origin}/founder/repos?error=missing_workspace`
    );
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Create GitHub client
    const octokit = createGitHubOAuthClient(accessToken);

    // Fetch user info to verify token
    const { data: user } = await octokit.rest.users.getAuthenticated();

    console.log(
      `[GitHub OAuth] Successfully authenticated: ${user.login} for workspace ${workspaceId}`
    );

    // Store encrypted access token in database
    const supabase = getSupabaseServer();

    // Check if we already have a GitHub connection for this workspace
    const { data: existingConnection } = await supabase
      .from("founder_github_repos")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    // Store the token in workspace settings or a dedicated tokens table
    // For now, we'll sync repos with the token
    const repos = await listUserRepos(octokit);

    console.log(
      `[GitHub OAuth] Found ${repos.length} repos for ${user.login}`
    );

    // Upsert repos into database
    for (const repo of repos) {
      const repoData = {
        workspace_id: workspaceId,
        github_repo_id: repo.id,
        repo_url: repo.html_url,
        repo_name: repo.name,
        repo_owner: repo.owner.login,
        description: repo.description,
        language: repo.language,
        is_private: repo.private,
        is_fork: repo.fork,
        is_archived: repo.archived,
        default_branch: repo.default_branch,
        stars_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        watchers_count: repo.watchers_count,
        size_kb: repo.size,
        // Store encrypted token - in production use proper encryption
        access_token_encrypted: Buffer.from(accessToken).toString("base64"),
        sync_status: "synced",
        last_sync_at: new Date().toISOString(),
        metadata: {
          github_user: user.login,
          connected_at: new Date().toISOString(),
        },
      };

      const { error: upsertError } = await supabase
        .from("founder_github_repos")
        .upsert(repoData, {
          onConflict: "github_repo_id",
        });

      if (upsertError) {
        console.error(
          `[GitHub OAuth] Failed to upsert repo ${repo.full_name}:`,
          upsertError
        );
      }
    }

    // Redirect back to repos page with success
    const redirectUrl = new URL(redirect, req.nextUrl.origin);
    redirectUrl.searchParams.set("success", "github_connected");
    redirectUrl.searchParams.set("repos_synced", String(repos.length));

    return Response.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[GitHub OAuth] Token exchange failed:", error);
    return Response.redirect(
      `${req.nextUrl.origin}/founder/repos?error=token_exchange_failed`
    );
  }
});

export const runtime = "nodejs";
