/**
 * Extended Thinking Execution API
 * POST /api/ai/extended-thinking/execute
 *
 * Executes Claude Opus 4.5 Extended Thinking with budget management and cost tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { ExtendedThinkingEngine, getExtendedThinkingEngine } from "@/lib/ai/extended-thinking-engine";
import { getThinkingPrompt } from "@/lib/ai/thinking-prompts";

export async function POST(req: NextRequest) {
  try {
    // Get authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string;

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

    // Get workspace from query
    workspaceId = req.nextUrl.searchParams.get("workspaceId") || "";
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      systemPrompt,
      userPrompt,
      complexity = "medium",
      operationType = "general-analysis",
      promptTemplate,
    } = body;

    if (!systemPrompt && !promptTemplate) {
      return NextResponse.json(
        { error: "Either systemPrompt or promptTemplate is required" },
        { status: 400 }
      );
    }

    if (!userPrompt) {
      return NextResponse.json(
        { error: "userPrompt is required" },
        { status: 400 }
      );
    }

    // Validate complexity
    if (!["low", "medium", "high", "very_high"].includes(complexity)) {
      return NextResponse.json(
        { error: "Invalid complexity level" },
        { status: 400 }
      );
    }

    // Load prompt template if specified
    let finalSystemPrompt = systemPrompt;
    if (promptTemplate) {
      const template = getThinkingPrompt(promptTemplate);
      if (!template) {
        return NextResponse.json(
          { error: `Prompt template '${promptTemplate}' not found` },
          { status: 400 }
        );
      }
      finalSystemPrompt = template.systemPrompt;
    }

    // Execute Extended Thinking
    const engine = getExtendedThinkingEngine();
    const operation = await engine.executeThinking({
      systemPrompt: finalSystemPrompt,
      userPrompt,
      complexity,
      workspaceId,
      agentName: "api-endpoint",
      operationType,
    });

    // Store operation in database
    const supabase = await getSupabaseServer();

    await supabase.from("extended_thinking_operations").insert({
      id: operation.id,
      operation_type: operation.operationType,
      input_text: operation.input,
      thinking_tokens: operation.thinkingTokens,
      output_tokens: operation.outputTokens,
      input_tokens: operation.inputTokens,
      cache_read_tokens: operation.cacheReadTokens,
      cache_creation_tokens: operation.cacheCreationTokens,
      total_cost: operation.totalCost,
      thinking_cost: operation.thinkingCost,
      thinking_content: operation.thinkingContent,
      result_content: operation.resultContent,
      duration_ms: operation.duration,
      timestamp: new Date(operation.timestamp).toISOString(),
      workspace_id: workspaceId,
      user_id: userId,
      agent_name: operation.agentName,
      complexity_level: complexity,
    });

    return NextResponse.json(
      {
        success: true,
        operation: {
          id: operation.id,
          operationType: operation.operationType,
          resultContent: operation.resultContent,
          thinkingContent: operation.thinkingContent,
          tokens: {
            thinking: operation.thinkingTokens,
            input: operation.inputTokens,
            output: operation.outputTokens,
            cacheRead: operation.cacheReadTokens,
            cacheCreation: operation.cacheCreationTokens,
          },
          cost: {
            thinking: operation.thinkingCost,
            total: operation.totalCost,
          },
          duration: operation.duration,
          timestamp: operation.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Extended Thinking execution error:", error);

    // Distinguish between different error types
    if (error.message?.includes("rate_limit")) {
      return NextResponse.json(
        { error: "Rate limited. Please try again later." },
        { status: 429 }
      );
    }

    if (error.message?.includes("Monthly cost limit")) {
      return NextResponse.json(
        { error: "Monthly cost limit exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Extended Thinking execution failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
