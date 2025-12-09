/**
 * Synthex Brands API
 * Phase B39: White-Label & Multi-Brand Settings
 *
 * GET  - List all brands for tenant
 * POST - Create a new brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listBrands,
  createBrand,
  getDefaultBrand,
  CreateBrandInput,
} from '@/lib/synthex/brandService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    const brands = await listBrands(tenantId);
    const defaultBrand = await getDefaultBrand(tenantId);

    return NextResponse.json({
      brands,
      defaultBrandId: defaultBrand?.id || null,
      count: brands.length,
    });
  } catch (error) {
    console.error('Error in brands GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...brandInput } = body;

    if (!tenantId || !brandInput.name) {
      return NextResponse.json(
        { error: 'tenantId and name are required' },
        { status: 400 }
      );
    }

    const input: CreateBrandInput = {
      name: brandInput.name,
      slug: brandInput.slug,
      description: brandInput.description,
      primary_color: brandInput.primary_color,
      secondary_color: brandInput.secondary_color,
      accent_color: brandInput.accent_color,
      text_color: brandInput.text_color,
      background_color: brandInput.background_color,
      logo_url: brandInput.logo_url,
      logo_dark_url: brandInput.logo_dark_url,
      favicon_url: brandInput.favicon_url,
      sending_domain: brandInput.sending_domain,
      custom_domain: brandInput.custom_domain,
      from_name: brandInput.from_name,
      from_email: brandInput.from_email,
      reply_to_email: brandInput.reply_to_email,
      is_default: brandInput.is_default,
      metadata: brandInput.metadata,
    };

    const brand = await createBrand(tenantId, input);

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('Error in brands POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
