import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";
import { anthropic } from "@/lib/anthropic/client";
import { ANTHROPIC_MODELS } from "@/lib/anthropic/models";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

/**
 * POST /api/sequences/generate
 * Generate email sequence using Claude AI
 */

export async function POST(req: NextRequest) {
  try {
    // Apply AI-specific rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const body = await req.json();

    const {
      contactId,
      clientId, // Legacy support
      workspaceId,
      sequenceType,
      personaId,
      name,
      goal,
      customInstructions,
      numSteps = 5,
    } = body;

    const finalContactId = contactId || clientId;

    // Validate required fields
    if (!finalContactId || !sequenceType || !name || !goal) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, sequenceType, name, goal" },
        { status: 400 }
      );
    }

    // Validate sequence type
    const validTypes = ["cold_outreach", "lead_nurture", "onboarding", "re_engagement", "custom"];
    if (!validTypes.includes(sequenceType)) {
      return NextResponse.json(
        { error: "Invalid sequence type. Must be one of: " + validTypes.join(", ") },
        { status: 400 }
      );
    }

    // Validate contact ID
    const contactIdValidation = UUIDSchema.safeParse(finalContactId);
    if (!contactIdValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contact and verify workspace access
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name, email, company, job_title, workspace_id")
      .eq("id", finalContactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const targetWorkspaceId = workspaceId || contact.workspace_id;

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", targetWorkspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build AI prompt for sequence generation
    const prompt = `Generate a ${numSteps}-step email sequence for the following:

Sequence Type: ${sequenceType}
Goal: ${goal}
Contact Name: ${contact.name}
Contact Company: ${contact.company || "Unknown"}
Contact Role: ${contact.job_title || "Unknown"}
${customInstructions ? `\nCustom Instructions: ${customInstructions}` : ""}

Please generate ${numSteps} email steps with the following for each:
1. Step name (short, descriptive)
2. Day delay (0 for first email, then suggest appropriate delays)
3. Subject line (personalized, engaging)
4. Email body (plain text, use {{first_name}}, {{company_name}} placeholders)
5. Call-to-action (what action should they take?)

Format your response as JSON with this structure:
{
  "steps": [
    {
      "stepNumber": 1,
      "stepName": "string",
      "dayDelay": 0,
      "subjectLine": "string",
      "emailBody": "string",
      "cta": {
        "text": "string",
        "type": "button|link|reply"
      },
      "aiReasoning": "why this email at this timing"
    }
  ]
}`;

    console.log("Generating sequence with Claude AI...");

    // Generate sequence with Claude
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const completion = result.data;;

    const responseText = completion.content[0].type === "text"
      ? completion.content[0].text
      : "";

    // Parse AI response
    let generatedSteps;
    try {
      // Try to extract JSON from response (Claude might include markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedSteps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI-generated sequence" },
        { status: 500 }
      );
    }

    // Create sequence in database
    const { data: campaign, error: campaignError } = await supabase
      .from("drip_campaigns")
      .insert({
        workspace_id: targetWorkspaceId,
        contact_id: finalContactId,
        name,
        description: `AI-generated ${sequenceType} sequence`,
        sequence_type: sequenceType,
        goal,
        status: "draft",
        total_steps: generatedSteps.steps?.length || numSteps,
        tags: ["ai-generated", sequenceType],
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error("Failed to create campaign:", campaignError);
      return NextResponse.json(
        { error: "Failed to create sequence" },
        { status: 500 }
      );
    }

    // Create steps
    const steps = generatedSteps.steps?.map((step: any, index: number) => ({
      campaign_id: campaign.id,
      step_number: step.stepNumber || index + 1,
      step_name: step.stepName || `Step ${index + 1}`,
      day_delay: step.dayDelay || (index === 0 ? 0 : index * 3),
      subject_line: step.subjectLine || `Follow-up ${index + 1}`,
      email_body: step.emailBody || "",
      cta: step.cta || { text: "Reply", type: "reply" },
      ai_generated: true,
      ai_reasoning: step.aiReasoning || "",
    })) || [];

    const { data: createdSteps, error: stepsError } = await supabase
      .from("campaign_steps")
      .insert(steps)
      .select();

    if (stepsError) {
      console.error("Failed to create steps:", stepsError);
      // Rollback campaign creation
      await supabase.from("drip_campaigns").delete().eq("id", campaign.id);
      return NextResponse.json(
        { error: "Failed to create sequence steps" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sequenceId: campaign.id,
      sequence: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        sequenceType: campaign.sequence_type,
        goal: campaign.goal,
        status: campaign.status,
        totalSteps: campaign.total_steps,
        createdAt: campaign.created_at,
      },
      steps: createdSteps?.map((step: any) => ({
        id: step.id,
        stepNumber: step.step_number,
        stepName: step.step_name,
        dayDelay: step.day_delay,
        subjectLine: step.subject_line,
        emailBody: step.email_body,
        cta: step.cta,
        aiReasoning: step.ai_reasoning,
      })),
      message: "Sequence generated successfully",
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error generating sequence:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate sequence" },
      { status: 500 }
    );
  }
}
