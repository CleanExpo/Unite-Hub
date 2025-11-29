import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();
    const { message, workspaceId, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate user authentication (optional for basic chat)
    let userId: string | undefined;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    // Build system prompt based on context
    let systemPrompt = `You are NEXUS, an AI marketing assistant for Unite-Hub. You help clients review their generated marketing content, suggest improvements, and answer questions about their campaigns.

Your capabilities:
- Review and provide feedback on marketing content
- Suggest copy improvements and A/B test ideas
- Answer questions about campaign performance
- Help with content strategy and planning
- Explain AI-generated content decisions

Be helpful, professional, and concise. Focus on actionable advice.`;

    if (context === "workspace_assistant") {
      systemPrompt += `

The user is viewing their Generative Workspace dashboard where they can approve or request iterations on AI-generated content including:
- Video ads for TikTok/Instagram
- Banner ad sets for Meta/Google
- Blog posts with SEO optimization

Help them make decisions about approving or iterating on this content.`;
    }

    // Call Claude API
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    })
    });

    const response = result.data;;

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "I apologize, but I couldn't generate a response.";

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
