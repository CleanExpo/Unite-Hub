 
import { NextRequest } from "next/server";
import { withErrorBoundary, successResponse } from "@/lib/errors/boundaries";
import { getSupabaseServer } from "@/lib/supabase";
import { AuthenticationError, AuthorizationError, NotFoundError, DatabaseError, ValidationError } from "@/core/errors/app-error";

/**
 * POST /api/approvals/[id]/decline
 * Decline an approval request
 */
export const POST = withErrorBoundary(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  // Authenticate and get user
  let userId: string;
  let orgId: string;

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
throw new AuthenticationError();
}
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
throw new AuthenticationError();
}
      userId = data.user.id;
    }

    // Get org_id from user profile or request context
    const supabase = await getSupabaseServer();
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("org_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile?.org_id) {
      throw new AuthenticationError();
    }
    orgId = userProfile.org_id;
  } catch (error) {
    if (error instanceof AuthenticationError) {
throw error;
}
    throw new AuthenticationError();
  }

  const body = await request.json();
  const { reviewedById, reason } = body;

  // Validate reason is provided
  if (!reason) {
    throw new ValidationError(
      [{ field: "reason", message: "Reason is required for decline" }],
      "Validation failed"
    );
  }

  // Get approval to verify org ownership
  const supabase = await getSupabaseServer();
  const { data: existingApproval, error: fetchError } = await supabase
    .from("approvals")
    .select("org_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingApproval) {
    throw new NotFoundError("Approval", id);
  }

  // Verify org ownership
  if (existingApproval.org_id !== orgId) {
    throw new AuthorizationError("Access denied");
  }

  const { data: approval, error } = await supabase
    .from("approvals")
    .update({
      status: "declined",
      reviewed_by_id: reviewedById || userId,
      reviewed_at: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to decline: ${error.message}`);
  }

  return successResponse({ approval });
});
