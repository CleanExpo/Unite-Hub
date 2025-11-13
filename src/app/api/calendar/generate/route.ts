import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  CONTENT_CALENDAR_SYSTEM_PROMPT,
  buildContentCalendarUserPrompt,
} from "@/lib/claude/prompts";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, strategyId, startDate, endDate, platforms } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Prepare calendar generation
    const prepResult = await convex.mutation(api.contentCalendar.generateCalendar, {
      clientId: clientId as Id<"clients">,
      strategyId: strategyId as Id<"marketingStrategies"> | undefined,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      platforms: platforms || ["facebook", "instagram", "linkedin"],
    });

    // Get client data
    const client = await convex.query(api.clients.get, {
      clientId: clientId as Id<"clients">,
    });

    // Get persona
    const persona = await convex.query(api.personas.getActive, {
      clientId: clientId as Id<"clients">,
    });

    // Get strategy
    const strategy = strategyId
      ? await convex.query(api.strategies.get, {
          strategyId: strategyId as Id<"marketingStrategies">,
        })
      : await convex.query(api.strategies.getActive, {
          clientId: clientId as Id<"clients">,
        });

    if (!persona || !strategy) {
      return NextResponse.json(
        {
          error: "Client must have an active persona and marketing strategy to generate calendar",
        },
        { status: 400 }
      );
    }

    // Build AI prompt
    const userPrompt = buildContentCalendarUserPrompt({
      persona,
      strategy,
      businessContext: client.businessDescription,
      platforms: platforms || ["facebook", "instagram", "linkedin"],
      startDate: new Date(startDate).toISOString(),
      durationDays: prepResult.durationDays,
      contentPillars: strategy.contentPillars,
      tier: client.packageTier,
    });

    // Call Claude AI to generate calendar
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      system: CONTENT_CALENDAR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Parse AI response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle markdown code blocks)
    let calendarData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      calendarData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response", details: responseText },
        { status: 500 }
      );
    }

    // Transform AI response to database format
    const posts = calendarData.calendar.posts.map((post: any) => ({
      clientId: clientId as Id<"clients">,
      strategyId: strategyId as Id<"marketingStrategies"> | undefined,
      scheduledDate: new Date(post.scheduledDate).getTime(),
      platform: post.platform,
      postType: post.postType,
      contentPillar: post.contentPillar,
      suggestedCopy: post.suggestedCopy,
      suggestedHashtags: post.suggestedHashtags,
      suggestedImagePrompt: post.suggestedImagePrompt,
      aiReasoning: post.aiReasoning,
      bestTimeToPost: post.bestTimeToPost,
      targetAudience: post.targetAudience,
      callToAction: post.callToAction,
    }));

    // Batch create posts in database
    const result = await convex.mutation(api.contentCalendar.batchCreatePosts, {
      posts,
    });

    return NextResponse.json({
      success: true,
      postsCreated: result.count,
      summary: calendarData.calendar.summary,
      strategicNotes: calendarData.calendar.strategicNotes,
    });
  } catch (error: any) {
    console.error("Error generating content calendar:", error);
    return NextResponse.json(
      { error: "Failed to generate content calendar", details: error.message },
      { status: 500 }
    );
  }
}
