import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { withErrorBoundary, successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = 'force-dynamic';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { workspaceId, userId, stepId } = body;

  if (!workspaceId || !userId || !stepId) {
    return errorResponse('workspaceId, userId, and stepId required', 400);
  }

  const supabase = getSupabaseServer();

  // Map stepId to column name
  const stepColumnMap: Record<string, string> = {
    'gmail_connected': 'step_gmail_connected',
    'first_contact_added': 'step_first_contact_added',
    'first_email_sent': 'step_first_email_sent',
    'viewed_analytics': 'step_viewed_analytics',
    'completed_setup': 'step_completed_setup',
  };

  const stepColumn = stepColumnMap[stepId];
  if (!stepColumn) {
    return errorResponse(`Invalid stepId: ${stepId}`, 400);
  }

  // Get or create onboarding progress record
  let { data: progress } = await supabase
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!progress) {
    // Create initial record
    const { data: newProgress, error: createError } = await supabase
      .from('user_onboarding_progress')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (createError) {
      return errorResponse(`Failed to create progress: ${createError.message}`, 500);
    }

    progress = newProgress;
  }

  // Update step completion
  const { data: updated, error } = await supabase
    .from('user_onboarding_progress')
    .update({
      [stepColumn]: true,
      [`${stepColumn}_at`]: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return errorResponse(`Failed to complete step: ${error.message}`, 500);
  }

  return successResponse({
    message: `Step ${stepId} completed`,
    progress: updated,
  });
});
