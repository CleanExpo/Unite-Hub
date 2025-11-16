import { NextRequest, NextResponse } from "next/server";
import {
  generatePersonalizedContent,
  generateBulkContent,
  getPersonalizationMetrics,
} from "@/lib/agents/content-personalization";
import { getHotLeads } from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { ContentGenerationRequestSchema, formatZodError } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (20 requests per 15 minutes for AI endpoints)
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Authentication check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Validate request body (only for generate action)
    if (body.action === "generate") {
      const validationResult = ContentGenerationRequestSchema.safeParse({
        contact_id: body.contactId,
        content_type: body.contentType,
        workspace_id: body.workspaceId,
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
    }

    const { action, contactId, contentType, workspaceId } = body;

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

    if (action === "generate" && contactId && contentType) {
      const content = await generatePersonalizedContent(
        contactId,
        contentType
      );
      return NextResponse.json({ success: true, content });
    }

    if (action === "generate_bulk" && workspaceId && contentType) {
      const hotLeads = await getHotLeads(workspaceId);
      const result = await generateBulkContent(hotLeads, contentType);
      return NextResponse.json({ success: true, result });
    }

    if (action === "metrics" && workspaceId) {
      const metrics = await getPersonalizationMetrics(workspaceId);
      return NextResponse.json({ success: true, metrics });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
