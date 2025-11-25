import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Platform character limits
const PLATFORM_LIMITS = {
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  twitter: 280,
};

// Platform tone guidelines
const PLATFORM_TONES = {
  facebook: "conversational and community-focused",
  instagram: "visual-first, inspirational, and authentic",
  tiktok: "trendy, playful, and attention-grabbing",
  linkedin: "professional, insightful, and thought-leadership",
  twitter: "concise, witty, and newsworthy",
};

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { clientId, platform, category, count = 10, businessContext } = body;

    if (!clientId || !platform || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate templates using Claude
    const templates = await generateTemplatesWithClaude(
      platform,
      category,
      count,
      businessContext
    );

    const supabase = await getSupabaseServer();

    // Save templates to database
    const savedTemplates = [];
    for (const template of templates) {
      const { data, error } = await supabase
        .from("social_templates")
        .insert({
          client_id: clientId,
          platform,
          category,
          template_name: template.templateName,
          copy_text: template.copyText,
          hashtags: template.hashtags,
          emoji_suggestions: template.emojiSuggestions,
          call_to_action: template.callToAction,
          variations: template.variations,
          performance_prediction: template.performancePrediction,
          tags: template.tags,
          ai_generated: true,
          is_favorite: false,
          usage_count: 0,
          character_count: template.copyText.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!error && data) {
        savedTemplates.push({ id: data.id, ...template });
      }
    }

    return NextResponse.json({
      success: true,
      templates: savedTemplates,
      count: savedTemplates.length,
    });
  } catch (error) {
    console.error("Error generating templates:", error);
    return NextResponse.json(
      { error: "Failed to generate templates" },
      { status: 500 }
    );
  }
}

async function generateTemplatesWithClaude(
  platform: string,
  category: string,
  count: number,
  businessContext?: string
) {
  const characterLimit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
  const tone = PLATFORM_TONES[platform as keyof typeof PLATFORM_TONES];

  const prompt = `Generate ${count} high-quality social media copy templates for ${platform}.

Category: ${category}
Platform tone: ${tone}
Character limit: ${characterLimit}
${businessContext ? `Business context: ${businessContext}` : ""}

For each template, provide:
1. Template name (descriptive title)
2. Copy text (engaging, on-brand, platform-optimized)
3. 5-10 relevant hashtags
4. 3-5 emoji suggestions
5. A strong call-to-action
6. 3 tone variations (professional, casual, inspirational)
7. Performance prediction (estimated reach, engagement, best time to post)
8. Relevant tags for categorization

Make the templates diverse, creative, and immediately usable. Focus on high engagement potential.

Return as JSON array with this structure:
{
  "templates": [
    {
      "templateName": "string",
      "copyText": "string",
      "hashtags": ["string"],
      "emojiSuggestions": ["string"],
      "callToAction": "string",
      "variations": [
        { "copy": "string", "tone": "professional" },
        { "copy": "string", "tone": "casual" },
        { "copy": "string", "tone": "inspirational" }
      ],
      "performancePrediction": {
        "estimatedReach": "string",
        "estimatedEngagement": "string",
        "bestTimeToPost": "string"
      },
      "tags": ["string"]
    }
  ]
}`;

  const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8000,
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

  // Parse JSON response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const parsedResult = JSON.parse(jsonMatch[0]);
  return parsedResult.templates;
}
