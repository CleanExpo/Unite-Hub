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
    const minAISourceScore = req.nextUrl.searchParams.get('minAISourceScore');

    const assets = await getContentAssets(
      workspaceId,
      clientId || undefined,
      status || undefined,
      minAISourceScore ? parseFloat(minAISourceScore) : undefined
    );

    // Calculate aggregate statistics
    const stats = {
      total: assets.length,
      byStatus: {
        draft: assets.filter(a => a.status === 'draft').length,
        review: assets.filter(a => a.status === 'review').length,
        published: assets.filter(a => a.status === 'published').length
      },
      averageScores: {
        authority: (assets.reduce((sum, a) => sum + a.authorityScore, 0) / assets.length || 0).toFixed(2),
        evergreen: (assets.reduce((sum, a) => sum + a.evergreenScore, 0) / assets.length || 0).toFixed(2),
        aiSource: (assets.reduce((sum, a) => sum + a.aiSourceScore, 0) / assets.length || 0).toFixed(2)
      },
      algorithmicImmunity: {
        count: assets.filter(a =>
          a.authorityScore >= 0.8 &&
          a.evergreenScore >= 0.7 &&
          a.aiSourceScore >= 0.8
        ).length,
        percentage: ((assets.filter(a =>
          a.authorityScore >= 0.8 &&
          a.evergreenScore >= 0.7 &&
          a.aiSourceScore >= 0.8
        ).length / assets.length) * 100 || 0).toFixed(1)
      }
    };

    return NextResponse.json({
      success: true,
      assets,
      stats,
      count: assets.length
    });

  } catch (error: unknown) {
    console.error('Get content assets error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
