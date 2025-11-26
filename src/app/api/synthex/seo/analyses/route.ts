/**
 * GET /api/synthex/seo/analyses?tenantId=...
 *
 * Fetch SEO analyses for a tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Fetch SEO analyses (gracefully handle if table doesn't exist yet)
    let analyses = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('synthex_seo_analyses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error) {
        analyses = data || [];
      }
    } catch (dbError) {
      // Table may not exist yet - return empty list
      console.log('Note: synthex_seo_analyses table not found');
    }

    return NextResponse.json({ analyses }, { status: 200 });
  } catch (error) {
    console.error('Analyses GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
