import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// POST - Trigger SEO scan for a site
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data: userData, error: userError } = await supabaseBrowser.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, workspaceId, scanType = 'seo' } = body;

    if (!siteId || !workspaceId) {
      return NextResponse.json({ error: 'siteId and workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get site details
    const { data: site, error: siteError } = await supabase
      .from('client_sites')
      .select('*')
      .eq('id', siteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Create scan record
    const { data: scanResult, error: scanError } = await supabase
      .from('site_scan_results')
      .insert({
        site_id: siteId,
        workspace_id: workspaceId,
        scan_type: scanType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scanError) throw scanError;

    // Perform actual scan (simplified for now)
    const startTime = Date.now();

    // TODO: Integrate with actual SEO scanning service
    // For now, return mock results
    const mockIssues = [
      { type: 'missing_schema', severity: 'high', description: 'No LocalBusiness schema markup found' },
      { type: 'missing_meta', severity: 'medium', description: 'Meta description missing on homepage' },
      { type: 'missing_alt', severity: 'low', description: '5 images missing alt tags' }
    ];

    const mockScore = 72;

    // Update scan with results
    const { data: completedScan, error: updateError } = await supabase
      .from('site_scan_results')
      .update({
        status: 'completed',
        score: mockScore,
        issues: mockIssues,
        recommendations: [
          'Add LocalBusiness schema markup',
          'Add meta descriptions to all pages',
          'Add descriptive alt tags to images'
        ],
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      })
      .eq('id', scanResult.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update site with latest scan info
    await supabase
      .from('client_sites')
      .update({
        last_scan_at: new Date().toISOString(),
        seo_score: mockScore,
        issues_count: mockIssues.length
      })
      .eq('id', siteId);

    return NextResponse.json({
      success: true,
      scan: completedScan,
      site: { ...site, seo_score: mockScore, issues_count: mockIssues.length }
    });
  } catch (error) {
    console.error('[Sites Scan API] Error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
