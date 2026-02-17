import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { anthropic } from "@/lib/anthropic/client";
import { ANTHROPIC_MODELS } from "@/lib/anthropic/models";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { aiAgentRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/media/analyze
 * Analyzes media files using Claude AI (Opus 4 with Extended Thinking)
 *
 * Phase 2B: Multimedia Input System
 *
 * Request: { media_file_id: string }
 * Response: { success: true, analysis: object }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit check (AI endpoint — 10 req/min)
    const rateLimited = await aiAgentRateLimit(req);
    if (rateLimited) return rateLimited;
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get workspaceId from query params (REQUIRED for workspace isolation)
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({
        error: 'workspaceId required for workspace isolation'
      }, { status: 400 });
    }

    // ========================================================================
    // 2. PARSE REQUEST BODY
    // ========================================================================
    const body = await req.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required" },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. FETCH MEDIA FILE RECORD
    // ========================================================================
    const supabase = await getSupabaseServer();

    const { data: mediaFile, error: fetchError } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", mediaId)
      .eq("workspace_id", workspaceId) // ✅ WORKSPACE ISOLATION
      .single();

    if (fetchError || !mediaFile) {
      return NextResponse.json(
        { error: "Media file not found", details: fetchError?.message },
        { status: 404 }
      );
    }

    // Check if already analyzed
    if (mediaFile.ai_analysis && mediaFile.ai_analyzed_at) {
      return NextResponse.json({
        success: true,
        analysis: mediaFile.ai_analysis,
        message: "Already analyzed",
      });
    }

    // ========================================================================
    // 4. UPDATE STATUS TO ANALYZING
    // ========================================================================
    await supabase
      .from("media_files")
      .update({
        status: "analyzing",
        progress: 80,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    // ========================================================================
    // 5. PREPARE ANALYSIS CONTEXT
    // ========================================================================
    let analysisContext = `File: ${mediaFile.original_filename}\n`;
    analysisContext += `Type: ${mediaFile.file_type}\n`;
    analysisContext += `Size: ${(mediaFile.file_size_bytes / 1024 / 1024).toFixed(2)} MB\n\n`;

    // Add transcript if available
    if (mediaFile.transcript) {
      const transcript = mediaFile.transcript as any;
      analysisContext += `Transcript (${transcript.language || "unknown language"}):\n`;
      analysisContext += transcript.full_text || "";
      analysisContext += `\n\n`;
    }

    // Add metadata
    if (mediaFile.duration_seconds) {
      analysisContext += `Duration: ${Math.floor(mediaFile.duration_seconds / 60)}m ${Math.floor(mediaFile.duration_seconds % 60)}s\n`;
    }

    if (mediaFile.tags && mediaFile.tags.length > 0) {
      analysisContext += `Tags: ${mediaFile.tags.join(", ")}\n`;
    }

    // ========================================================================
    // 6. ANALYZE WITH CLAUDE AI (Opus 4 + Extended Thinking)
    // ========================================================================
    const systemPrompt = `You are an AI media analysis expert. Analyze multimedia content and extract actionable insights.

Your analysis should include:
1. **Summary**: Concise 2-3 sentence overview
2. **Key Points**: 3-5 main takeaways or topics discussed
3. **Entities**: People, organizations, locations, products mentioned
4. **Sentiment**: Overall tone (positive/neutral/negative) with brief explanation
5. **Topics**: Main themes and categories
6. **Action Items**: Specific tasks, decisions, or follow-ups mentioned
7. **Insights**: Unique observations or patterns

Format your response as valid JSON with these exact keys:
{
  "summary": "string",
  "key_points": ["point1", "point2", ...],
  "entities": {
    "people": ["name1", "name2"],
    "organizations": ["org1"],
    "locations": ["loc1"],
    "products": ["prod1"]
  },
  "sentiment": {
    "overall": "positive|neutral|negative",
    "explanation": "brief explanation"
  },
  "topics": ["topic1", "topic2", ...],
  "action_items": ["action1", "action2", ...],
  "insights": ["insight1", "insight2", ...]
}`;

    const userPrompt = `Analyze this media file and provide structured insights:\n\n${analysisContext}`;

    let analysis;
    try {
      const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: ANTHROPIC_MODELS.OPUS_4_5,
        max_tokens: 4000,
        thinking: {
          type: "enabled",
          budget_tokens: 5000, // Extended thinking for deep analysis
        },
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }, // Cache system prompt for cost savings
          },
        ],
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      })
    });

    const message = result.data;;

      // Log cache performance
      console.log("🧠 Claude AI Analysis Cache Stats:", {
        input_tokens: message.usage.input_tokens,
        cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
        cache_read_tokens: message.usage.cache_read_input_tokens || 0,
        output_tokens: message.usage.output_tokens,
        cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
      });

      // Extract JSON from response
      const responseText = message.content
        .filter((block) => block.type === "text")
        .map((block: any) => block.text)
        .join("\n");

      // Parse JSON (Claude should return valid JSON)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured analysis from text
        analysis = {
          summary: responseText.substring(0, 500),
          key_points: [],
          entities: { people: [], organizations: [], locations: [], products: [] },
          sentiment: { overall: "neutral", explanation: "Unable to determine sentiment" },
          topics: [],
          action_items: [],
          insights: [],
        };
      }
    } catch (claudeError: any) {
      console.error("Claude API error:", claudeError);

      await supabase
        .from("media_files")
        .update({
          status: "failed",
          error_message: `Analysis failed: ${claudeError.message}`,
        })
        .eq("id", mediaId);

      return NextResponse.json(
        { error: "AI analysis failed", details: claudeError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // 7. UPDATE DATABASE WITH ANALYSIS
    // ========================================================================
    const { data: updatedFile, error: updateError } = await supabase
      .from("media_files")
      .update({
        ai_analysis: analysis,
        ai_analyzed_at: new Date().toISOString(),
        ai_model_used: ANTHROPIC_MODELS.OPUS_4_5,
        status: "completed", // Final status
        progress: 100,
      })
      .eq("id", mediaId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save analysis", details: updateError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // 8. LOG TO AUDIT TRAIL
    // ========================================================================
    await supabase.from("auditLogs").insert({
      org_id: mediaFile.org_id,
      action: "media.analyze",
      resource: "media_file",
      resource_id: mediaId,
      agent: "ai-analysis-worker",
      status: "success",
      details: {
        mediaId,
        filename: mediaFile.original_filename,
        file_type: mediaFile.file_type,
        model: ANTHROPIC_MODELS.OPUS_4_5,
        analysis_summary: analysis.summary,
      },
    });

    // ========================================================================
    // 9. RETURN SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      analysis: analysis,
      media_file: updatedFile,
    });

  } catch (error) {
    console.error("Analysis error:", error);

    // Update status to failed
    try {
      const supabase = await getSupabaseServer();
      const body = await req.json();
      if (body.mediaId) {
        await supabase
          .from("media_files")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", body.mediaId);
      }
    } catch { /* Ignore */ }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/analyze?mediaId={id}&workspaceId={workspace}
 * Get AI analysis status and result
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ CORRECT AUTH PATTERN
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get query params
    const { searchParams } = req.nextUrl;
    const mediaId = searchParams.get("mediaId");
    const workspaceId = searchParams.get("workspaceId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId query parameter required" },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query parameter required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // ✅ WORKSPACE ISOLATION
    const { data: mediaFile, error } = await supabase
      .from("media_files")
      .select("id, status, progress, ai_analysis, ai_model_used, ai_analyzed_at, error_message")
      .eq("id", mediaId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Media file not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: mediaFile.status,
      progress: mediaFile.progress,
      analysis: mediaFile.ai_analysis,
      model_used: mediaFile.ai_model_used,
      analyzed_at: mediaFile.ai_analyzed_at,
      error: mediaFile.error_message,
    });

  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
