import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { UUIDSchema, PaginationSchema } from "@/lib/validation/schemas";

/**
 * GET /api/clients/[id]/sequences
 * Get all drip campaigns for a specific contact (legacy: clientId → contactId)
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

    const { id: contactId } = await params;

    // Validate contact ID
    const idValidation = UUIDSchema.safeParse(contactId);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Get pagination params
    const paginationParams = {
      page: parseInt(req.nextUrl.searchParams.get("page") || "1"),
      limit: parseInt(req.nextUrl.searchParams.get("limit") || "20"),
      sort_by: req.nextUrl.searchParams.get("sortBy") || "created_at",
      sort_order: (req.nextUrl.searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const paginationValidation = PaginationSchema.safeParse(paginationParams);
    if (!paginationValidation.success) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    const { page, limit, sort_by, sort_order } = paginationValidation.data;

    const supabase = await getSupabaseServer();

    // Verify contact exists and belongs to user's workspace
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, email, workspace_id")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    // Get drip campaigns for this contact
    // Option 1: Campaigns directly assigned to contact
    // Option 2: Campaigns contact is enrolled in via campaign_enrollments

    // Get campaigns by enrollment (most common pattern)
    const startIndex = (page - 1) * limit;

    const { data: enrollments, error: enrollmentsError, count } = await supabase
      .from("campaign_enrollments")
      .select(`
        *,
        drip_campaigns (
          id,
          name,
          description,
          sequence_type,
          goal,
          status,
          total_steps,
          metrics,
          created_at,
          updated_at
        )
      `, { count: "exact" })
      .eq("contact_id", contactId)
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(startIndex, startIndex + limit - 1);

    if (enrollmentsError) {
      console.error("Failed to fetch campaign enrollments:", enrollmentsError);
      return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 });
    }

    // Also get campaigns directly assigned to contact (if any)
    const { data: directCampaigns } = await supabase
      .from("drip_campaigns")
      .select("*")
      .eq("contact_id", contactId)
      .eq("workspace_id", contact.workspace_id)
      .order(sort_by, { ascending: sort_order === "asc" });

    // Combine and format results
    const sequences = (enrollments || []).map((enrollment: any) => ({
      id: enrollment.drip_campaigns?.id || enrollment.campaign_id,
      name: enrollment.drip_campaigns?.name || "Unknown Campaign",
      description: enrollment.drip_campaigns?.description,
      sequenceType: enrollment.drip_campaigns?.sequence_type,
      goal: enrollment.drip_campaigns?.goal,
      status: enrollment.drip_campaigns?.status,
      totalSteps: enrollment.drip_campaigns?.total_steps || 0,
      metrics: enrollment.drip_campaigns?.metrics || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        converted: 0,
      },
      enrollmentStatus: enrollment.status,
      currentStep: enrollment.current_step,
      startedAt: enrollment.started_at,
      lastEmailSentAt: enrollment.last_email_sent_at,
      nextEmailScheduledAt: enrollment.next_email_scheduled_at,
      completedAt: enrollment.completed_at,
      createdAt: enrollment.drip_campaigns?.created_at,
      updatedAt: enrollment.drip_campaigns?.updated_at,
    }));

    // Add direct campaigns not in enrollments
    if (directCampaigns && directCampaigns.length > 0) {
      const enrolledCampaignIds = new Set(sequences.map((s: any) => s.id));
      const uniqueDirectCampaigns = directCampaigns
        .filter((c: any) => !enrolledCampaignIds.has(c.id))
        .map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          sequenceType: campaign.sequence_type,
          goal: campaign.goal,
          status: campaign.status,
          totalSteps: campaign.total_steps,
          metrics: campaign.metrics,
          enrollmentStatus: null,
          currentStep: 0,
          startedAt: null,
          lastEmailSentAt: null,
          nextEmailScheduledAt: null,
          completedAt: null,
          createdAt: campaign.created_at,
          updatedAt: campaign.updated_at,
        }));

      sequences.push(...uniqueDirectCampaigns);
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
      },
      sequences,
      total: count || 0,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        totalSequences: count || 0,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Get sequences error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get sequences" },
      { status: 500 }
    );
  }
}
