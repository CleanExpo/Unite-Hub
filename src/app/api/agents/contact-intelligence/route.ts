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
    // Try to get token from Authorization header (client-side requests with implicit OAuth)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any;

    if (token) {
      // Use browser client with token for implicit OAuth flow
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        console.error("Token validation error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = data.user;
    } else {
      // Try server-side cookies (PKCE flow or server-side auth)
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        console.error("Cookie auth error:", authError);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = data.user;
    }

    // Get Supabase instance for database operations
    const supabase = await getSupabaseServer();

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
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

    // Validate workspaceId if provided
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .eq("org_id", userOrg.org_id)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
      }
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
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent failed" },
      { status: 500 }
    );
  }
}
