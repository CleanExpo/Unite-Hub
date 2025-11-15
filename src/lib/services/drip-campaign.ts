import { db } from "@/lib/db";
import { supabase, supabaseServer } from "@/lib/supabase";
import { generatePersonalizedContent } from "@/lib/agents/content-personalization";
import { sendEmailViaGmail } from "@/lib/integrations/gmail";
import {
  DripCampaign,
  CampaignStep,
  CampaignEnrollment,
  CampaignExecutionLog,
} from "@/lib/models/drip-campaign";

export async function createDripCampaign(
  workspaceId: string,
  data: Partial<DripCampaign>
): Promise<DripCampaign> {
  const campaign = await supabaseServer
    .from("drip_campaigns")
    .insert([
      {
        workspace_id: workspaceId,
        ...data,
      },
    ])
    .select()
    .single();

  if (campaign.error) throw campaign.error;
  return campaign.data;
}

export async function addCampaignStep(
  campaignId: string,
  stepData: Partial<CampaignStep>,
  workspaceId?: string
): Promise<CampaignStep> {
  // Validate campaign belongs to workspace (if workspaceId provided)
  if (workspaceId) {
    const campaign = await supabase
      .from("drip_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("workspace_id", workspaceId)
      .single();

    if (campaign.error) {
      throw new Error("Campaign not found or access denied");
    }
  }

  const step = await supabaseServer
    .from("campaign_steps")
    .insert([
      {
        campaign_id: campaignId,
        ...stepData,
      },
    ])
    .select()
    .single();

  if (step.error) throw step.error;
  return step.data;
}

export async function getCampaignWithSteps(
  campaignId: string
): Promise<DripCampaign & { steps: CampaignStep[] }> {
  const campaign = await supabase
    .from("drip_campaigns")
    .select(
      `
      *,
      campaign_steps (*)
    `
    )
    .eq("id", campaignId)
    .single();

  if (campaign.error) throw campaign.error;
  return campaign.data;
}

export async function enrollContactInCampaign(
  campaignId: string,
  contactId: string,
  workspaceId?: string
): Promise<CampaignEnrollment> {
  // Validate campaign and contact belong to workspace (if workspaceId provided)
  if (workspaceId) {
    // Validate campaign
    const campaign = await supabase
      .from("drip_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("workspace_id", workspaceId)
      .single();

    if (campaign.error) {
      throw new Error("Campaign not found or access denied");
    }

    // Validate contact
    const contact = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    if (contact.error) {
      throw new Error("Contact not found or access denied");
    }
  }

  // Check if already enrolled
  const existing = await supabase
    .from("campaign_enrollments")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("contact_id", contactId)
    .single();

  if (!existing.error) {
    return existing.data; // Already enrolled
  }

  // Create enrollment
  const enrollment = await supabaseServer
    .from("campaign_enrollments")
    .insert([
      {
        campaign_id: campaignId,
        contact_id: contactId,
        current_step: 1,
        status: "active",
      },
    ])
    .select()
    .single();

  if (enrollment.error) throw enrollment.error;

  // Schedule first step
  const campaign = await getCampaignWithSteps(campaignId);
  const firstStep = campaign.steps[0];

  if (firstStep) {
    await scheduleStepExecution(
      enrollment.data.id,
      firstStep.id,
      firstStep.delay_days,
      firstStep.delay_hours
    );
  }

  return enrollment.data;
}

export async function scheduleStepExecution(
  enrollmentId: string,
  stepId: string,
  delayDays: number = 0,
  delayHours: number = 0
): Promise<CampaignExecutionLog> {
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + delayDays);
  scheduledFor.setHours(scheduledFor.getHours() + delayHours);

  const log = await supabaseServer
    .from("campaign_execution_logs")
    .insert([
      {
        enrollment_id: enrollmentId,
        step_id: stepId,
        scheduled_for: scheduledFor,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (log.error) throw log.error;
  return log.data;
}

export async function processPendingCampaignSteps() {
  try {
    console.log("⏰ Processing pending campaign steps...");

    // Get all pending execution logs that are ready
    const logs = await supabase
      .from("campaign_execution_logs")
      .select(
        `
        *,
        enrollment:campaign_enrollments (*),
        step:campaign_steps (*)
      `
      )
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (logs.error) throw logs.error;

    let processed = 0;
    let failed = 0;

    for (const log of logs.data || []) {
      try {
        await executeCampaignStep(log);
        processed++;
      } catch (error) {
        console.error(`Failed to execute step ${log.id}:`, error);
        failed++;

        // Update log with error
        await supabaseServer
          .from("campaign_execution_logs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", log.id);
      }
    }

    console.log(`✅ Processed ${processed} steps, ${failed} failed`);
    return { processed, failed };
  } catch (error) {
    console.error("Campaign processor error:", error);
    throw error;
  }
}

async function executeCampaignStep(log: any) {
  const enrollment = log.enrollment;
  const step = log.step;
  const contact = await db.contacts.getById(enrollment.contact_id);

  if (!contact) {
    throw new Error(`Contact ${enrollment.contact_id} not found`);
  }

  // Check conditions
  if (step.condition_type !== "none") {
    const shouldExecute = await evaluateCondition(
      contact.id,
      step.condition_type,
      step.condition_value
    );

    if (!shouldExecute) {
      // Skip and schedule next step
      await supabaseServer
        .from("campaign_execution_logs")
        .update({
          status: "skipped",
        })
        .eq("id", log.id);

      if (step.next_step_if_false) {
        const nextStep = await supabase
          .from("campaign_steps")
          .select("*")
          .eq("step_number", step.next_step_if_false)
          .eq("campaign_id", step.campaign_id)
          .single();

        if (!nextStep.error) {
          await scheduleStepExecution(
            enrollment.id,
            nextStep.data.id,
            nextStep.data.delay_days,
            nextStep.data.delay_hours
          );
        }
      }
      return;
    }
  }

  // Generate personalized content
  const content = await generatePersonalizedContent(
    contact.id,
    "followup",
    []
  );

  // Send email via Gmail (get integration from enrollment workspace)
  const integration = await getWorkspaceIntegration(enrollment.campaign_id);

  if (!integration) {
    throw new Error("No email integration configured");
  }

  const { messageId } = await sendEmailViaGmail(
    integration.id,
    contact.email,
    step.subject_line,
    step.content_template
  );

  // Record sent email
  const sentEmail = await db.sentEmails.create({
    contact_id: contact.id,
    subject_line: step.subject_line,
    body: step.content_template,
    email_provider: "gmail",
  });

  // Update execution log
  await supabaseServer
    .from("campaign_execution_logs")
    .update({
      sent_email_id: sentEmail.id,
      sent_at: new Date(),
      status: "sent",
    })
    .eq("id", log.id);

  // Update enrollment to next step
  const nextStep = step.step_number + 1;
  const campaign = await getCampaignWithSteps(step.campaign_id);
  const allSteps = campaign.steps;

  if (allSteps.length >= nextStep) {
    const followingStep = allSteps[nextStep - 1];

    if (followingStep) {
      await scheduleStepExecution(
        enrollment.id,
        followingStep.id,
        followingStep.delay_days,
        followingStep.delay_hours
      );
    }

    // Update enrollment
    await supabaseServer
      .from("campaign_enrollments")
      .update({
        current_step: nextStep,
        updated_at: new Date(),
      })
      .eq("id", enrollment.id);
  } else {
    // Campaign completed
    await supabaseServer
      .from("campaign_enrollments")
      .update({
        status: "completed",
        completed_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", enrollment.id);
  }

  // Log to audit
  await db.auditLogs.create({
    org_id: "system",
    action: "campaign_step_executed",
    resource: "drip_campaign",
    resource_id: step.campaign_id,
    agent: "drip_engine",
    status: "success",
    details: {
      enrollment_id: enrollment.id,
      step_number: step.step_number,
      contact_id: contact.id,
    },
  });
}

async function evaluateCondition(
  contactId: string,
  conditionType: string,
  conditionValue?: string
): Promise<boolean> {
  switch (conditionType) {
    case "if_opened": {
      // Check if contact opened any email in last N days
      const days = parseInt(conditionValue || "7");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const opens = await supabase
        .from("email_opens")
        .select("*", { count: "exact", head: true })
        .lte("opened_at", cutoff.toISOString());

      return (opens.count || 0) > 0;
    }

    case "if_clicked": {
      const days = parseInt(conditionValue || "7");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const clicks = await supabase
        .from("email_clicks")
        .select("*", { count: "exact", head: true })
        .lte("clicked_at", cutoff.toISOString());

      return (clicks.count || 0) > 0;
    }

    case "if_replied": {
      const replies = await supabase
        .from("email_replies")
        .select("*", { count: "exact", head: true })
        .eq("contact_id", contactId);

      return (replies.count || 0) > 0;
    }

    case "if_not_opened": {
      const opens = await supabase
        .from("email_opens")
        .select("*", { count: "exact", head: true });

      return (opens.count || 0) === 0;
    }

    case "if_not_clicked": {
      const clicks = await supabase
        .from("email_clicks")
        .select("*", { count: "exact", head: true });

      return (clicks.count || 0) === 0;
    }

    default:
      return true;
  }
}

async function getWorkspaceIntegration(campaignId: string) {
  // Get workspace from campaign, then get integration
  const campaign = await supabase
    .from("drip_campaigns")
    .select("workspace_id")
    .eq("id", campaignId)
    .single();

  if (campaign.error || !campaign.data?.workspace_id) return null;

  // Get workspace to find org_id
  const workspace = await supabase
    .from("workspaces")
    .select("org_id")
    .eq("id", campaign.data.workspace_id)
    .single();

  if (workspace.error || !workspace.data?.org_id) return null;

  // Get integrations for this org
  const integrations = await db.emailIntegrations.getByOrg(workspace.data.org_id);
  return integrations[0] || null; // Return first integration
}

export async function getCampaignMetrics(campaignId: string) {
  const metrics = await supabase
    .from("campaign_metrics")
    .select("*")
    .eq("campaign_id", campaignId)
    .single();

  if (metrics.error) throw metrics.error;
  return metrics.data;
}

export async function updateCampaignMetrics(campaignId: string) {
  // Calculate fresh metrics
  const enrollments = await supabase
    .from("campaign_enrollments")
    .select("*")
    .eq("campaign_id", campaignId);

  const totalEnrolled = enrollments.data?.length || 0;
  const totalCompleted =
    enrollments.data?.filter((e) => e.status === "completed").length || 0;

  // Get email stats
  const opens = await supabase
    .from("email_opens")
    .select("*", { count: "exact", head: true });

  const clicks = await supabase
    .from("email_clicks")
    .select("*", { count: "exact", head: true });

  const replies = await supabase
    .from("email_replies")
    .select("*", { count: "exact", head: true });

  // Update metrics
  await supabaseServer
    .from("campaign_metrics")
    .update({
      total_enrolled: totalEnrolled,
      total_completed: totalCompleted,
      total_opened: opens.count || 0,
      total_clicked: clicks.count || 0,
      total_replied: replies.count || 0,
      updated_at: new Date(),
    })
    .eq("campaign_id", campaignId);
}
