/**
 * GET /api/competitors?workspaceId=...
 * POST /api/competitors?workspaceId=...
 *
 * Manage competitors for a workspace
 */

import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);

  return successResponse(data || []);
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { domain, name, category = "website", social_handles } = body;

  if (!domain || !name) {
    return errorResponse("domain and name required", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("competitors")
    .insert({
      workspace_id: workspaceId,
      domain: domain.toLowerCase(),
      name,
      category,
      social_handles: social_handles || null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return successResponse(data, 201);
});
