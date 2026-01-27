/**
 * POST /api/synthex/market-radar/analyze
 *
 * Run competitor analysis for a watched domain.
 * Creates a snapshot and generates alerts on significant changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SeoIntelligenceEngine } from '@/lib/synthex/seoIntelligenceEngine';
import { detectChanges } from '@/lib/synthex/marketRadarEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, watchId } = body;

    if (!tenantId || !watchId) {
      return NextResponse.json(
        { error: 'Missing tenantId or watchId' },
        { status: 400 }
      );
    }

    // Fetch the watch entry
    const { data: watch, error: watchError } = await supabaseAdmin
      .from('synthex_market_radar_watches')
      .select('*')
      .eq('id', watchId)
      .eq('tenant_id', tenantId)
      .single();

    if (watchError || !watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
    }

    // Run SEO competitor analysis
    const seoEngine = new SeoIntelligenceEngine();
    const analysis = await seoEngine.analyzeCompetitor(watch.domain);

    // Create snapshot
    const snapshotData = {
      tenant_id: tenantId,
      watch_id: watchId,
      domain: watch.domain,
      snapshot_type: 'seo',
      data: analysis,
      authority_score: analysis.authority ?? null,
      organic_keywords: analysis.organicKeywords ?? null,
      estimated_traffic: analysis.estimatedTraffic ?? null,
      backlinks: analysis.backlinks ?? null,
      content_count: null,
      social_followers: null,
    };

    const { data: snapshot, error: snapError } = await supabaseAdmin
      .from('synthex_market_radar_snapshots')
      .insert(snapshotData)
      .select()
      .single();

    if (snapError) {
      console.error('Snapshot create error:', snapError);
      return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
    }

    // Fetch previous snapshot for change detection
    const { data: prevSnapshots } = await supabaseAdmin
      .from('synthex_market_radar_snapshots')
      .select('*')
      .eq('watch_id', watchId)
      .neq('id', snapshot.id)
      .order('created_at', { ascending: false })
      .limit(1);

    let alertsGenerated = 0;
    if (prevSnapshots && prevSnapshots.length > 0) {
      const changes = detectChanges(prevSnapshots[0], snapshot);

      if (changes.length > 0) {
        const alertInserts = changes.map(c => ({
          tenant_id: tenantId,
          watch_id: watchId,
          alert_type: c.alertType,
          severity: c.severity,
          title: c.title,
          description: c.description,
          data: {},
        }));

        const { error: alertError } = await supabaseAdmin
          .from('synthex_market_radar_alerts')
          .insert(alertInserts);

        if (!alertError) alertsGenerated = changes.length;
      }
    }

    // Update last_checked_at
    await supabaseAdmin
      .from('synthex_market_radar_watches')
      .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', watchId);

    return NextResponse.json({
      snapshot,
      alertsGenerated,
      analysis: {
        authority: analysis.authority,
        organicKeywords: analysis.organicKeywords,
        estimatedTraffic: analysis.estimatedTraffic,
        backlinks: analysis.backlinks,
        topKeywords: analysis.topKeywords?.slice(0, 5) ?? [],
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
