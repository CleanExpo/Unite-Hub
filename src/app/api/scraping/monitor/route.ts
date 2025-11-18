/**
 * API Route: Competitor Monitoring
 * Endpoint: POST /api/scraping/monitor
 * Monitors competitor websites for changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { url, competitorId } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get previous analysis for this competitor
    const { data: previousAnalysis } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('url', url)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Perform new analysis (call the analyze endpoint internally)
    const analyzeUrl = new URL('/api/scraping/analyze', req.url);
    analyzeUrl.searchParams.set('workspaceId', workspaceId);

    const analyzeResponse = await fetch(analyzeUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify({
        url,
        analysisType: 'competitor',
        saveToDatabase: true,
      }),
    });

    const currentAnalysis = await analyzeResponse.json();

    if (!currentAnalysis.success) {
      return NextResponse.json(
        { error: 'Failed to analyze competitor' },
        { status: 500 }
      );
    }

    // Compare with previous analysis
    const changes: any[] = [];

    if (previousAnalysis) {
      const oldData = previousAnalysis.data;
      const newData = currentAnalysis.data;

      // Compare title
      if (oldData.seo_analysis?.title?.text !== newData.seo_analysis?.title?.text) {
        changes.push({
          field: 'title',
          old: oldData.seo_analysis?.title?.text,
          new: newData.seo_analysis?.title?.text,
          type: 'change',
        });
      }

      // Compare pricing
      if (oldData.pricing_info?.has_pricing_page !== newData.pricing_info?.has_pricing_page) {
        changes.push({
          field: 'pricing_page',
          old: oldData.pricing_info?.has_pricing_page,
          new: newData.pricing_info?.has_pricing_page,
          type: 'change',
        });
      }

      // Compare feature count
      const oldFeatureCount = oldData.features?.length || 0;
      const newFeatureCount = newData.features?.length || 0;

      if (oldFeatureCount !== newFeatureCount) {
        changes.push({
          field: 'feature_count',
          old: oldFeatureCount,
          new: newFeatureCount,
          type: 'change',
        });
      }
    }

    // Save monitoring result
    const { error: monitorError } = await supabase
      .from('competitor_monitoring')
      .insert({
        workspace_id: workspaceId,
        competitor_id: competitorId,
        url,
        changes_detected: changes.length > 0,
        changes,
        previous_analysis_id: previousAnalysis?.id || null,
        current_analysis_id: currentAnalysis.data?.id || null,
        monitored_at: new Date().toISOString(),
      });

    if (monitorError) {
      console.error('Error saving monitoring result:', monitorError);
    }

    return NextResponse.json({
      success: true,
      url,
      changes_detected: changes.length > 0,
      changes,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Monitoring error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to monitor competitor',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve monitoring history
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const competitorId = req.nextUrl.searchParams.get('competitorId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('competitor_monitoring')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('monitored_at', { ascending: false });

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error('Error fetching monitoring history:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch monitoring history',
      },
      { status: 500 }
    );
  }
}
