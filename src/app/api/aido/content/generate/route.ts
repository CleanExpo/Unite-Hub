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
      return rateLimitResult.response || NextResponse.json(
        {
          error: 'Rate limit exceeded',
          upgradeUrl: '/dashboard/settings/billing',
          message: 'Content generation requires AI calls. Upgrade to increase quota.',
          tier: rateLimitResult.tier,
          remaining: rateLimitResult.remaining,
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

    // Map contentType to valid type values
    const typeMap: Record<string, 'guide' | 'faq' | 'service' | 'product' | 'comparison'> = {
      'guide': 'guide',
      'faq': 'faq',
      'case_study': 'service',
      'resource': 'guide',
      'tool': 'product',
    };
    const mappedType = typeMap[contentType] || 'guide';

    // Generate content with AI (Claude Opus 4 Extended Thinking)
    const startTime = Date.now();
    const contentAsset = await generateContent({
      clientId,
      workspaceId,
      topicId,
      intentClusterId,
      title: `${contentType} - ${format}`,
      type: mappedType,
      targetScores: targetScores || {
        authority: 0.8,
        evergreen: 0.7,
        aiSource: 0.8
      },
    });
    const duration = Date.now() - startTime;

    // Cast to any for dynamic properties that may exist on the generated content
    const asset = contentAsset as any;
    return NextResponse.json({
      success: true,
      contentAsset,
      generation: {
        duration: `${(duration / 1000).toFixed(1)}s`,
        estimatedCost: '$0.80-1.20',
        iterations: asset.iterations || 1
      },
      scores: {
        authority: contentAsset.authorityScore || 0.5,
        evergreen: contentAsset.evergreenScore || 0.5,
        aiSource: contentAsset.aiSourceScore || 0.5,
        composite: (
          (contentAsset.authorityScore || 0.5) * 0.4 +
          (contentAsset.evergreenScore || 0.5) * 0.3 +
          (contentAsset.aiSourceScore || 0.5) * 0.3
        ).toFixed(2)
      },
      validation: {
        h2Questions: asset.validationResults?.h2Questions || 'N/A',
        fluffDetected: asset.validationResults?.fluffDetected || false,
        authorVerification: asset.validationResults?.authorVerification || false
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
