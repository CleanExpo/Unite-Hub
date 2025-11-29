import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withWorkspace } from "@/core/auth";
import { withRateLimit } from "@/core/security";
import { handleErrors, AppError } from "@/core/errors";
import { createWorkspaceScopedClient } from "@/core/database";

// Validation schemas
const listEmailsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["queued", "sending", "sent", "failed", "bounced"]).optional(),
  campaign_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

const queueEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  html: z.string().min(1),
  text: z.string().optional(),
  from_name: z.string().max(255).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().optional(),
  campaign_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  template_data: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/v1/emails
 *
 * List emails with workspace filtering and pagination
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status
 * - campaign_id: Filter by campaign
 * - contact_id: Filter by contact
 * - search: Search by subject or recipient
 */
export const GET = handleErrors(
  withWorkspace(async (req: NextRequest, context) => {
    const { workspaceId } = context;
    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const params = listEmailsSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      campaign_id: searchParams.get("campaign_id"),
      contact_id: searchParams.get("contact_id"),
      search: searchParams.get("search"),
    });

    const offset = (params.page - 1) * params.limit;

    // Create workspace-scoped database client
    const db = await createWorkspaceScopedClient(workspaceId);

    // Build query
    let query = db
      .from("emails")
      .select(
        `
        *,
        campaign:campaigns(id, name),
        contact:contacts(id, email, full_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + params.limit - 1);

    // Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.campaign_id) {
      query = query.eq("campaign_id", params.campaign_id);
    }

    if (params.contact_id) {
      query = query.eq("contact_id", params.contact_id);
    }

    if (params.search) {
      query = query.or(`subject.ilike.%${params.search}%,to.ilike.%${params.search}%`);
    }

    const { data: emails, error, count } = await query;

    if (error) {
      throw new AppError("Failed to fetch emails", 500, "DATABASE_ERROR");
    }

    return NextResponse.json({
      emails: emails || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit),
      },
    });
  })
);

/**
 * POST /api/v1/emails
 *
 * Queue email for sending
 * Rate limited: 100 requests per minute for staff
 */
export const POST = handleErrors(
  withRateLimit("staff")(
    withWorkspace(async (req: NextRequest, context) => {
      const { workspaceId, user } = context;

      // Parse and validate request body
      const body = await req.json();
      const validatedData = queueEmailSchema.parse(body);

      // Create workspace-scoped database client
      const db = await createWorkspaceScopedClient(workspaceId);

      // Verify campaign exists if provided
      if (validatedData.campaign_id) {
        const { data: campaign, error: campaignError } = await db
          .from("campaigns")
          .select("id")
          .eq("id", validatedData.campaign_id)
          .single();

        if (campaignError || !campaign) {
          throw new AppError(
            "Campaign not found",
            404,
            "CAMPAIGN_NOT_FOUND"
          );
        }
      }

      // Verify contact exists if provided
      if (validatedData.contact_id) {
        const { data: contact, error: contactError } = await db
          .from("contacts")
          .select("id, email")
          .eq("id", validatedData.contact_id)
          .single();

        if (contactError || !contact) {
          throw new AppError("Contact not found", 404, "CONTACT_NOT_FOUND");
        }

        // Ensure email matches contact
        if (contact.email !== validatedData.to) {
          throw new AppError(
            "Email address does not match contact",
            400,
            "EMAIL_MISMATCH"
          );
        }
      }

      // Determine send status and time
      const now = new Date().toISOString();
      const scheduledAt = validatedData.scheduled_at || now;
      const status =
        new Date(scheduledAt) > new Date() ? "queued" : "sending";

      // Queue email
      const { data: email, error: createError } = await db
        .from("emails")
        .insert({
          workspace_id: workspaceId,
          to: validatedData.to,
          subject: validatedData.subject,
          html: validatedData.html,
          text: validatedData.text || "",
          from_name: validatedData.from_name,
          from_email: validatedData.from_email,
          reply_to: validatedData.reply_to,
          campaign_id: validatedData.campaign_id,
          contact_id: validatedData.contact_id,
          template_id: validatedData.template_id,
          template_data: validatedData.template_data || {},
          scheduled_at: scheduledAt,
          priority: validatedData.priority,
          tags: validatedData.tags || [],
          metadata: validatedData.metadata || {},
          status,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw new AppError("Failed to queue email", 500, "DATABASE_ERROR");
      }

      // TODO: Trigger email processing job in background queue
      // This would integrate with Bull, BullMQ, or similar job queue
      // For now, email is queued in database

      return NextResponse.json(
        {
          email,
          message:
            status === "queued"
              ? "Email queued for scheduled delivery"
              : "Email queued for immediate delivery",
        },
        { status: 201 }
      );
    })
  )
);
