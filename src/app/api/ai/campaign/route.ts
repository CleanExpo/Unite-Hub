import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { CAMPAIGN_SYSTEM_PROMPT, buildCampaignUserPrompt } from '@/lib/claude/prompts';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";


interface CampaignRequest {
  strategy: any;
  platforms: string[];
  budget: string;
  duration: string;
  objective: string;
  contactId?: string;
}

interface CampaignResponse {
  campaign: {
    name: string;
    objective: string;
    duration: string;
    platforms: Array<{
      platform: string;
      adSets: Array<{
        name: string;
        targeting: {
          demographics: string[];
          interests: string[];
          behaviors: string[];
        };
        ads: Array<{
          format: string;
          headline: string;
          primaryText: string;
          description: string;
          cta: string;
          visualRequirements: {
            dimensions: string;
            type: string;
            specifications: string;
          };
        }>;
      }>;
    }>;
    contentCalendar: Array<{
      date: string;
      platform: string;
      contentType: string;
      content: string;
      hashtags: string[];
      visualNeeds: string;
      bestTimeToPost: string;
    }>;
    abTests: Array<{
      element: string;
      variationA: string;
      variationB: string;
      hypothesis: string;
    }>;
    budget: {
      total: string;
      allocation: Array<{
        platform: string;
        percentage: number;
        amount: string;
      }>;
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


    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    // Rate limiting
    await rateLimiter.checkLimit();

    const body: CampaignRequest = await req.json();

    // Validate input
    if (!body.strategy || !body.platforms || !body.budget || !body.duration || !body.objective) {
      return NextResponse.json(
        { error: 'Missing required fields: strategy, platforms, budget, duration, objective' },
        { status: 400 }
      );
    }

    if (body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = buildCampaignUserPrompt({
      strategy: body.strategy,
      platforms: body.platforms,
      budget: body.budget,
      duration: body.duration,
      objective: body.objective,
    });

    // Call Claude API with maximum token limit for comprehensive campaign
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      CAMPAIGN_SYSTEM_PROMPT,
      {
        temperature: 0.8,
        max_tokens: 4096,
      }
    );

    // Parse response
    const response = parseJSONResponse<CampaignResponse>(message);

    // Return campaign data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
        platformsCount: body.platforms.length,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      },
    });
  } catch (error: any) {
    console.error('Campaign generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate campaign',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/campaign',
    method: 'POST',
    description: 'Generate platform-specific campaign content',
    requiredFields: ['strategy', 'platforms[]', 'budget', 'duration', 'objective'],
    optionalFields: ['contactId'],
    example: {
      strategy: {
        positioning: {
          uvp: 'Sustainable fashion for conscious consumers',
        },
        platforms: [
          {
            platform: 'Instagram',
            priority: 'high',
          },
        ],
      },
      platforms: ['Instagram', 'Facebook', 'TikTok'],
      budget: '$5,000',
      duration: '30 days',
      objective: 'Brand awareness and lead generation',
    },
  });
}
