import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { getSupabaseServer } from "@/lib/supabase";
import {
  CONTENT_CALENDAR_SYSTEM_PROMPT,
  buildContentCalendarUserPrompt,
} from "@/lib/claude/prompts";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { z } from "zod";

/**
 * POST /api/calendar/generate
 * Generate AI-powered content calendar for a contact
 */

const GenerateCalendarSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
  strategyId: z.string().uuid().optional(),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  platforms: z.array(z.string()).optional().default(["facebook", "instagram", "linkedin"]),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // AI-specific rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Parse and validate request body
    const body = await req.json();
    const validation = GenerateCalendarSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contactId, strategyId, startDate, endDate, platforms } = validation.data;

    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contact data
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this workspace
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get active persona for contact
    const { data: persona, error: personaError } = await supabase
      .from("marketing_personas")
      .select("*")
      .eq("contact_id", contactId)
      .eq("is_active", true)
      .single();

    // Get strategy (specific or active)
    const { data: strategy, error: strategyError } = strategyId
      ? await supabase
          .from("marketing_strategies")
          .select("*")
          .eq("id", strategyId)
          .single()
      : await supabase
          .from("marketing_strategies")
          .select("*")
          .eq("contact_id", contactId)
          .eq("is_active", true)
          .single();

    if (!persona || !strategy) {
      return NextResponse.json(
        {
          error: "Contact must have an active persona and marketing strategy to generate calendar",
        },
        { status: 400 }
      );
    }

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Build AI prompt
    const businessContext =
      contact.custom_fields?.businessDescription || contact.company || "Unknown business";
    const packageTier =
      contact.custom_fields?.packageTier || contact.custom_fields?.tier || "professional";

    const userPrompt = buildContentCalendarUserPrompt({
      persona,
      strategy,
      businessContext,
      platforms,
      startDate,
      durationDays,
      contentPillars: strategy.content_pillars,
      tier: packageTier,
    });

    // Call Claude AI to generate calendar
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: CONTENT_CALENDAR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    })
    });

    const message = result.data;;

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
      contact_id: contactId,
      workspace_id: contact.workspace_id,
      strategy_id: strategyId || strategy.id,
      scheduled_date: new Date(post.scheduledDate).toISOString(),
      platform: post.platform,
      post_type: post.postType,
      content_pillar: post.contentPillar,
      suggested_copy: post.suggestedCopy,
      suggested_hashtags: post.suggestedHashtags,
      suggested_image_prompt: post.suggestedImagePrompt,
      ai_reasoning: post.aiReasoning,
      best_time_to_post: post.bestTimeToPost,
      target_audience: post.targetAudience,
      call_to_action: post.callToAction,
      status: "draft",
    }));

    // Batch create posts in database
    const { data: createdPosts, error: insertError } = await supabase
      .from("calendar_posts")
      .insert(posts)
      .select();

    if (insertError) {
      console.error("Failed to create calendar posts:", insertError);
      return NextResponse.json(
        { error: "Failed to create calendar posts", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postsCreated: createdPosts?.length || 0,
      summary: calendarData.calendar.summary,
      strategicNotes: calendarData.calendar.strategicNotes,
      posts: createdPosts,
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error generating content calendar:", error);
    return NextResponse.json(
      { error: "Failed to generate content calendar", details: error.message },
      { status: 500 }
    );
  }
}
