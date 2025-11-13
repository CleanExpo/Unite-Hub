import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Regenerate calendar post with AI
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Get existing post
    const post = await convex.query(api.contentCalendar.getPost, {
      postId: postId as Id<"contentCalendarPosts">,
    });

    // Get client and strategy data
    const client = await convex.query(api.clients.get, {
      clientId: post.clientId,
    });

    const persona = await convex.query(api.personas.getActive, {
      clientId: post.clientId,
    });

    const strategy = post.strategyId
      ? await convex.query(api.strategies.get, { strategyId: post.strategyId })
      : await convex.query(api.strategies.getActive, { clientId: post.clientId });

    if (!persona || !strategy) {
      return NextResponse.json(
        { error: "Client must have active persona and strategy" },
        { status: 400 }
      );
    }

    // Build regeneration prompt
    const systemPrompt = `You are a social media expert. Regenerate this ${post.platform} post with fresh, engaging content while maintaining the same strategic intent.

Return ONLY a JSON object with this structure:
{
  "suggestedCopy": "string - new post copy",
  "suggestedHashtags": ["array of hashtags"],
  "suggestedImagePrompt": "string - DALL-E prompt",
  "callToAction": "string - CTA",
  "aiReasoning": "string - why this version is better"
}`;

    const userPrompt = `Regenerate this post:

ORIGINAL POST:
Platform: ${post.platform}
Post Type: ${post.postType}
Content Pillar: ${post.contentPillar}
Original Copy: ${post.suggestedCopy}
Hashtags: ${post.suggestedHashtags.join(", ")}

CONTEXT:
Business: ${client.businessDescription}
Persona: ${persona.personaName}
Strategy: ${strategy.strategyTitle}

Create a fresh version that's more engaging and effective.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse AI response
    let regeneratedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      regeneratedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse regeneration response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Update post with regenerated content
    await convex.mutation(api.contentCalendar.updatePost, {
      postId: postId as Id<"contentCalendarPosts">,
      suggestedCopy: regeneratedData.suggestedCopy,
      suggestedHashtags: regeneratedData.suggestedHashtags,
      suggestedImagePrompt: regeneratedData.suggestedImagePrompt,
      callToAction: regeneratedData.callToAction,
    });

    return NextResponse.json({
      success: true,
      regeneratedContent: regeneratedData,
    });
  } catch (error: any) {
    console.error("Error regenerating post:", error);
    return NextResponse.json(
      { error: "Failed to regenerate post", details: error.message },
      { status: 500 }
    );
  }
}
