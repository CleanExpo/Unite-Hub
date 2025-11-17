import { NextRequest, NextResponse } from "next/server";
import {
  analyzeContactIntelligence,
  analyzeWorkspaceContacts,
  getHotLeads,
} from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { ContactIntelligenceRequestSchema, formatZodError } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (20 requests per 15 minutes for AI endpoints)
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();

    // Validate request body
    const validationResult = ContactIntelligenceRequestSchema.safeParse({
      action: body.action,
      contact_id: body.contactId,
      workspace_id: body.workspaceId,
      limit: body.limit,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: formatZodError(validationResult.error),
        },
        { status: 400 }
      );
    }

    const { action, contact_id: contactId, workspace_id: workspaceId } = validationResult.data;

    // Validate authentication and workspace access (SECURE - no service role bypass)
    const { validateUserAuth, validateWorkspaceAccess } = await import("@/lib/workspace-validation");

    const user = await validateUserAuth(req);

    // Validate workspaceId if provided
    if (workspaceId) {
      await validateWorkspaceAccess(workspaceId, user.orgId);
    }

    if (action === "analyze_contact" && contactId) {
      const intelligence = await analyzeContactIntelligence(
        contactId,
        workspaceId
      );
      return NextResponse.json({ success: true, intelligence });
    }

    if (action === "analyze_workspace" && workspaceId) {
      const result = await analyzeWorkspaceContacts(workspaceId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "get_hot_leads" && workspaceId) {
      const hotLeads = await getHotLeads(workspaceId);
      return NextResponse.json({ success: true, hotLeads });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[contact-intelligence] Error:", error);

    // Handle workspace validation errors with appropriate status codes
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
