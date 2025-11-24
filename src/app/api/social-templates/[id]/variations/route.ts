import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { count = 5, tones = ["professional", "casual", "inspirational", "humorous", "urgent"] } = body;
    const { id } = await params;

    const supabase = await getSupabaseServer();

    // Get the original template
    const { data: template, error: fetchError } = await supabase
      .from("social_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Generate variations using Claude
    const variations = await generateVariations(
      template.copy_text,
      template.platform,
      tones,
      count
    );

    // Update template with variations
    const { error: updateError } = await supabase
      .from("social_templates")
      .update({
        variations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating template with variations:", updateError);
      return NextResponse.json(
        { error: "Failed to save variations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, variations });
  } catch (error) {
    console.error("Error generating variations:", error);
    return NextResponse.json(
      { error: "Failed to generate variations" },
      { status: 500 }
    );
  }
}

async function generateVariations(
  originalCopy: string,
  platform: string,
  tones: string[],
  count: number
) {
  const prompt = `Generate ${count} tone variations of this social media copy for ${platform}:

Original copy: "${originalCopy}"

Create variations with these tones: ${tones.join(", ")}

Each variation should:
- Maintain the core message
- Match the specified tone perfectly
- Be optimized for ${platform}
- Be engaging and authentic

Return as JSON array:
{
  "variations": [
    { "copy": "string", "tone": "string" }
  ]
}`;

  const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
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
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const result = JSON.parse(jsonMatch[0]);
  return result.variations;
}
