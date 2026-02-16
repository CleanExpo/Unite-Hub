import { NextRequest, NextResponse } from "next/server";
import { analyzeContactIntelligence } from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { aiAgentRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { contactId, workspaceId } = await request.json();

    if (!contactId || !workspaceId) {
      return NextResponse.json(
        { error: "Contact ID and workspace ID are required" },
        { status: 400 }
      );
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(request, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Verify contact exists and belongs to workspace
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    // Run intelligence analysis with workspace context
    const analysis = await analyzeContactIntelligence(contactId, workspaceId);

    return NextResponse.json({
      success: true,
      analysis,
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

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(request, workspaceId);

    // Use the new analyzeWorkspaceContacts function
    const { analyzeWorkspaceContacts } = await import("@/lib/agents/contact-intelligence");
    const results = await analyzeWorkspaceContacts(workspaceId);

    return NextResponse.json({
      success: true,
      analyzed: results.analyzed,
      errors: results.errors,
      message: `Successfully analyzed ${results.analyzed} contacts (${results.errors} errors)`,
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
    console.error("Batch contact intelligence analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch analyze contacts" },
      { status: 500 }
    );
  }
}
