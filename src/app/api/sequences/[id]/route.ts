import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";

/**
 * GET /api/sequences/[id]
 * Get sequence details with all steps
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const { id: sequenceId } = await params;

    // Validate sequence ID
    const idValidation = UUIDSchema.safeParse(sequenceId);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid sequence ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sequence with workspace verification
    const { data: sequence, error: sequenceError } = await supabase
      .from("drip_campaigns")
      .select("id, workspace_id, contact_id, name, description, sequence_type, goal, status, total_steps, is_template, template_category, tags, metrics, created_at, updated_at")
      .eq("id", sequenceId)
      .single();

    if (sequenceError || !sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", sequence.workspace_id)
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

    // Get all steps for this sequence
    const { data: steps, error: stepsError } = await supabase
      .from("campaign_steps")
      .select("*")
      .eq("campaign_id", sequenceId)
      .order("step_number", { ascending: true });

    if (stepsError) {
      console.error("Failed to fetch sequence steps:", stepsError);
    }

    return NextResponse.json({
      success: true,
      sequence: {
        id: sequence.id,
        workspaceId: sequence.workspace_id,
        contactId: sequence.contact_id,
        name: sequence.name,
        description: sequence.description,
        sequenceType: sequence.sequence_type,
        goal: sequence.goal,
        status: sequence.status,
        totalSteps: sequence.total_steps,
        isTemplate: sequence.is_template,
        templateCategory: sequence.template_category,
        tags: sequence.tags,
        metrics: sequence.metrics,
        createdAt: sequence.created_at,
        updatedAt: sequence.updated_at,
      },
      steps: (steps || []).map((step: any) => ({
        id: step.id,
        stepNumber: step.step_number,
        stepName: step.step_name,
        dayDelay: step.day_delay,
        subjectLine: step.subject_line,
        preheaderText: step.preheader_text,
        emailBody: step.email_body,
        emailBodyHtml: step.email_body_html,
        cta: step.cta,
        aiGenerated: step.ai_generated,
        aiReasoning: step.ai_reasoning,
        personalizationTags: step.personalization_tags,
        alternatives: step.alternatives,
        conditionalLogic: step.conditional_logic,
        metrics: step.metrics,
        createdAt: step.created_at,
        updatedAt: step.updated_at,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Get sequence error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get sequence" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sequences/[id]
 * Update sequence (status, name, etc.)
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const { id: sequenceId } = await params;
    const body = await req.json();

    // Validate sequence ID
    const idValidation = UUIDSchema.safeParse(sequenceId);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid sequence ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sequence and verify access
    const { data: sequence } = await supabase
      .from("drip_campaigns")
      .select("workspace_id")
      .eq("id", sequenceId)
      .single();

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", sequence.workspace_id)
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

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) {
      // Validate status
      const validStatuses = ['draft', 'active', 'paused', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.goal !== undefined) updates.goal = body.goal;
    if (body.tags !== undefined) updates.tags = body.tags;

    // Update sequence
    const { data: updated, error: updateError } = await supabase
      .from("drip_campaigns")
      .update(updates)
      .eq("id", sequenceId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update sequence:", updateError);
      return NextResponse.json({ error: "Failed to update sequence" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Sequence updated successfully",
      sequence: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Update sequence error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update sequence" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sequences/[id]
 * Delete sequence and all associated steps
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const { id: sequenceId } = await params;

    // Validate sequence ID
    const idValidation = UUIDSchema.safeParse(sequenceId);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid sequence ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sequence and verify access
    const { data: sequence } = await supabase
      .from("drip_campaigns")
      .select("workspace_id, name")
      .eq("id", sequenceId)
      .single();

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", sequence.workspace_id)
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

    // Delete sequence (cascade will handle steps and enrollments)
    const { error: deleteError } = await supabase
      .from("drip_campaigns")
      .delete()
      .eq("id", sequenceId);

    if (deleteError) {
      console.error("Failed to delete sequence:", deleteError);
      return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Sequence "${sequence.name}" deleted successfully`,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Delete sequence error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete sequence" },
      { status: 500 }
    );
  }
}
