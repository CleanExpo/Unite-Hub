/**
 * Repo Intelligence Agent API Endpoint
 *
 * Triggers AI analysis of GitHub repositories.
 *
 * @route POST /api/agents/repo-intelligence
 * @body workspaceId - Required workspace ID
 * @body repoId - Repository to analyze
 * @body analysisType - Type of analysis (issues, pull_requests, health)
 * @body options - Optional analysis options
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
import { executeRepoAnalysis } from "@/lib/agents/repo-intelligence";

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { workspaceId, repoId, analysisType, options } = body;

  // Validation
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  if (!repoId) {
    return errorResponse("repoId required", 400);
  }

  if (!analysisType || !["issues", "pull_requests", "health"].includes(analysisType)) {
    return errorResponse("Valid analysisType required (issues, pull_requests, health)", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  console.log(
    `[RepoIntelligence API] Starting ${analysisType} analysis for repo ${repoId}`
  );

  try {
    const result = await executeRepoAnalysis({
      workspaceId,
      repoId,
      analysisType,
      options,
    });

    return successResponse(result);
  } catch (error) {
    console.error("[RepoIntelligence API] Analysis failed:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Analysis failed",
      500
    );
  }
});

export const runtime = "nodejs";
