/**
 * GitHub Webhooks API Endpoint
 *
 * Receives and processes GitHub webhook events for real-time repo updates.
 *
 * @route POST /api/integrations/github/webhooks
 *
 * Events handled:
 * - push: Code pushed to repository
 * - pull_request: PR opened/closed/merged
 * - issues: Issue opened/closed
 * - release: New release published
 * - star: Repository starred/unstarred
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhookSignature } from "@/lib/integrations/github";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Get webhook headers
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  if (!event || !deliveryId) {
    return errorResponse("Missing webhook headers", 400);
  }

  // Get raw body for signature verification
  const payload = await req.text();

  // Verify signature if secret is configured
  if (GITHUB_WEBHOOK_SECRET && signature) {
    const isValid = await verifyWebhookSignature(
      payload,
      signature,
      GITHUB_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("[GitHub Webhook] Invalid signature");
      return errorResponse("Invalid signature", 401);
    }
  }

  // Parse payload
  const data = JSON.parse(payload);
  const action = data.action || null;

  console.log(`[GitHub Webhook] Received ${event}${action ? `:${action}` : ""}`);

  // Get repo ID from payload
  const repoGitHubId = data.repository?.id;

  if (!repoGitHubId) {
    // Some events (like ping) don't have repository
    if (event === "ping") {
      console.log("[GitHub Webhook] Ping received, webhook configured correctly");
      return successResponse({ message: "pong" });
    }
    return errorResponse("Missing repository in payload", 400);
  }

  // Find the repo in our database (admin bypass RLS)
  const { data: repo } = await supabaseAdmin
    .from("founder_github_repos")
    .select("id, workspace_id")
    .eq("github_repo_id", repoGitHubId)
    .single();

  // Store webhook event for processing
  const webhookData = {
    repo_id: repo?.id || null,
    event_type: event,
    action,
    delivery_id: deliveryId,
    payload: data,
    processed: false,
  };

  const { error: insertError } = await supabaseAdmin
    .from("founder_github_webhooks")
    .insert(webhookData);

  if (insertError) {
    console.error("[GitHub Webhook] Failed to store webhook:", insertError);
    // Don't fail the request, GitHub will retry
  }

  // Process common events synchronously for immediate updates
  if (repo) {
    try {
      switch (event) {
        case "push":
          await handlePushEvent(repo.id, data);
          break;

        case "pull_request":
          await handlePullRequestEvent(repo.id, repo.workspace_id, data);
          break;

        case "issues":
          await handleIssuesEvent(repo.id, repo.workspace_id, data);
          break;

        case "star":
          await handleStarEvent(repo.id, data);
          break;

        case "release":
          await handleReleaseEvent(repo.id, data);
          break;
      }

      // Mark as processed
      await supabaseAdmin
        .from("founder_github_webhooks")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("delivery_id", deliveryId);
    } catch (error) {
      console.error("[GitHub Webhook] Processing error:", error);
      await supabaseAdmin
        .from("founder_github_webhooks")
        .update({
          processing_error: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("delivery_id", deliveryId);
    }
  }

  return successResponse({ message: "Webhook received" });
});

// Event handlers

async function handlePushEvent(repoId: string, data: any): Promise<void> {
  // Update repo stats
  await supabaseAdmin
    .from("founder_github_repos")
    .update({
      sync_status: "pending",
      metadata: {
        last_push_at: new Date().toISOString(),
        last_push_ref: data.ref,
        last_push_commits: data.commits?.length || 0,
      },
    })
    .eq("id", repoId);
}

async function handlePullRequestEvent(
  repoId: string,
  workspaceId: string,
  data: any
): Promise<void> {
  const pr = data.pull_request;
  const action = data.action;

  // Map PR state
  let state: "open" | "closed" | "merged" = "open";
  if (pr.merged_at) {
    state = "merged";
  } else if (pr.closed_at) {
    state = "closed";
  }

  // Upsert PR
  await supabaseAdmin.from("founder_repo_items").upsert(
    {
      repo_id: repoId,
      workspace_id: workspaceId,
      github_item_id: pr.id,
      item_type: "pull_request",
      item_number: pr.number,
      title: pr.title,
      body: pr.body,
      state,
      labels: pr.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
      assignees:
        pr.assignees?.map((a: any) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })) || [],
      author_login: pr.user?.login,
      author_avatar_url: pr.user?.avatar_url,
      github_created_at: pr.created_at,
      github_updated_at: pr.updated_at,
      github_closed_at: pr.closed_at,
      github_merged_at: pr.merged_at,
      head_branch: pr.head?.ref,
      base_branch: pr.base?.ref,
      is_draft: pr.draft || false,
      mergeable: pr.mergeable,
    },
    {
      onConflict: "repo_id,github_item_id",
    }
  );

  // Update repo open issues count
  if (action === "opened" || action === "closed" || action === "reopened") {
    await updateRepoIssueCount(repoId);
  }
}

async function handleIssuesEvent(
  repoId: string,
  workspaceId: string,
  data: any
): Promise<void> {
  const issue = data.issue;
  const action = data.action;

  // Skip if this is actually a PR (they appear in issues API too)
  if (issue.pull_request) {
    return;
  }

  // Upsert issue
  await supabaseAdmin.from("founder_repo_items").upsert(
    {
      repo_id: repoId,
      workspace_id: workspaceId,
      github_item_id: issue.id,
      item_type: "issue",
      item_number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state as "open" | "closed",
      labels:
        issue.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
      assignees:
        issue.assignees?.map((a: any) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })) || [],
      author_login: issue.user?.login,
      author_avatar_url: issue.user?.avatar_url,
      github_created_at: issue.created_at,
      github_updated_at: issue.updated_at,
      github_closed_at: issue.closed_at,
    },
    {
      onConflict: "repo_id,github_item_id",
    }
  );

  // Update repo open issues count
  if (action === "opened" || action === "closed" || action === "reopened") {
    await updateRepoIssueCount(repoId);
  }
}

async function handleStarEvent(repoId: string, data: any): Promise<void> {
  const starsCount = data.repository?.stargazers_count || 0;

  await supabaseAdmin
    .from("founder_github_repos")
    .update({
      stars_count: starsCount,
      metadata: {
        last_star_action: data.action,
        last_star_at: new Date().toISOString(),
        starred_by: data.sender?.login,
      },
    })
    .eq("id", repoId);
}

async function handleReleaseEvent(repoId: string, data: any): Promise<void> {
  const release = data.release;

  await supabaseAdmin
    .from("founder_github_repos")
    .update({
      metadata: {
        latest_release: {
          tag: release.tag_name,
          name: release.name,
          published_at: release.published_at,
          url: release.html_url,
        },
      },
    })
    .eq("id", repoId);
}

async function updateRepoIssueCount(repoId: string): Promise<void> {
  // Count open issues/PRs
  const { count: issuesCount } = await supabaseAdmin
    .from("founder_repo_items")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", repoId)
    .eq("item_type", "issue")
    .eq("state", "open");

  await supabaseAdmin
    .from("founder_github_repos")
    .update({
      open_issues_count: issuesCount || 0,
    })
    .eq("id", repoId);
}

export const runtime = "nodejs";
