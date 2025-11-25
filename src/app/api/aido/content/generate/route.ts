import { NextRequest, NextResponse } from 'next/server';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import { generateContent } from '@/lib/aido/content-generation-ai';
import { getClientProfile } from '@/lib/aido/database/client-profiles';

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

    // AI rate limiting (strictest limits)
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'ai');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          upgradeUrl: '/dashboard/settings/billing',
          message: 'Content generation requires AI calls. Upgrade to increase quota.'
        },
        { status: 429, headers: rateLimitResult.headers }
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
      intentClusterId,
      contentType,
      format,
      targetScores
    } = body;

    if (!clientId || !intentClusterId || !contentType || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, intentClusterId, contentType, format' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ['guide', 'faq', 'case_study', 'resource', 'tool'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['long_form', 'pillar', 'hub', 'interactive'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch client context
    const clientContext = await getClientProfile(clientId, workspaceId);

    // Generate content with AI (Claude Opus 4 Extended Thinking)
    const startTime = Date.now();
    const contentAsset = await generateContent({
      clientId,
      workspaceId,
      topicId,
      intentClusterId,
      contentType,
      format,
      targetScores: targetScores || {
        authority: 0.8,
        evergreen: 0.7,
        aiSource: 0.8
      },
      clientContext
    });
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      contentAsset,
      generation: {
        duration: `${(duration / 1000).toFixed(1)}s`,
        estimatedCost: '$0.80-1.20',
        iterations: contentAsset.iterations || 1
      },
      scores: {
        authority: contentAsset.authorityScore,
        evergreen: contentAsset.evergreenScore,
        aiSource: contentAsset.aiSourceScore,
        composite: (
          contentAsset.authorityScore * 0.4 +
          contentAsset.evergreenScore * 0.3 +
          contentAsset.aiSourceScore * 0.3
        ).toFixed(2)
      },
      validation: {
        h2Questions: contentAsset.validationResults?.h2Questions || 'N/A',
        fluffDetected: contentAsset.validationResults?.fluffDetected || false,
        authorVerification: contentAsset.validationResults?.authorVerification || false
      },
      message: 'Content generated successfully. Review and publish when ready.'
    });

  } catch (error: any) {
    console.error('Generate content error:', error);

    // Handle specific validation errors
    if (error.message.includes('validation failed')) {
      return NextResponse.json(
        {
          error: 'Content validation failed',
          details: error.message,
          suggestion: 'AI-generated content did not meet AIDO structure rules. Retrying...'
        },
        { status: 422 }
      );
    }

    // Handle API configuration errors
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
