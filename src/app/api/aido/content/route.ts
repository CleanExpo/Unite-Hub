import { NextRequest, NextResponse } from 'next/server';
import { getContentAssets } from '@/lib/aido/database/content-assets';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const clientId = req.nextUrl.searchParams.get('clientId');
    const status = req.nextUrl.searchParams.get('status');

    const assets = await getContentAssets(workspaceId, {
      clientId: clientId || undefined,
      status: status || undefined,
    });

    // Calculate aggregate statistics
    const stats = {
      total: assets.length,
      byStatus: {
        draft: assets.filter(a => a.status === 'draft').length,
        review: assets.filter(a => a.status === 'review').length,
        published: assets.filter(a => a.status === 'published').length
      },
      averageScores: {
        authority: (assets.reduce((sum, a) => sum + a.authority_score, 0) / assets.length || 0).toFixed(2),
        evergreen: (assets.reduce((sum, a) => sum + a.evergreen_score, 0) / assets.length || 0).toFixed(2),
        aiSource: (assets.reduce((sum, a) => sum + a.ai_source_score, 0) / assets.length || 0).toFixed(2)
      },
      algorithmicImmunity: {
        count: assets.filter(a =>
          a.authority_score >= 0.8 &&
          a.evergreen_score >= 0.7 &&
          a.ai_source_score >= 0.8
        ).length,
        percentage: ((assets.filter(a =>
          a.authority_score >= 0.8 &&
          a.evergreen_score >= 0.7 &&
          a.ai_source_score >= 0.8
        ).length / assets.length) * 100 || 0).toFixed(1)
      }
    };

    return NextResponse.json({
      success: true,
      assets,
      stats,
      count: assets.length
    });

  } catch (error) {
    console.error('Get content assets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
