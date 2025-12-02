/**
 * POST /api/synthex/seo/analyze
 *
 * Perform SEO intelligence analysis on a domain
 *
 * Request body:
 * {
 *   tenantId: string
 *   domain: string
 *   keyword?: string
 *   competitors?: string[]
 *   analysisType: 'keyword_research' | 'competitor_analysis' | 'audit' | 'optimization' | 'comprehensive'
 * }
 *
 * Response:
 * {
 *   analysis: SeoAnalysisResult
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createSeoIntelligenceEngine } from '@/lib/synthex/seoIntelligenceEngine';

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
      domain,
      keyword,
      competitors = [],
      analysisType = 'comprehensive',
      country = 'US',
      language = 'en',
    } = body;

    // Validate required fields
    if (!tenantId || !domain || !analysisType) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, domain, analysisType' },
        { status: 400 }
      );
    }

    // Validate analysis type
    const validTypes = ['keyword_research', 'competitor_analysis', 'audit', 'optimization', 'comprehensive'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        {
          error: `Invalid analysisType. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, subscription_plan_code')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create SEO intelligence engine
    const seoEngine = createSeoIntelligenceEngine();

    // Perform analysis
    const analysis = await seoEngine.analyzeDomain({
      domain,
      keyword,
      competitors,
      analysisType,
      country,
      language,
    });

    // Store analysis result in database (for future reference)
    try {
      await supabaseAdmin.from('synthex_seo_analyses').insert({
        tenant_id: tenantId,
        domain,
        analysis_type: analysisType,
        result: analysis,
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      // Log but don't fail if storage fails
      console.error('Failed to store SEO analysis:', dbError);
    }

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'SEO analysis failed' },
      { status: 500 }
    );
  }
}
