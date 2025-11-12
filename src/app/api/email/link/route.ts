import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

/**
 * POST /api/email/link
 * Link email address to existing client account
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { clientId, emailAddress, label, isPrimary } = await req.json();

    if (!clientId || !emailAddress) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, emailAddress" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if client exists
    const client = await convex.query(api.clients.get, { id: clientId });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if email already linked to this client
    const existingLink = await convex.query(api.clientEmails.getByEmailAndClient, {
      emailAddress,
      clientId,
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Email already linked to this client" },
        { status: 409 }
      );
    }

    // Check if email is linked to another client
    const otherClientLink = await convex.query(api.clientEmails.getByEmail, {
      emailAddress,
    });

    if (otherClientLink && otherClientLink.clientId !== clientId) {
      return NextResponse.json(
        {
          error: "Email already linked to another client",
          existingClientId: otherClientLink.clientId,
        },
        { status: 409 }
      );
    }

    // If setting as primary, update other emails for this client
    if (isPrimary) {
      const clientEmails = await convex.query(api.clientEmails.getByClient, {
        clientId,
      });

      // Set all other emails to non-primary
      for (const ce of clientEmails) {
        if (ce.isPrimary) {
          await convex.mutation(api.clientEmails.update, {
            id: ce._id,
            isPrimary: false,
          });
        }
      }
    }

    // Create client email link
    const clientEmail = await convex.mutation(api.clientEmails.create, {
      clientId,
      emailAddress,
      isPrimary: isPrimary || false,
      label: label || "work",
      verified: false,
    });

    // Update any existing email threads with this sender email
    await linkExistingEmailThreads(emailAddress, clientId);

    return NextResponse.json({
      success: true,
      clientEmail: {
        id: clientEmail,
        clientId,
        emailAddress,
        isPrimary: isPrimary || false,
        label: label || "work",
      },
    });
  } catch (error) {
    console.error("Link error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to link email" },
      { status: 500 }
    );
  }
}

/**
 * Link existing email threads to client
 */
async function linkExistingEmailThreads(emailAddress: string, clientId: string) {
  try {
    // Find email threads from this sender that aren't linked or are linked to temp clients
    const threads = await convex.query(api.emailThreads.getBySender, {
      senderEmail: emailAddress,
    });

    // Update threads to link to correct client
    for (const thread of threads) {
      if (thread.clientId !== clientId) {
        await convex.mutation(api.emailThreads.update, {
          id: thread._id,
          clientId,
        });
      }
    }
  } catch (error) {
    console.error("Error linking existing threads:", error);
  }
}

/**
 * DELETE /api/email/link
 * Unlink email address from client account
 */
export async function DELETE(req: NextRequest) {
  try {
    const { clientEmailId } = await req.json();

    if (!clientEmailId) {
      return NextResponse.json({ error: "Missing clientEmailId" }, { status: 400 });
    }

    // Get client email record
    const clientEmail = await convex.query(api.clientEmails.get, {
      id: clientEmailId,
    });

    if (!clientEmail) {
      return NextResponse.json({ error: "Client email not found" }, { status: 404 });
    }

    // Don't allow deletion of primary email
    if (clientEmail.isPrimary) {
      return NextResponse.json(
        { error: "Cannot delete primary email. Set another email as primary first." },
        { status: 400 }
      );
    }

    // Delete client email record
    await convex.mutation(api.clientEmails.remove, { id: clientEmailId });

    return NextResponse.json({
      success: true,
      message: "Email unlinked successfully",
    });
  } catch (error) {
    console.error("Unlink error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unlink email" },
      { status: 500 }
    );
  }
}
