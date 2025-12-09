/**
 * Synthex Brand Detail API
 * Phase B39: White-Label & Multi-Brand Settings
 *
 * GET    - Get single brand by ID
 * PATCH  - Update brand
 * DELETE - Delete brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBrand,
  updateBrand,
  deleteBrand,
  getBrandTheme,
  getBrandCSSVariables,
  UpdateBrandInput,
} from '@/lib/synthex/brandService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const brand = await getBrand(brandId, tenantId);

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Include theme and CSS variables for convenience
    const theme = getBrandTheme(brand);
    const cssVariables = getBrandCSSVariables(brand);

    return NextResponse.json({
      brand,
      theme,
      cssVariables,
    });
  } catch (error) {
    console.error('Error in brands/[id] GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;
    const body = await request.json();
    const { tenantId, ...patch } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const updateInput: UpdateBrandInput = {
      name: patch.name,
      slug: patch.slug,
      description: patch.description,
      primary_color: patch.primary_color,
      secondary_color: patch.secondary_color,
      accent_color: patch.accent_color,
      text_color: patch.text_color,
      background_color: patch.background_color,
      logo_url: patch.logo_url,
      logo_dark_url: patch.logo_dark_url,
      favicon_url: patch.favicon_url,
      sending_domain: patch.sending_domain,
      custom_domain: patch.custom_domain,
      from_name: patch.from_name,
      from_email: patch.from_email,
      reply_to_email: patch.reply_to_email,
      is_default: patch.is_default,
      is_active: patch.is_active,
      metadata: patch.metadata,
    };

    // Remove undefined values
    Object.keys(updateInput).forEach((key) => {
      if (updateInput[key as keyof UpdateBrandInput] === undefined) {
        delete updateInput[key as keyof UpdateBrandInput];
      }
    });

    const brand = await updateBrand(brandId, tenantId, updateInput);

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Error in brands/[id] PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    await deleteBrand(brandId, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in brands/[id] DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
