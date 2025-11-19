import { NextRequest } from 'next/server';
import { generateSectionCopy } from '@/lib/ai/claude-client';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const { businessName, description, section = 'hero' } = await req.json();

    if (!businessName || !description) {
      return Response.json(
        { error: 'Business name and description are required' },
        { status: 400 }
      );
    }

    // Generate marketing copy using Claude
    const copy = await generateSectionCopy({
      businessName,
      businessDescription: description,
      pageType: 'landing',
      sectionName: section,
    });

    return Response.json({
      success: true,
      copy,
      model: 'claude-3-5-sonnet',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Marketing copy generation error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to generate marketing copy',
      },
      { status: 500 }
    );
  }
}
