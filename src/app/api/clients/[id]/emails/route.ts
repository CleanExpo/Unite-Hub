import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * GET /api/clients/[id]/emails
 * Get all emails for a specific client
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json({ error: "Missing client ID" }, { status: 400 });
    }

    // Verify client exists
    const client = await convex.query(api.clients.get, { id: clientId });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get pagination params
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "receivedAt";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";
    const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";

    // Get email threads for client
    const emailThreads = await convex.query(api.emailThreads.getByClient, {
      clientId,
    });

    // Filter unread if requested
    let filteredThreads = emailThreads;
    if (unreadOnly) {
      filteredThreads = emailThreads.filter((thread: any) => !thread.isRead);
    }

    // Sort threads
    filteredThreads.sort((a: any, b: any) => {
      if (sortOrder === "desc") {
        return b[sortBy] - a[sortBy];
      }
      return a[sortBy] - b[sortBy];
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedThreads = filteredThreads.slice(startIndex, endIndex);

    // Get client emails (multiple email addresses)
    const clientEmails = await convex.query(api.clientEmails.getByClient, {
      clientId,
    });

    // Get statistics
    const stats = {
      totalEmails: filteredThreads.length,
      unreadCount: emailThreads.filter((t: any) => !t.isRead).length,
      repliedCount: emailThreads.filter((t: any) => t.autoReplySent).length,
      emailAddresses: clientEmails.map((ce: any) => ({
        email: ce.emailAddress,
        isPrimary: ce.isPrimary,
        label: ce.label,
        verified: ce.verified,
      })),
    };

    return NextResponse.json({
      success: true,
      client: {
        id: client._id,
        name: client.clientName,
        businessName: client.businessName,
        primaryEmail: client.primaryEmail,
      },
      emails: paginatedThreads.map((thread: any) => ({
        id: thread._id,
        senderEmail: thread.senderEmail,
        senderName: thread.senderName,
        subject: thread.subject,
        messageBody: thread.messageBody,
        messageBodyPlain: thread.messageBodyPlain,
        receivedAt: thread.receivedAt,
        isRead: thread.isRead,
        autoReplySent: thread.autoReplySent,
        autoReplySentAt: thread.autoReplySentAt,
        attachments: thread.attachments,
        gmailMessageId: thread.gmailMessageId,
        gmailThreadId: thread.gmailThreadId,
      })),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredThreads.length / limit),
        totalEmails: filteredThreads.length,
      },
      stats,
    });
  } catch (error) {
    console.error("Get emails error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get emails" },
      { status: 500 }
    );
  }
}
