import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { apiRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/landing-pages/[id]/alternatives
 * Generate alternative copy variations for A/B testing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;
    const body = await request.json();
    const { sectionName, count } = body;

    if (!sectionName) {
      return NextResponse.json(
        { error: "Missing sectionName" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get the checklist
    const { data: checklist, error: fetchError } = await supabase
      .from("landing_page_checklists")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    // Find the current section
    const currentSection = checklist.sections.find(
      (s: any) => s.name === sectionName
    );

    if (!currentSection) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Generate alternatives
    const alternatives = await generateAlternatives(
      sectionName,
      currentSection.copyRecommendations?.[0] || "",
      checklist.page_type,
      count || 3
    );

    return NextResponse.json({
      success: true,
      alternatives,
      message: "Alternatives generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating alternatives:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate alternatives" },
      { status: 500 }
    );
  }
}

async function generateAlternatives(
  sectionName: string,
  currentCopy: string,
  pageType: string,
  count: number
): Promise<string[]> {
  const prompt = `Generate ${count} A/B test alternatives for this landing page copy.

Section: ${sectionName}
Page Type: ${pageType}
Current Copy: "${currentCopy}"

Create ${count} distinct alternatives that:
- Test different messaging approaches
- Vary in length, tone, or angle
- Are suitable for A/B testing
- Maintain conversion focus

Return as JSON:
{
  "alternatives": ["string", "string", "string"]
}`;

  const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })
    });

    const message = result.data;;

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const result = JSON.parse(jsonMatch[0]);
  return result.alternatives;
}
