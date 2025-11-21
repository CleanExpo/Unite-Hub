import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user
    await validateUserAuth(request);

    const body = await request.json();
    const { prompt, style, size = "1024x1024", workspaceId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Use OpenRouter to route to appropriate image model
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterApiKey) {
      // Return a placeholder response for development
      return NextResponse.json({
        success: true,
        imageUrl: `https://placehold.co/${size.replace("x", "x")}/B6F232/1a1a1a?text=AI+Generated`,
        prompt,
        model: "placeholder",
        message: "Image generation API not configured. Using placeholder.",
      });
    }

    // Call OpenRouter for image generation
    // Using a text model to generate a description that could be used with DALL-E
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3008",
        "X-Title": "Unite-Hub",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "system",
            content: "You are a creative image prompt enhancer. Take the user's basic prompt and enhance it with specific visual details, art style, lighting, and composition details suitable for AI image generation. Return only the enhanced prompt, no explanations.",
          },
          {
            role: "user",
            content: `Enhance this image prompt for ${style || "marketing"} content: ${prompt}`,
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to enhance image prompt" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content || prompt;

    // For now, return the enhanced prompt with a placeholder
    // In production, this would call DALL-E, Stability AI, or similar
    return NextResponse.json({
      success: true,
      imageUrl: `https://placehold.co/${size.replace("x", "x")}/B6F232/1a1a1a?text=Generated`,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      model: "openrouter/claude-3-haiku",
      message: "Prompt enhanced. Connect DALL-E or Stability AI for actual image generation.",
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
