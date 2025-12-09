/**
 * Synthex Branding API
 * Phase D06: Auto-Branding Engine
 *
 * GET - Get brand profile and stats
 * PUT - Update brand profile
 * POST - Generate brand profile
 * DELETE - Delete brand profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBrandProfile,
  upsertBrandProfile,
  deleteBrandProfile,
  generateBrandProfile,
  getBrandingStats,
  getBrandContextForAI,
} from '@/lib/synthex/brandingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getBrandingStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }

    // Check if AI context requested
    if (searchParams.get('aiContext') === 'true') {
      const context = await getBrandContextForAI(tenantId);
      return NextResponse.json({ success: true, context });
    }

    const profile = await getBrandProfile(tenantId);

    return NextResponse.json({
      success: true,
      profile,
      exists: !!profile,
    });
  } catch (error) {
    console.error('[Branding API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get brand profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...profileData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const profile = await upsertBrandProfile(tenantId, profileData);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('[Branding API] PUT Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update brand profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, businessName, businessDescription, industry, targetAudience, existingBrandElements } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!businessName || !businessDescription) {
      return NextResponse.json(
        { error: 'businessName and businessDescription are required' },
        { status: 400 }
      );
    }

    const profile = await generateBrandProfile(tenantId, {
      businessName,
      businessDescription,
      industry,
      targetAudience,
      existingBrandElements,
    });

    return NextResponse.json({
      success: true,
      message: 'Brand profile generated',
      profile,
    }, { status: 201 });
  } catch (error) {
    console.error('[Branding API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brand profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    await deleteBrandProfile(tenantId);

    return NextResponse.json({
      success: true,
      message: 'Brand profile deleted',
    });
  } catch (error) {
    console.error('[Branding API] DELETE Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete brand profile' },
      { status: 500 }
    );
  }
}
