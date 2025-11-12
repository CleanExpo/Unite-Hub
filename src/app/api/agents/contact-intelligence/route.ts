import { NextRequest, NextResponse } from "next/server";
import {
  analyzeContactIntelligence,
  analyzeWorkspaceContacts,
  getHotLeads,
} from "@/lib/agents/contact-intelligence";

export async function POST(req: NextRequest) {
  try {
    // Authentication temporarily disabled for development
    // TODO: Re-enable authentication in production
    // const { auth } = await import("@/lib/auth");
    // const session = await auth();
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { action, contactId, workspaceId } = await req.json();

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
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent failed" },
      { status: 500 }
    );
  }
}
