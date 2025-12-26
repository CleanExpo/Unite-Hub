import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { withErrorBoundary, successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = 'force-dynamic';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { workspaceId, userId } = body;

  if (!workspaceId || !userId) {
    return errorResponse('workspaceId and userId required', 400);
  }

  const supabase = getSupabaseServer();

  // Mark wizard as skipped
  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .upsert({
      user_id: userId,
      workspace_id: workspaceId,
      wizard_skipped: true,
      wizard_skipped_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,workspace_id',
    })
    .select()
    .single();

  if (error) {
    return errorResponse(`Failed to skip onboarding: ${error.message}`, 500);
  }

  return successResponse({
    message: 'Onboarding skipped',
    progress: data,
  });
});
