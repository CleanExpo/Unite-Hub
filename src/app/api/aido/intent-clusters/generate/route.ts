import { NextRequest, NextResponse } from 'next/server';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import { generateIntentCluster } from '@/lib/aido/intent-cluster-ai';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AI rate limiting (stricter than API)
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'ai');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response || NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Intent cluster generation requires AI quota. Upgrade to increase limit.',
          upgradeUrl: '/dashboard/settings/billing',
          tier: rateLimitResult.tier
        },
        { status: 429 }
      );
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const {
      clientId,
      topicId,
      seedKeywords,
      industry,
      location,
      competitorDomains
    } = body;

    if (!clientId || !topicId || !seedKeywords || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, topicId, seedKeywords, industry' },
        { status: 400 }
      );
    }

    if (!Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return NextResponse.json(
        { error: 'seedKeywords must be non-empty array' },
        { status: 400 }
      );
    }

    // Generate intent cluster with AI
    const intentCluster = await generateIntentCluster({
      clientId,
      workspaceId,
      topicId,
      seedKeywords,
      industry,
      location
    });

    return NextResponse.json({
      success: true,
      intentCluster,
      cost: 0.40, // Approximate cost per generation
      message: 'Intent cluster generated successfully'
    });

  } catch (error: any) {
    console.error('Generate intent cluster error:', error);

    // Handle specific error types
    if (error.message.includes('PERPLEXITY_API_KEY')) {
      return NextResponse.json(
        { error: 'Perplexity API not configured. Contact support.' },
        { status: 503 }
      );
    }

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'Anthropic API not configured. Contact support.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
