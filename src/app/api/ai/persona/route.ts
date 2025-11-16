import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { PERSONA_SYSTEM_PROMPT, buildPersonaUserPrompt } from '@/lib/claude/prompts';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";


interface PersonaRequest {
  emails: Array<{
    from: string;
    subject: string;
    body: string;
  }>;
  businessDescription?: string;
  assets?: Array<{
    type: string;
    description: string;
  }>;
  notes?: string;
  contactId?: string;
}

interface PersonaResponse {
  persona: {
    name: string;
    tagline: string;
    demographics: {
      ageRange: string;
      location: string;
      industry: string;
      role: string;
      companySize: string;
      income: string;
    };
    psychographics: {
      values: string[];
      interests: string[];
      motivations: string[];
      fears: string[];
      personality: string;
    };
    painPoints: Array<{
      pain: string;
      impact: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    goals: Array<{
      goal: string;
      priority: 'low' | 'medium' | 'high';
      timeframe: string;
    }>;
    communication: {
      preferredChannels: string[];
      tone: string;
      frequency: string;
    };
    buyingBehavior: {
      decisionMakers: string[];
      decisionProcess: string;
      budgetConsiderations: string;
      objections: string[];
    };
    contentPreferences: {
      formats: string[];
      topics: string[];
      mediaConsumption: string[];
    };
  };
  confidence: {
    score: number;
    dataQuality: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await aiAgentRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }


    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    // Rate limiting
    await rateLimiter.checkLimit();

    const body: PersonaRequest = await req.json();

    // Validate input
    if (!body.emails || body.emails.length === 0) {
      return NextResponse.json(
        { error: 'At least one email is required' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = buildPersonaUserPrompt({
      emails: body.emails,
      businessDescription: body.businessDescription,
      assets: body.assets,
      notes: body.notes,
    });

    // Call Claude API with higher token limit for complex analysis
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      PERSONA_SYSTEM_PROMPT,
      {
        temperature: 0.6,
        max_tokens: 4096,
      }
    );

    // Parse response
    const response = parseJSONResponse<PersonaResponse>(message);

    // Return persona data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
        emailsAnalyzed: body.emails.length,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      },
    });
  } catch (error: any) {
    console.error('Persona generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate persona',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/persona',
    method: 'POST',
    description: 'Generate customer persona from emails and business data',
    requiredFields: ['emails[]'],
    optionalFields: ['businessDescription', 'assets[]', 'notes', 'contactId'],
    example: {
      emails: [
        {
          from: 'client@example.com',
          subject: 'Need help with marketing',
          body: 'We are a small startup looking to grow our online presence...',
        },
      ],
      businessDescription: 'E-commerce startup selling sustainable fashion',
      assets: [
        {
          type: 'logo',
          description: 'Modern, minimalist logo with green color palette',
        },
      ],
      notes: 'Very interested in Instagram and TikTok marketing',
    },
  });
}
