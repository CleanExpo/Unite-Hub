/**
 * Synthex Brand Content Generation API
 * Phase B19: Generate content with brand voice
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateBrandedContent,
  getBrandVoicePrompt,
  type ContentGenerationOptions,
} from '@/lib/synthex/brandEngineService';

/**
 * POST /api/synthex/brand/generate
 * Generate content using the brand voice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, voiceId, ...options } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!options.contentType) {
      return NextResponse.json(
        { status: 'error', error: 'contentType is required (email, social, ad, landing_page, blog, other)' },
        { status: 400 }
      );
    }

    if (!options.topic) {
      return NextResponse.json(
        { status: 'error', error: 'topic is required' },
        { status: 400 }
      );
    }

    const generationOptions: ContentGenerationOptions = {
      contentType: options.contentType,
      topic: options.topic,
      context: options.context,
      length: options.length || 'medium',
      tone: options.tone,
      includeCallToAction: options.includeCallToAction,
      callToActionText: options.callToActionText,
      targetAudience: options.targetAudience,
    };

    const result = await generateBrandedContent(tenantId, generationOptions, voiceId);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      content: result.data?.content,
      subject: result.data?.subject,
      toneAnalysis: result.data?.toneAnalysis,
    });
  } catch (error) {
    console.error('[Brand Generate API] POST error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/synthex/brand/generate
 * Get the brand voice prompt for external use
 * This allows other AI services to incorporate brand voice
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const voiceId = searchParams.get('voiceId');

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await getBrandVoicePrompt(tenantId, voiceId || undefined);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      prompt: result.data,
      hasVoice: !!result.data && result.data.length > 0,
    });
  } catch (error) {
    console.error('[Brand Generate API] GET error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to get brand voice prompt' },
      { status: 500 }
    );
  }
}
