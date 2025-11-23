/**
 * Creative Quality API
 * Phase 61: Score creative assets for quality
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreativeDirectorEngine } from '@/lib/creative/creativeDirectorEngine';
import { CreativeQualityScorer } from '@/lib/creative/creativeQualityScorer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_id, asset_type, asset_data } = body;

    if (!client_id || !asset_type || !asset_data) {
      return NextResponse.json(
        { error: 'client_id, asset_type, and asset_data required' },
        { status: 400 }
      );
    }

    const director = new CreativeDirectorEngine();
    const scorer = new CreativeQualityScorer();

    // Get brand signature for validation
    const signature = await director.getBrandSignature(client_id);
    const brandColors = signature
      ? [...signature.primary_colors, ...signature.secondary_colors]
      : [];

    let score;

    switch (asset_type) {
      case 'visual':
        score = scorer.scoreVisual(asset_data, brandColors);
        break;

      case 'copy':
        const toneKeywords = signature?.tone_of_voice
          ? [signature.tone_of_voice]
          : [];
        const forbiddenPhrases = [
          'guaranteed',
          'instant',
          'overnight',
          '10x',
          'dominate',
        ];
        score = scorer.scoreCopy(asset_data, toneKeywords, forbiddenPhrases);
        break;

      case 'ux':
        score = scorer.scoreUX(asset_data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid asset_type. Use: visual, copy, or ux' },
          { status: 400 }
        );
    }

    // Also run through director validation
    const validation = await director.validateAsset(client_id, asset_type, asset_data);

    return NextResponse.json({
      data: {
        score,
        validation,
        brand_signature_exists: !!signature,
      },
    });
  } catch (error) {
    console.error('Creative quality API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    usage: {
      method: 'POST',
      body: {
        client_id: 'string (required)',
        asset_type: 'visual | copy | ux (required)',
        asset_data: 'object with metrics (required)',
      },
      example_visual: {
        colors_used: ['#2563eb', '#ffffff'],
        contrast_ratios: [4.5, 7.1],
        has_text_overlay: true,
        image_quality: 85,
        composition_score: 75,
      },
      example_copy: {
        word_count: 150,
        sentence_count: 8,
        avg_sentence_length: 18,
        readability_score: 72,
        tone_keywords: ['professional', 'reliable'],
        forbidden_phrases: [],
      },
    },
  });
}
