/**
 * Synthex Brand Default API
 * Phase B39: White-Label & Multi-Brand Settings
 *
 * POST - Set brand as default for tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setDefaultBrand } from '@/lib/synthex/brandService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: brandId } = await params;
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const brand = await setDefaultBrand(brandId, tenantId);

    return NextResponse.json({
      brand,
      message: `Brand "${brand.name}" is now the default for this tenant`,
    });
  } catch (error) {
    console.error('Error in brands/[id]/default POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
