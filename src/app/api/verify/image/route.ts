/**
 * Image Validation API Route
 * POST /api/verify/image
 *
 * Validates uploaded images for property damage assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateImage, quickValidateImage } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_data, mime_type, options, quick } = body;

    if (!image_data || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required fields: image_data, mime_type' },
        { status: 400 }
      );
    }

    // Quick validation (no AI)
    if (quick) {
      const result = quickValidateImage(image_data, mime_type);
      return NextResponse.json(result);
    }

    // Full validation with AI
    const result = await validateImage(image_data, mime_type, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Image validation error:', error);
    return NextResponse.json(
      { error: 'Image validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
