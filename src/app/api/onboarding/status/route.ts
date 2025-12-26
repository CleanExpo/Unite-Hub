import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { withErrorBoundary, successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = 'force-dynamic';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const userId = req.nextUrl.searchParams.get('userId');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!userId || !workspaceId) {
    return errorResponse('userId and workspaceId required', 400);
  }

  const supabase = getSupabaseServer();

  // Fetch onboarding progress
  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return errorResponse(`Failed to fetch status: ${error.message}`, 500);
  }

  if (!data) {
    // No progress record yet - onboarding not started
    return successResponse({
      started: false,
      currentStep: 1,
      progressPercentage: 0,
      completedSteps: [],
      wizardCompleted: false,
      wizardSkipped: false,
    });
  }

  // Build completed steps array
  const completedSteps: string[] = [];
  if (data.step_gmail_connected) completedSteps.push('gmail_connected');
  if (data.step_first_contact_added) completedSteps.push('first_contact_added');
  if (data.step_first_email_sent) completedSteps.push('first_email_sent');
  if (data.step_viewed_analytics) completedSteps.push('viewed_analytics');
  if (data.step_completed_setup) completedSteps.push('completed_setup');

  return successResponse({
    started: true,
    currentStep: data.current_step,
    progressPercentage: data.progress_percentage,
    completedSteps,
    completedCount: data.completed_steps,
    totalSteps: data.total_steps,
    wizardCompleted: data.wizard_completed,
    wizardSkipped: data.wizard_skipped,
    lastActivity: data.last_activity_at,
  });
});
