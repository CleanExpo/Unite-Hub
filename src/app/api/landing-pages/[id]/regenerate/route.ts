import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { aiAgentRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/landing-pages/[id]/regenerate
 * Regenerate AI copy for a specific section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;
    const body = await request.json();
    const { sectionName } = body;

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

    // Regenerate the specific section
    const regeneratedCopy = await regenerateSectionCopy(
      sectionName,
      checklist.page_type,
      checklist.title
    );

    // Update the sections array
    const updatedSections = checklist.sections.map((section: any) => {
      if (section.name === sectionName) {
        return {
          ...section,
          copyRecommendations: regeneratedCopy,
        };
      }
      return section;
    });

    // Save updates
    const { error: updateError } = await supabase
      .from("landing_page_checklists")
      .update({
        sections: updatedSections,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating checklist:", updateError);
      return NextResponse.json(
        { error: "Failed to save regenerated copy" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Section copy regenerated successfully",
    });
  } catch (error: any) {
    console.error("Error regenerating section:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate section" },
      { status: 500 }
    );
  }
}

async function regenerateSectionCopy(
  sectionName: string,
  pageType: string,
  title: string
): Promise<string[]> {
  const prompt = `Generate 3 fresh copy variations for the "${sectionName}" section of a ${pageType} landing page titled "${title}".

Make each variation:
- Compelling and conversion-focused
- Different in tone (professional, friendly, urgent)
- Optimized for the section's purpose

Return as JSON:
{
  "copyVariations": ["string", "string", "string"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const result = JSON.parse(jsonMatch[0]);
  return result.copyVariations;
}
