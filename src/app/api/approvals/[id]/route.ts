 
import type { NextRequest } from "next/server";
import { withErrorBoundary, AuthenticationError, AuthorizationError, NotFoundError, DatabaseError, successResponse } from "@/lib/errors/boundaries";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * GET /api/approvals/[id]
 * Get a single approval by ID
 */
export const GET = withErrorBoundary(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // Apply rate limiting (returns early if rate limited - NOT wrapped by error boundary)
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Validate user authentication
  let user;
  try {
    user = await validateUserAuth(request);
  } catch {
    throw new AuthenticationError("Authentication required");
  }

  const { id } = await context.params;

  const supabase = await getSupabaseServer();
  const { data: approval, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !approval) {
    throw new NotFoundError(`Approval ${id} not found`);
  }

  // Verify org ownership
  if (approval.org_id !== user.orgId) {
    throw new AuthorizationError("Access denied to this approval");
  }

  return successResponse({
    approval,
  }, undefined, undefined, 200);
});

/**
 * DELETE /api/approvals/[id]
 * Delete an approval
 */
export const DELETE = withErrorBoundary(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // Apply rate limiting (returns early if rate limited - NOT wrapped by error boundary)
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Validate user authentication
  let user;
  try {
    user = await validateUserAuth(request);
  } catch {
    throw new AuthenticationError("Authentication required");
  }

  const { id } = await context.params;

  // Get approval to verify org ownership
  const supabase = await getSupabaseServer();
  const { data: approval, error: fetchError } = await supabase
    .from("approvals")
    .select("org_id")
    .eq("id", id)
    .single();

  if (fetchError || !approval) {
    throw new NotFoundError(`Approval ${id} not found`);
  }

  // Verify org ownership
  if (approval.org_id !== user.orgId) {
    throw new AuthorizationError("Access denied to this approval");
  }

  const { error } = await supabase.from("approvals").delete().eq("id", id);

  if (error) {
    throw new DatabaseError("Failed to delete approval");
  }

  return successResponse({
    success: true,
    message: "Approval deleted successfully",
  }, undefined, undefined, 200);
});
