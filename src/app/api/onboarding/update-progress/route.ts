import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { withErrorBoundary, successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = 'force-dynamic';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { workspaceId, userId, currentStep } = body;

  if (!workspaceId || !userId || !currentStep) {
    return errorResponse('workspaceId, userId, and currentStep required', 400);
  }

  const supabase = getSupabaseServer();

  // Update current step
  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .update({
      current_step: currentStep,
    })
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return errorResponse(`Failed to update progress: ${error.message}`, 500);
  }

  return successResponse({
    progress: data,
  });
});
