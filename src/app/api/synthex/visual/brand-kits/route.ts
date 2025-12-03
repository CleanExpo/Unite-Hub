/**
 * GET /api/synthex/visual/brand-kits?tenantId=...
 * POST /api/synthex/visual/brand-kits
 *
 * Manage brand kits for visual generation
 *
 * GET - Fetch brand kits for a tenant
 * POST - Create a new brand kit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getBrandKit } from '@/lib/synthex/synthex-visual-orchestrator';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Fetch brand kits for this tenant
    const { data: brandKits, error } = await supabaseAdmin
      .from('synthex_brand_kits')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brand kits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brand kits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ brandKits: brandKits || [] }, { status: 200 });
  } catch (error) {
    console.error('Brand kits GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tenantId,
      name,
      primary_color,
      secondary_color,
      accent_color,
      font_primary,
      guidelines,
    } = body;

    // Validate required fields
    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name' },
        { status: 400 }
      );
    }

    // Create brand kit
    const { data: brandKit, error } = await supabaseAdmin
      .from('synthex_brand_kits')
      .insert({
        tenant_id: tenantId,
        name,
        primary_color: primary_color || '#0d2a5c',
        secondary_color: secondary_color || '#347bf7',
        accent_color: accent_color || '#ff5722',
        font_primary: font_primary || 'Inter, sans-serif',
        font_secondary: 'Inter, sans-serif',
        logo_url: '',
        guidelines: guidelines || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brand kit:', error);
      return NextResponse.json(
        { error: 'Failed to create brand kit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ brandKit }, { status: 201 });
  } catch (error) {
    console.error('Brand kits POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
