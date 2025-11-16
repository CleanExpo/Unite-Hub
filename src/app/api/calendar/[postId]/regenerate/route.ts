import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";

/**
 * POST /api/calendar/[postId]/regenerate
 * Regenerate calendar post with AI
 */

const UUIDSchema = z.string().uuid("Invalid UUID format");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // AI-specific rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const { postId } = await params;

    // Validate post ID
    const postIdValidation = UUIDSchema.safeParse(postId);
    if (!postIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing post
    const { data: post, error: postError } = await supabase
      .from("calendar_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Calendar post not found" },
        { status: 404 }
      );
    }

    // Verify user has access
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

    // Get contact data
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("name, email, company, custom_fields")
      .eq("id", post.contact_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Get persona if exists
    const { data: persona } = await supabase
      .from("marketing_personas")
      .select("*")
      .eq("contact_id", post.contact_id)
      .eq("is_active", true)
      .single();

    // Get strategy if exists
    const { data: strategy } = post.strategy_id
      ? await supabase
          .from("marketing_strategies")
          .select("*")
          .eq("id", post.strategy_id)
          .single()
      : await supabase
          .from("marketing_strategies")
          .select("*")
          .eq("contact_id", post.contact_id)
          .eq("is_active", true)
          .single();

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

    const businessDescription =
      contact.custom_fields?.businessDescription || contact.company || "Unknown business";
    const personaName = persona?.persona_name || "General audience";
    const strategyTitle = strategy?.strategy_title || "General content strategy";

    const userPrompt = `Regenerate this post:

ORIGINAL POST:
Platform: ${post.platform}
Post Type: ${post.post_type}
Content Pillar: ${post.content_pillar || "N/A"}
Original Copy: ${post.suggested_copy}
Hashtags: ${post.suggested_hashtags?.join(", ") || "None"}

CONTEXT:
Business: ${businessDescription}
Persona: ${personaName}
Strategy: ${strategyTitle}

Create a fresh version that's more engaging and effective.`;

    // Call Claude AI
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      regeneratedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse regeneration response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response", details: responseText },
        { status: 500 }
      );
    }

    // Update post with regenerated content
    const { error: updateError } = await supabase
      .from("calendar_posts")
      .update({
        suggested_copy: regeneratedData.suggestedCopy,
        suggested_hashtags: regeneratedData.suggestedHashtags,
        suggested_image_prompt: regeneratedData.suggestedImagePrompt,
        call_to_action: regeneratedData.callToAction,
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Failed to update post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      regeneratedContent: regeneratedData,
    });
  } catch (error: any) {
    console.error("Error regenerating post:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate post",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
