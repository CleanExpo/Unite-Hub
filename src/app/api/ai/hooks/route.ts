import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { HOOKS_SYSTEM_PROMPT, buildHooksUserPrompt } from '@/lib/claude/prompts';

export const runtime = 'edge';

interface HooksRequest {
  persona: any;
  business: string;
  platforms: string[];
  toneOfVoice?: string;
  contactId?: string;
}

interface HooksResponse {
  hooks: Array<{
    platform: string;
    funnelStage: 'awareness' | 'interest' | 'consideration' | 'decision';
    hook: string;
    variant: string;
    effectiveness: number;
    context: string;
    followUp: string;
  }>;
  recommendations: {
    topPerformers: number[];
    testingStrategy: string;
    optimizationTips: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter.checkLimit();

    const body: HooksRequest = await req.json();

    // Validate input
    if (!body.persona || !body.business || !body.platforms) {
      return NextResponse.json(
        { error: 'Missing required fields: persona, business, platforms' },
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
    const userPrompt = buildHooksUserPrompt({
      persona: body.persona,
      business: body.business,
      platforms: body.platforms,
      toneOfVoice: body.toneOfVoice,
    });

    // Call Claude API with high creativity for hooks
    const message = await createMessage(
      [{ role: 'user', content: userPrompt }],
      HOOKS_SYSTEM_PROMPT,
      {
        temperature: 0.9,
        max_tokens: 4096,
      }
    );

    // Parse response
    const response = parseJSONResponse<HooksResponse>(message);

    // Return hooks data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
        hooksGenerated: response.hooks.length,
        platformsCount: body.platforms.length,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      },
    });
  } catch (error: any) {
    console.error('Hooks generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate hooks',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/hooks',
    method: 'POST',
    description: 'Generate attention-grabbing hooks for various platforms',
    requiredFields: ['persona', 'business', 'platforms[]'],
    optionalFields: ['toneOfVoice', 'contactId'],
    example: {
      persona: {
        name: 'Sarah the Startup Founder',
        painPoints: [
          {
            pain: 'Limited marketing budget',
          },
        ],
        goals: [
          {
            goal: 'Grow brand awareness',
          },
        ],
      },
      business: 'Sustainable fashion e-commerce startup',
      platforms: ['TikTok', 'Instagram', 'LinkedIn'],
      toneOfVoice: 'Authentic, conversational, inspiring',
    },
  });
}
