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

  // Mark wizard as completed
  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .update({
      wizard_completed: true,
      wizard_completed_at: new Date().toISOString(),
      step_completed_setup: true,
      step_completed_setup_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return errorResponse(`Failed to complete wizard: ${error.message}`, 500);
  }

  return successResponse({
    message: 'Onboarding wizard completed',
    progress: data,
  });
});
