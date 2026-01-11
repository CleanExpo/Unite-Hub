import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import {
  generateUICode,
  refineUICode,
  validateGeneratedCode,
  type UIGenerationRequest,
} from "@/lib/synthex/stitch-inspired/ui-code-generator";

/**
 * POST /api/synthex/design-studio/generate?workspaceId={id}
 *
 * Generate initial UI design from natural language prompt
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId query parameter required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const generationRequest: UIGenerationRequest = body;

  if (!generationRequest.prompt) {
    return errorResponse("Design prompt is required", 400);
  }

  try {
    // Generate UI code
    const result = await generateUICode(generationRequest);

    // Validate generated code
    const validation = await validateGeneratedCode(result.code);

    // Store in database if not draft-only
    const supabase = getSupabaseServer();
    const { data: project } = await supabase
      .from("synthex_design_projects")
      .insert({
        workspace_id: workspaceId,
        project_name: `Design - ${new Date().toLocaleString()}`,
        project_type: "landing-page",
        current_version: 1,
        status: "draft",
      })
      .select()
      .single();

    if (project) {
      // Store version
      await supabase
        .from("synthex_design_versions")
        .insert({
          project_id: project.id,
          version_number: 1,
          prompt: generationRequest.prompt,
          generated_code: result.code,
          component_tree: JSON.stringify(result.componentTree),
          tokens_used: result.metadata.tokensUsed,
          generation_cost: result.metadata.cost,
        });
    }

    return successResponse({
      code: result.code,
      componentTree: result.componentTree,
      assets: result.assets,
      metadata: result.metadata,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        accessibilityScore: validation.metrics.accessibilityScore,
      },
      projectId: project?.id,
      message: "Design generated successfully",
    });
  } catch (error) {
    console.error("Design generation failed:", error);
    return errorResponse(
      `Failed to generate design: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
});

/**
 * POST /api/synthex/design-studio/refine?workspaceId={id}
 *
 * Refine existing design based on feedback
 */
export const PUT = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId query parameter required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const refinementRequest: UIGenerationRequest & {
    projectId: string;
    previousVersion: number;
  } = body;

  if (!refinementRequest.previousCode || !refinementRequest.refinements) {
    return errorResponse(
      "previousCode and refinements are required for refinement",
      400
    );
  }

  try {
    // Refine UI code
    const result = await refineUICode(refinementRequest);

    // Validate refined code
    const validation = await validateGeneratedCode(result.code);

    // Store refined version in database
    const supabase = getSupabaseServer();
    await supabase
      .from("synthex_design_versions")
      .insert({
        project_id: refinementRequest.projectId,
        version_number: refinementRequest.previousVersion + 1,
        prompt: refinementRequest.prompt,
        refinement_from_version: refinementRequest.previousVersion,
        generated_code: result.code,
        component_tree: JSON.stringify(result.componentTree),
        tokens_used: result.metadata.tokensUsed,
        generation_cost: result.metadata.cost,
      });

    return successResponse({
      code: result.code,
      componentTree: result.componentTree,
      assets: result.assets,
      metadata: result.metadata,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        accessibilityScore: validation.metrics.accessibilityScore,
      },
      message: "Design refined successfully",
    });
  } catch (error) {
    console.error("Design refinement failed:", error);
    return errorResponse(
      `Failed to refine design: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
});

/**
 * GET /api/synthex/design-studio?workspaceId={id}
 *
 * Fetch design projects and versions
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId query parameter required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const supabase = getSupabaseServer();

    const { data: projects, error } = await supabase
      .from("synthex_design_projects")
      .select(
        `
        id,
        project_name,
        project_type,
        current_version,
        status,
        created_at,
        synthex_design_versions(*)
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(`Failed to fetch projects: ${error.message}`, 500);
    }

    return successResponse({
      projects: projects || [],
      count: projects?.length || 0,
    });
  } catch (error) {
    console.error("Failed to fetch design projects:", error);
    return errorResponse(
      `Failed to fetch projects: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
});
