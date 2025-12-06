/**
 * Synthex Brand Voice API
 * Phase B19: CRUD operations for brand voice profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBrandVoices,
  getDefaultBrandVoice,
  createBrandVoice,
  updateBrandVoice,
  deleteBrandVoice,
  type BrandVoiceInput,
} from '@/lib/synthex/brandEngineService';

/**
 * GET /api/synthex/brand/voice
 * List brand voices for a tenant or get default voice
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const defaultOnly = searchParams.get('default') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (defaultOnly) {
      const result = await getDefaultBrandVoice(tenantId);
      if (!result.success) {
        return NextResponse.json(
          { status: 'error', error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({
        status: 'ok',
        voice: result.data,
      });
    }

    const result = await getBrandVoices(tenantId, activeOnly);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      voices: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('[Brand Voice API] GET error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch brand voices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/brand/voice
 * Create a new brand voice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, ...voiceInput } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!voiceInput.brandName) {
      return NextResponse.json(
        { status: 'error', error: 'brandName is required' },
        { status: 400 }
      );
    }

    const result = await createBrandVoice(tenantId, voiceInput as BrandVoiceInput);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      voice: result.data,
    });
  } catch (error) {
    console.error('[Brand Voice API] POST error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to create brand voice' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/synthex/brand/voice
 * Update an existing brand voice
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, voiceId, ...voiceInput } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { status: 'error', error: 'voiceId is required' },
        { status: 400 }
      );
    }

    const result = await updateBrandVoice(tenantId, voiceId, voiceInput);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      voice: result.data,
    });
  } catch (error) {
    console.error('[Brand Voice API] PUT error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to update brand voice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synthex/brand/voice
 * Delete a brand voice
 */
export async function DELETE(request: NextRequest) {
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

    if (!voiceId) {
      return NextResponse.json(
        { status: 'error', error: 'voiceId is required' },
        { status: 400 }
      );
    }

    const result = await deleteBrandVoice(tenantId, voiceId);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      deleted: true,
    });
  } catch (error) {
    console.error('[Brand Voice API] DELETE error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to delete brand voice' },
      { status: 500 }
    );
  }
}
