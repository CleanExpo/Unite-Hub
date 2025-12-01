import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { MINDMAP_SYSTEM_PROMPT, buildMindmapUserPrompt } from '@/lib/claude/prompts';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";


interface MindmapRequest {
  emails: Array<{
    from: string;
    subject: string;
    body: string;
    date: string;
  }>;
  focusArea?: string;
  contactId?: string;
}

interface MindmapResponse {
  mindmap: {
    centralNode: {
      id: string;
      label: string;
      type: 'central';
    };
    nodes: Array<{
      id: string;
      label: string;
      type: 'category' | 'topic' | 'idea' | 'goal' | 'pain_point' | 'solution' | 'question';
      parentId: string;
      depth: number;
      metadata: {
        source: string;
        importance: 'low' | 'medium' | 'high';
        frequency: number;
      };
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: 'causes' | 'relates_to' | 'solves' | 'requires' | 'enables';
      strength: number;
    }>;
  };
  insights: {
    mainThemes: string[];
    gaps: string[];
    opportunities: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Rate limiting
    await rateLimiter.checkLimit();

    const body: MindmapRequest = await req.json();

    // Validate input
    if (!body.emails || body.emails.length === 0) {
      return NextResponse.json(
        { error: 'At least one email is required' },
        { status: 400 }
      );
    }

    // Build user prompt - map email data to function parameters
    const emailSummary = body.emails.map(e => `From: ${e.from}\nSubject: ${e.subject}\n${e.body}`).join('\n\n---\n\n');
    const userPrompt = buildMindmapUserPrompt({
      topic: body.emails[0]?.subject || 'Email Analysis',
      businessContext: emailSummary,
      focus: body.focusArea,
    });

    // Call Claude API
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      {
        system: MINDMAP_SYSTEM_PROMPT,
        temperature: 0.6,
        maxTokens: 4096,
      }
    );

    // Parse response
    const response = parseJSONResponse<MindmapResponse>(message);

    // Return mindmap data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
        emailsAnalyzed: body.emails.length,
        nodesGenerated: response.mindmap.nodes.length,
        relationshipsIdentified: response.mindmap.relationships.length,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      },
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
    console.error('Mindmap generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate mindmap',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/mindmap',
    method: 'POST',
    description: 'Extract key concepts and relationships for mind map visualization',
    requiredFields: ['emails[]'],
    optionalFields: ['focusArea', 'contactId'],
    example: {
      emails: [
        {
          from: 'client@example.com',
          subject: 'Marketing challenges',
          body: 'We are struggling with social media engagement and need help with content strategy...',
          date: '2025-01-10',
        },
        {
          from: 'client@example.com',
          subject: 'Re: Marketing challenges',
          body: 'Also, we want to improve our email marketing and conversion rates...',
          date: '2025-01-12',
        },
      ],
      focusArea: 'Digital marketing strategy',
    },
  });
}
