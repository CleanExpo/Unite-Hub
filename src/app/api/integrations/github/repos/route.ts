/**
 * GitHub Repos API Endpoint
 *
 * Lists and manages connected GitHub repositories.
 *
 * @route GET /api/integrations/github/repos - List connected repos
 * @route POST /api/integrations/github/repos - Sync repo from GitHub
 * @route DELETE /api/integrations/github/repos - Disconnect a repo
 * @query workspaceId - Required workspace ID for multi-tenant isolation
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import {
  validateUserAndWorkspace,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createGitHubOAuthClient,
  getRepo,
  getRepoStats,
} from "@/lib/integrations/github";

// GET - List connected repos
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  const { data: repos, error } = await supabase
    .from("founder_github_repos")
    .select(
      `
      id,
      github_repo_id,
      repo_url,
      repo_name,
      repo_owner,
      full_name,
      description,
      language,
      is_private,
      is_fork,
      is_archived,
      default_branch,
      stars_count,
      forks_count,
      open_issues_count,
      watchers_count,
      size_kb,
      sync_status,
      last_sync_at,
      metadata,
      created_at,
      updated_at
    `
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[GitHub Repos API] Error:", error);
    return errorResponse("Failed to fetch repos", 500);
  }

  return successResponse({
    repos: repos || [],
    total: repos?.length || 0,
  });
});

// POST - Sync/refresh repo data
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { repoId, action = "sync" } = body;

  if (!repoId) {
    return errorResponse("repoId required", 400);
  }

  const supabase = getSupabaseServer();

  // Get repo with token
  const { data: repo, error: fetchError } = await supabase
    .from("founder_github_repos")
    .select("*")
    .eq("id", repoId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !repo) {
    return errorResponse("Repo not found", 404);
  }

  if (action === "sync") {
    try {
      // Decrypt token and create client
      const accessToken = Buffer.from(
        repo.access_token_encrypted,
        "base64"
      ).toString();
      const octokit = createGitHubOAuthClient(accessToken);

      // Fetch fresh repo data
      const freshRepo = await getRepo(octokit, repo.repo_owner, repo.repo_name);

      // Fetch stats
      const stats = await getRepoStats(
        octokit,
        repo.repo_owner,
        repo.repo_name
      );

      // Update repo in database
      const { error: updateError } = await supabase
        .from("founder_github_repos")
        .update({
          description: freshRepo.description,
          language: freshRepo.language,
          is_private: freshRepo.private,
          is_archived: freshRepo.archived,
          default_branch: freshRepo.default_branch,
          stars_count: freshRepo.stargazers_count,
          forks_count: freshRepo.forks_count,
          open_issues_count: freshRepo.open_issues_count,
          watchers_count: freshRepo.watchers_count,
          size_kb: freshRepo.size,
          sync_status: "synced",
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        })
        .eq("id", repoId);

      if (updateError) {
        throw updateError;
      }

      // Store metrics snapshot
      const { error: metricsError } = await supabase
        .from("founder_repo_metrics")
        .upsert(
          {
            repo_id: repoId,
            metric_date: new Date().toISOString().split("T")[0],
            commits_count: stats.commits_count,
            prs_open: stats.prs_open,
            prs_merged: stats.prs_merged,
            issues_open: stats.issues_open,
            issues_closed: stats.issues_closed,
            contributors_active: stats.contributors_active,
          },
          {
            onConflict: "repo_id,metric_date",
          }
        );

      if (metricsError) {
        console.warn("[GitHub Repos API] Failed to store metrics:", metricsError);
      }

      return successResponse({
        message: "Repo synced successfully",
        repo: { ...repo, ...freshRepo },
        stats,
      });
    } catch (error) {
      console.error("[GitHub Repos API] Sync failed:", error);

      // Update sync status to error
      await supabase
        .from("founder_github_repos")
        .update({
          sync_status: "error",
          last_sync_error: error instanceof Error ? error.message : "Sync failed",
        })
        .eq("id", repoId);

      return errorResponse("Sync failed", 500);
    }
  }

  return errorResponse("Invalid action", 400);
});

// DELETE - Disconnect repo
export const DELETE = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { repoId } = body;

  if (!repoId) {
    return errorResponse("repoId required", 400);
  }

  const supabase = getSupabaseServer();

  // Delete repo (cascade will handle metrics and items)
  const { error } = await supabase
    .from("founder_github_repos")
    .delete()
    .eq("id", repoId)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("[GitHub Repos API] Delete failed:", error);
    return errorResponse("Failed to disconnect repo", 500);
  }

  return successResponse({ message: "Repo disconnected" });
});

export const runtime = "nodejs";
