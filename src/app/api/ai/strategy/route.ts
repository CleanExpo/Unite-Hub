import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { STRATEGY_SYSTEM_PROMPT, buildStrategyUserPrompt } from '@/lib/claude/prompts';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";


interface StrategyRequest {
  persona: any;
  businessGoals: string;
  budget?: string;
  timeline?: string;
  competitors?: string[];
  contactId?: string;
}

interface StrategyResponse {
  strategy: {
    marketAnalysis: {
      targetMarket: string;
      marketSize: string;
      trends: string[];
      opportunities: string[];
      threats: string[];
    };
    positioning: {
      uvp: string;
      differentiation: string;
      brandVoice: string;
      messagingPillars: string[];
    };
    platforms: Array<{
      platform: string;
      priority: 'high' | 'medium' | 'low';
      rationale: string;
      targetAudience: string;
      contentTypes: string[];
    }>;
    contentStrategy: {
      themes: string[];
      contentPillars: Array<{
        pillar: string;
        description: string;
        topics: string[];
      }>;
      contentMix: {
        educational: number;
        promotional: number;
        engagement: number;
        entertainment: number;
      };
    };
    campaigns: Array<{
      name: string;
      goal: string;
      platforms: string[];
      duration: string;
      budget: string;
      tactics: string[];
    }>;
    metrics: {
      kpis: Array<{
        metric: string;
        target: string;
        measurement: string;
      }>;
      tools: string[];
    };
    timeline: {
      phase1: {
        duration: string;
        focus: string;
        deliverables: string[];
      };
      phase2: {
        duration: string;
        focus: string;
        deliverables: string[];
      };
      phase3: {
        duration: string;
        focus: string;
        deliverables: string[];
      };
    };
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

    const body: StrategyRequest = await req.json();

    // Validate input
    if (!body.persona || !body.businessGoals) {
      return NextResponse.json(
        { error: 'Missing required fields: persona, businessGoals' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = buildStrategyUserPrompt({
      persona: body.persona,
      businessGoals: body.businessGoals,
      budget: body.budget,
      timeline: body.timeline,
      competitors: body.competitors,
    });

    // Call Claude API with maximum token limit for comprehensive strategy
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      STRATEGY_SYSTEM_PROMPT,
      {
        temperature: 0.7,
        max_tokens: 4096,
      }
    );

    // Parse response
    const response = parseJSONResponse<StrategyResponse>(message);

    // Return strategy data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
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
    console.error('Strategy generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate strategy',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/strategy',
    method: 'POST',
    description: 'Generate comprehensive marketing strategy',
    requiredFields: ['persona', 'businessGoals'],
    optionalFields: ['budget', 'timeline', 'competitors[]', 'contactId'],
    example: {
      persona: {
        name: 'Sarah the Startup Founder',
        demographics: {
          ageRange: '28-35',
          industry: 'E-commerce',
        },
        painPoints: [
          {
            pain: 'Limited marketing budget',
            severity: 'high',
          },
        ],
      },
      businessGoals: 'Increase brand awareness and generate 1000 leads in 3 months',
      budget: '$5,000/month',
      timeline: '3 months',
      competitors: ['Company A', 'Company B'],
    },
  });
}
