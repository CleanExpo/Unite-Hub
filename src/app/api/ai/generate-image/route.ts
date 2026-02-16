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

    // Use OpenAI DALL-E 3 for image generation
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      // Return a placeholder response for development
      return NextResponse.json({
        success: true,
        imageUrl: `https://placehold.co/${size.replace("x", "x")}/B6F232/1a1a1a?text=AI+Generated`,
        prompt,
        model: "placeholder",
        message: "OpenAI API key not configured. Using placeholder.",
      });
    }

    try {
      // Call DALL-E 3 API
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `${prompt}. Style: ${style || "professional marketing"}. High quality, detailed.`,
          n: 1,
          size: size,
          quality: "standard",
          response_format: "url",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DALL-E 3 API error:", errorText);

        // Return placeholder on error
        return NextResponse.json({
          success: true,
          imageUrl: `https://placehold.co/${size.replace("x", "x")}/B6F232/1a1a1a?text=Generation+Failed`,
          prompt,
          model: "placeholder",
          message: "Image generation failed. Using placeholder.",
        });
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        prompt,
        model: "dall-e-3",
      });
    } catch (dalleError: any) {
      console.error("DALL-E generation error:", dalleError);

      // Return placeholder on any error
      return NextResponse.json({
        success: true,
        imageUrl: `https://placehold.co/${size.replace("x", "x")}/B6F232/1a1a1a?text=AI+Generated`,
        prompt,
        model: "placeholder",
        message: dalleError.message || "Image generation failed",
      });
    }
  } catch (error: unknown) {
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
