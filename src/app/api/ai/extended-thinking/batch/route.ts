/**
 * Extended Thinking Batch API
 * POST /api/ai/extended-thinking/batch
 *
 * Execute multiple Extended Thinking operations in batch with cost tracking
 */

// Route segment config for Vercel
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getExtendedThinkingEngine } from "@/lib/ai/extended-thinking-engine";
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
    const { operations } = body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: "operations array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (operations.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 operations per batch" },
        { status: 400 }
      );
    }

    // Validate all operations
    for (const op of operations) {
      if (!op.userPrompt) {
        return NextResponse.json(
          { error: "Each operation must have userPrompt" },
          { status: 400 }
        );
      }

      if (!op.systemPrompt && !op.promptTemplate) {
        return NextResponse.json(
          { error: "Each operation must have systemPrompt or promptTemplate" },
          { status: 400 }
        );
      }

      if (op.complexity && !["low", "medium", "high", "very_high"].includes(op.complexity)) {
        return NextResponse.json(
          { error: `Invalid complexity level: ${op.complexity}` },
          { status: 400 }
        );
      }
    }

    // Execute batch
    const engine = getExtendedThinkingEngine();
    const supabase = await getSupabaseServer();

    const results = [];
    let totalCost = 0;

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      try {
        // Load prompt template if specified
        let systemPrompt = op.systemPrompt;
        if (op.promptTemplate) {
          const template = getThinkingPrompt(op.promptTemplate);
          if (!template) {
            results.push({
              index: i,
              success: false,
              error: `Prompt template '${op.promptTemplate}' not found`,
            });
            continue;
          }
          systemPrompt = template.systemPrompt;
        }

        // Execute thinking
        const operation = await engine.executeThinking({
          systemPrompt,
          userPrompt: op.userPrompt,
          complexity: op.complexity || "medium",
          workspaceId,
          agentName: op.agentName || "batch-api",
          operationType: op.operationType || `batch-${i}`,
        });

        totalCost += operation.totalCost;

        // Store in database
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
          complexity_level: op.complexity || "medium",
        });

        results.push({
          index: i,
          success: true,
          operationId: operation.id,
          resultContent: operation.resultContent,
          tokens: {
            thinking: operation.thinkingTokens,
            input: operation.inputTokens,
            output: operation.outputTokens,
          },
          cost: operation.totalCost,
          duration: operation.duration,
        });
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error.message,
        });
      }

      // Rate limiting between operations
      if (i < operations.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        success: failureCount === 0,
        summary: {
          total: operations.length,
          successful: successCount,
          failed: failureCount,
          totalCost: Math.round(totalCost * 10000) / 10000,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Batch execution error:", error);
    return NextResponse.json(
      {
        error: "Batch execution failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
