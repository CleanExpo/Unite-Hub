import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { PaginationSchema, UUIDSchema } from "@/lib/validation/schemas";

/**
 * GET /api/clients/[id]/emails
 * Get all emails for a specific contact (legacy: clientId → contactId)
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

    // Get pagination params and validate
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
      .select("id, name, email, company, workspace_id")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    // Build email query
    let query = supabase
      .from("emails")
      .select("*", { count: "exact" })
      .eq("contact_id", contactId)
      .order(sort_by, { ascending: sort_order === "asc" });

    // Filter unread if requested (note: emails table may not have isRead field)
    // This is a limitation - consider adding is_read column to emails table

    // Apply pagination
    const startIndex = (page - 1) * limit;
    query = query.range(startIndex, startIndex + limit - 1);

    const { data: emails, error: emailsError, count } = await query;

    if (emailsError) {
      console.error("Failed to fetch emails:", emailsError);
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }

    // Get stats
    const { data: allEmails } = await supabase
      .from("emails")
      .select("id")
      .eq("contact_id", contactId);

    const stats = {
      totalEmails: count || 0,
      unreadCount: 0, // TODO: Add is_read column to emails table
      repliedCount: 0, // TODO: Calculate from sent_emails table
      contactEmails: [
        {
          email: contact.email,
          isPrimary: true,
          label: "work",
          verified: true,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        company: contact.company,
        email: contact.email,
      },
      emails: (emails || []).map((email: any) => ({
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        aiSummary: email.ai_summary,
        isProcessed: email.is_processed,
        createdAt: email.created_at,
        metadata: email.metadata,
      })),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        totalEmails: count || 0,
      },
      stats,
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
    console.error("Get emails error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get emails" },
      { status: 500 }
    );
  }
}
