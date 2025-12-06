/**
 * POST /api/synthex/insights/run
 *
 * Generate AI-powered insights for a tenant.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   brandId?: string
 *   categories?: ('seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general')[]
 * }
 *
 * Phase: B5 - Synthex Analytics + Insights Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateInsights } from '@/lib/synthex/insightService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, categories } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await generateInsights({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      categories,
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      insights: result.data?.insights || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[insights/run] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
