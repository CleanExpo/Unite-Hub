import { NextRequest, NextResponse } from "next/server";
import { analyzeContactIntelligence } from "@/lib/agents/contact-intelligence";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { contactId, workspaceId } = await request.json();

    if (!contactId || !workspaceId) {
      return NextResponse.json(
        { error: "Contact ID and workspace ID are required" },
        { status: 400 }
      );
    }

    // Verify contact exists
    const contact = await db.contacts.getById(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Run intelligence analysis with workspace context
    const analysis = await analyzeContactIntelligence(contactId, workspaceId);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Contact intelligence analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze contact intelligence" },
      { status: 500 }
    );
  }
}

// Batch analysis endpoint - analyze entire workspace
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Use the new analyzeWorkspaceContacts function
    const { analyzeWorkspaceContacts } = await import("@/lib/agents/contact-intelligence");
    const results = await analyzeWorkspaceContacts(workspaceId);

    return NextResponse.json({
      success: true,
      analyzed: results.analyzed,
      errors: results.errors,
      message: `Successfully analyzed ${results.analyzed} contacts (${results.errors} errors)`,
    });
  } catch (error: any) {
    console.error("Batch contact intelligence analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch analyze contacts" },
      { status: 500 }
    );
  }
}
