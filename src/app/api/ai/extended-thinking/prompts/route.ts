/**
 * Extended Thinking Prompts API
 * GET /api/ai/extended-thinking/prompts
 *
 * Lists available thinking prompt templates
 * AUTH REQUIRED - Exposes system prompt templates
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllPromptNames,
  getAllCategories,
  getPromptsByComplexity,
  THINKING_PROMPTS,
  getPromptsForCategory,
} from "@/lib/ai/thinking-prompts";
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // Require authentication - prompts are internal system configuration
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized - authentication required' }, { status: 401 });
  }

  try {
    // Optional query parameters for filtering
    const category = req.nextUrl.searchParams.get("category");
    const complexity = req.nextUrl.searchParams.get("complexity");
    const format = req.nextUrl.searchParams.get("format") || "list"; // list or detailed

    let prompts: any[] = [];

    if (category && getPromptsForCategory(category).length > 0) {
      // Filter by category
      prompts = getPromptsForCategory(category);
    } else if (
      complexity &&
      ["low", "medium", "high", "very_high"].includes(complexity)
    ) {
      // Filter by complexity
      prompts = getPromptsByComplexity(
        complexity as "low" | "medium" | "high" | "very_high"
      );
    } else if (!category && !complexity) {
      // Return all prompts
      prompts = Object.values(THINKING_PROMPTS);
    } else {
      return NextResponse.json(
        { error: "Invalid filter parameters" },
        { status: 400 }
      );
    }

    // Format response
    let response: any;

    if (format === "detailed") {
      // Detailed view with full prompt content
      response = {
        count: prompts.length,
        prompts: prompts.map((p) => ({
          name: p.name,
          category: p.category,
          systemPrompt: p.systemPrompt,
          guidance: p.guidance,
          idealComplexity: p.idealComplexity,
          maxThinkingTokens: p.maxThinkingTokens,
        })),
      };
    } else {
      // Summary view (default)
      response = {
        count: prompts.length,
        prompts: prompts.map((p) => ({
          name: p.name,
          category: p.category,
          guidance: p.guidance,
          idealComplexity: p.idealComplexity,
          maxThinkingTokens: p.maxThinkingTokens,
        })),
        categories: getAllCategories(),
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Prompts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts", details: error.message },
      { status: 500 }
    );
  }
}
