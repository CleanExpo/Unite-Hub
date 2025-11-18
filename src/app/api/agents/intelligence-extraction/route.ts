import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth, validateWorkspaceAccess } from "@/lib/workspace-validation";
import { extractEmailIntelligence } from "@/lib/agents/intelligence-extraction";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * AI Intelligence Extraction Agent API
 *
 * POST /api/agents/intelligence-extraction
 *
 * Processes unanalyzed emails and media files to extract:
 * - Communication intents (meeting request, question, proposal, etc.)
 * - Sentiment analysis (positive, neutral, negative)
 * - Key topics and entities
 * - Action items and follow-ups
 * - Client pain points and needs
 *
 * Updates intelligence_analyzed = true and analyzed_at timestamp
 * Creates email_intelligence records with extracted data
 */

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const body = await req.json();
    const { workspaceId, batchSize = 10 } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Validate workspace access
    await validateWorkspaceAccess(workspaceId, user.orgId);

    // Extract intelligence from unanalyzed emails
    const result = await extractEmailIntelligence(workspaceId, batchSize);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      total: result.total,
      intelligence_records: result.intelligenceRecords.length,
      message: `Processed ${result.processed} emails, created ${result.intelligenceRecords.length} intelligence records`,
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
    console.error("Intelligence extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Intelligence extraction failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/intelligence-extraction
 *
 * Get intelligence extraction statistics for workspace
 */
export async function GET(req: NextRequest) {
  try {
    // Validate user authentication
    const user = await validateUserAuth(req);

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Validate workspace access
    await validateWorkspaceAccess(workspaceId, user.orgId);

    // Get stats (this would be implemented in the db layer)
    const { getSupabaseServer } = await import("@/lib/supabase");
    const supabase = await getSupabaseServer();

    // Count analyzed vs unanalyzed emails
    const { data: emailStats, error: emailError } = await supabase
      .from("client_emails")
      .select("intelligence_analyzed", { count: "exact", head: false })
      .eq("workspace_id", workspaceId);

    if (emailError) {
      throw new Error(`Failed to fetch email stats: ${emailError.message}`);
    }

    const analyzed = emailStats?.filter((e) => e.intelligence_analyzed).length || 0;
    const unanalyzed = emailStats?.filter((e) => !e.intelligence_analyzed).length || 0;

    // Count intelligence records
    const { count: intelligenceCount, error: intelligenceError } = await supabase
      .from("email_intelligence")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (intelligenceError) {
      throw new Error(`Failed to fetch intelligence count: ${intelligenceError.message}`);
    }

    return NextResponse.json({
      success: true,
      stats: {
        emails: {
          total: analyzed + unanalyzed,
          analyzed,
          unanalyzed,
          percentage_analyzed: ((analyzed / (analyzed + unanalyzed)) * 100).toFixed(2),
        },
        intelligence_records: intelligenceCount || 0,
      },
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
    console.error("Intelligence stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
